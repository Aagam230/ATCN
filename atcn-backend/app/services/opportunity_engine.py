"""
AI Opportunity Engine.
Scans NSE universe for trade opportunities using:
  1. yfinance momentum / technical signals (free)
  2. NewsAPI sentiment scoring (free tier, 100 req/day)
  3. Optional: Anthropic Claude thesis generation if API key set

Runs on a 15-minute Celery schedule; results stored in DB and Redis cache.
"""
import asyncio
import json
import logging
import math
from datetime import datetime, timedelta, timezone

import httpx
import yfinance as yf

from app.cache import cache_get, cache_set
from app.config import settings

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# NSE universe — NIFTY 50 constituents (yfinance symbols)
# ---------------------------------------------------------------------------
NIFTY50_UNIVERSE = [
    ("RELIANCE",   "RELIANCE.NS",  "Reliance Industries"),
    ("TCS",        "TCS.NS",       "Tata Consultancy Services"),
    ("HDFCBANK",   "HDFCBANK.NS",  "HDFC Bank"),
    ("INFY",       "INFY.NS",      "Infosys"),
    ("ICICIBANK",  "ICICIBANK.NS", "ICICI Bank"),
    ("HINDUNILVR", "HINDUNILVR.NS","Hindustan Unilever"),
    ("ITC",        "ITC.NS",       "ITC Limited"),
    ("SBIN",       "SBIN.NS",      "State Bank of India"),
    ("BAJFINANCE", "BAJFINANCE.NS","Bajaj Finance"),
    ("BHARTIARTL", "BHARTIARTL.NS","Bharti Airtel"),
    ("KOTAKBANK",  "KOTAKBANK.NS", "Kotak Mahindra Bank"),
    ("LT",         "LT.NS",        "Larsen & Toubro"),
    ("AXISBANK",   "AXISBANK.NS",  "Axis Bank"),
    ("ASIANPAINT", "ASIANPAINT.NS","Asian Paints"),
    ("MARUTI",     "MARUTI.NS",    "Maruti Suzuki"),
    ("SUNPHARMA",  "SUNPHARMA.NS", "Sun Pharmaceutical"),
    ("TITAN",      "TITAN.NS",     "Titan Company"),
    ("ULTRACEMCO", "ULTRACEMCO.NS","UltraTech Cement"),
    ("WIPRO",      "WIPRO.NS",     "Wipro"),
    ("ONGC",       "ONGC.NS",      "ONGC"),
    ("HCLTECH",    "HCLTECH.NS",   "HCL Technologies"),
    ("TATAMOTORS", "TATAMOTORS.NS","Tata Motors"),
    ("M&M",        "M&M.NS",       "Mahindra & Mahindra"),
    ("NTPC",       "NTPC.NS",      "NTPC"),
    ("POWERGRID",  "POWERGRID.NS", "Power Grid Corporation"),
    ("TECHM",      "TECHM.NS",     "Tech Mahindra"),
    ("NESTLEIND",  "NESTLEIND.NS", "Nestle India"),
    ("BAJAJFINSV", "BAJAJFINSV.NS","Bajaj Finserv"),
    ("DRREDDY",    "DRREDDY.NS",   "Dr. Reddy's Laboratories"),
    ("CIPLA",      "CIPLA.NS",     "Cipla"),
]

# ---------------------------------------------------------------------------
# Technical signal computation
# ---------------------------------------------------------------------------

def _sma(prices: list[float], period: int) -> float | None:
    if len(prices) < period:
        return None
    return sum(prices[-period:]) / period


def _rsi(prices: list[float], period: int = 14) -> float | None:
    if len(prices) < period + 1:
        return None
    deltas = [prices[i] - prices[i - 1] for i in range(1, len(prices))]
    gains  = [max(d, 0) for d in deltas[-period:]]
    losses = [-min(d, 0) for d in deltas[-period:]]
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 2)


def _score_signals(ticker_data: dict) -> tuple[int, str, list[str], str]:
    """
    Score a ticker using momentum signals.
    Returns (confidence 0-100, horizon, tags, opportunity_type).
    """
    prices = ticker_data["closes"]
    rsi    = ticker_data.get("rsi")
    sma20  = ticker_data.get("sma20")
    sma50  = ticker_data.get("sma50")
    sma200 = ticker_data.get("sma200")
    price  = prices[-1] if prices else 0
    w52h   = ticker_data.get("week_52_high", price)
    w52l   = ticker_data.get("week_52_low", price)

    signals = []
    score   = 50   # baseline

    # Trend signals
    if sma20 and sma50 and sma20 > sma50:
        score += 10
        signals.append("Short-term trend up")
    if sma50 and sma200 and sma50 > sma200:
        score += 10
        signals.append("Golden cross")

    # Momentum
    if rsi:
        if 55 < rsi < 70:
            score += 8
            signals.append("RSI momentum")
        elif rsi > 70:
            score -= 8
            signals.append("Overbought RSI")
        elif rsi < 30:
            score -= 12
            signals.append("Oversold — potential reversal")

    # Price vs 52-week range
    if w52h and w52l:
        pct_of_range = (price - w52l) / (w52h - w52l) if w52h > w52l else 0.5
        if 0.55 < pct_of_range < 0.85:
            score += 6
            signals.append("Mid-range breakout zone")
        elif pct_of_range > 0.90:
            score -= 6
            signals.append("Near 52W high — limited upside")

    score = min(95, max(25, score))

    # Determine type
    if score >= 70:
        opp_type = "long"
        horizon  = "4-8 weeks"
    elif score >= 55:
        opp_type = "rotation"
        horizon  = "2-4 weeks"
    elif score < 35:
        opp_type = "short"
        horizon  = "2-3 weeks"
    else:
        opp_type = "hedge"
        horizon  = "3-6 weeks"

    return score, horizon, signals[:3], opp_type


def _fetch_ticker_signals(yf_sym: str) -> dict | None:
    try:
        t = yf.Ticker(yf_sym)
        hist = t.history(period="1y", interval="1d")
        if hist.empty or len(hist) < 30:
            return None
        closes = list(hist["Close"].astype(float))
        info   = t.fast_info
        return {
            "closes":       closes,
            "rsi":          _rsi(closes),
            "sma20":        _sma(closes, 20),
            "sma50":        _sma(closes, 50),
            "sma200":       _sma(closes, 200),
            "week_52_high": getattr(info, "year_high", None),
            "week_52_low":  getattr(info, "year_low", None),
            "current":      closes[-1],
        }
    except Exception as exc:
        log.debug("Signal fetch failed for %s: %s", yf_sym, exc)
        return None


# ---------------------------------------------------------------------------
# NewsAPI sentiment
# ---------------------------------------------------------------------------

async def _news_sentiment(company_name: str) -> float:
    """
    Query NewsAPI for recent headlines about a company.
    Returns sentiment score -1.0 (bearish) to +1.0 (bullish).
    Free tier: 100 req/day.
    """
    if not settings.NEWS_API_KEY:
        return 0.0

    url = "https://newsapi.org/v2/everything"
    params = {
        "q":        f'"{company_name}" NSE stock',
        "from":     (datetime.now(timezone.utc) - timedelta(days=3)).strftime("%Y-%m-%d"),
        "sortBy":   "relevancy",
        "pageSize": 5,
        "apiKey":   settings.NEWS_API_KEY,
        "language": "en",
    }
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                return 0.0
            articles = resp.json().get("articles", [])
            if not articles:
                return 0.0

        # Naive keyword scoring — replace with proper NLP if needed
        positive = {"surge", "gain", "beat", "strong", "buy", "upgrade", "record", "growth", "profit"}
        negative = {"fall", "drop", "miss", "weak", "sell", "downgrade", "loss", "debt", "probe"}
        score = 0
        for art in articles:
            text = ((art.get("title") or "") + " " + (art.get("description") or "")).lower()
            score += sum(1 for w in positive if w in text)
            score -= sum(1 for w in negative if w in text)
        return max(-1.0, min(1.0, score / (len(articles) * 3)))
    except Exception as exc:
        log.debug("NewsAPI failed for %s: %s", company_name, exc)
        return 0.0


# ---------------------------------------------------------------------------
# Optional: Claude thesis generation
# ---------------------------------------------------------------------------

async def _claude_thesis(ticker: str, name: str, signals: list[str], sentiment: float) -> str:
    """Generate a concise investment thesis using Claude API if key is set."""
    if not settings.ANTHROPIC_API_KEY:
        sig_text = "; ".join(signals) if signals else "momentum setup"
        sent_text = "positive news sentiment" if sentiment > 0.1 else ("negative sentiment headwind" if sentiment < -0.1 else "neutral news backdrop")
        return f"{name} shows {sig_text} with {sent_text}. NSE technical setup favourable for medium-term positioning."

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        prompt = (
            f"Write a concise 1-2 sentence investment thesis for {name} ({ticker} on NSE India). "
            f"Technical signals: {', '.join(signals) or 'momentum setup'}. "
            f"News sentiment score: {sentiment:.2f} (-1=bearish, +1=bullish). "
            f"Keep it professional, specific, and under 40 words."
        )
        message = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=80,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text.strip()
    except Exception as exc:
        log.warning("Claude thesis generation failed: %s", exc)
        sig_text = "; ".join(signals) if signals else "momentum setup"
        return f"{name} presents a {sig_text} opportunity. NSE technicals support medium-term directional trade."


# ---------------------------------------------------------------------------
# Main scan function
# ---------------------------------------------------------------------------

async def scan_opportunities(limit: int = 8) -> list[dict]:
    """
    Full opportunity scan pipeline.
    1. Fetch NIFTY 50 technicals (parallel)
    2. Score signals
    3. Pull NewsAPI sentiment for top candidates
    4. Generate thesis (Claude or template)
    5. Return ranked list
    """
    cache_key = "opportunities:feed"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    # Step 1 & 2: technical scan (CPU-bound, run in thread pool)
    def _scan_all():
        scored = []
        for sym, yf_sym, name in NIFTY50_UNIVERSE:
            data = _fetch_ticker_signals(yf_sym)
            if not data:
                continue
            confidence, horizon, signals, opp_type = _score_signals(data)
            edge_bps = int((confidence - 50) * 4.5) * (1 if opp_type in ("long", "rotation") else -1)
            scored.append({
                "ticker":     sym,
                "yf_sym":     yf_sym,
                "name":       name,
                "confidence": confidence,
                "horizon":    horizon,
                "signals":    signals,
                "opp_type":   opp_type,
                "edge_bps":   edge_bps,
            })
        # Sort: highest confidence first, then highest edge
        scored.sort(key=lambda x: (-x["confidence"], -abs(x["edge_bps"])))
        return scored[:limit]

    top_candidates = await asyncio.to_thread(_scan_all)

    # Step 3 + 4: sentiment + thesis (async, concurrent)
    async def _enrich(candidate: dict) -> dict:
        sentiment = await _news_sentiment(candidate["name"])
        # Adjust confidence slightly for sentiment
        conf_adj = candidate["confidence"] + int(sentiment * 5)
        conf_adj = min(95, max(30, conf_adj))
        thesis   = await _claude_thesis(candidate["ticker"], candidate["name"], candidate["signals"], sentiment)

        tags = list(candidate["signals"][:2])
        type_tag = {"long": "Momentum", "short": "Short Setup", "hedge": "Hedge", "rotation": "Rotation"}
        tags.append(type_tag.get(candidate["opp_type"], "Technical"))

        return {
            "id":         f"op-{candidate['ticker'].lower()}",
            "ticker":     candidate["ticker"],
            "name":       candidate["name"],
            "thesis":     thesis,
            "confidence": conf_adj,
            "horizon":    candidate["horizon"],
            "type":       candidate["opp_type"],
            "edge_bps":   candidate["edge_bps"],
            "tags":       tags,
        }

    results = await asyncio.gather(*[_enrich(c) for c in top_candidates], return_exceptions=True)
    opportunities = [r for r in results if isinstance(r, dict)]

    await cache_set(cache_key, opportunities, settings.CACHE_TTL_OPPORTUNITIES)
    return opportunities
