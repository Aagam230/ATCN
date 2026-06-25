"""
Market data service.
Sources: yfinance (free), nsepython (NSE official), NewsAPI (free tier).
All symbols are NSE-native; yfinance suffix '.NS' applied automatically.
"""
import asyncio
import json
import logging
from datetime import datetime, timezone
from functools import lru_cache

import pytz
import yfinance as yf

from app.cache import cache_get, cache_set
from app.config import settings

log = logging.getLogger(__name__)

IST = pytz.timezone(settings.MARKET_TZ)

# ---------------------------------------------------------------------------
# NSE index & benchmark symbols (yfinance)
# ---------------------------------------------------------------------------
NSE_INDICES = {
    "NIFTY 50":    "^NSEI",
    "BANK NIFTY":  "^NSEBANK",
    "INDIA VIX":   "^INDIAVIX",
    "NIFTY IT":    "^CNXIT",
    "NIFTY MIDCAP":"^NSEMDCP50",
}

# NSE-listed blue-chips for default ticker ribbon
RIBBON_SYMBOLS = [
    ("NIFTY 50", "^NSEI"),
    ("BANKNIFTY", "^NSEBANK"),
    ("VIX",       "^INDIAVIX"),
    ("RELIANCE",  "RELIANCE.NS"),
    ("INFY",      "INFY.NS"),
    ("TCS",       "TCS.NS"),
    ("HDFC",      "HDFCBANK.NS"),
    ("ICICI",     "ICICIBANK.NS"),
    ("WIPRO",     "WIPRO.NS"),
    ("BAJFINANCE","BAJFINANCE.NS"),
]

# Regime factor weights (NSE-adapted)
REGIME_FACTORS_CONFIG = [
    {"label": "India VIX Level",          "symbol": "^INDIAVIX",   "invert": True},
    {"label": "NIFTY 50 Momentum",        "symbol": "^NSEI",       "invert": False},
    {"label": "Bank Nifty Breadth",       "symbol": "^NSEBANK",    "invert": False},
    {"label": "USD/INR Stability",        "symbol": "USDINR=X",    "invert": True},
    {"label": "Crude Oil Pressure",       "symbol": "CL=F",        "invert": True},
    {"label": "FII Flow Proxy (EEM)",     "symbol": "EEM",         "invert": False},
]


def _nse_to_yf(symbol: str) -> str:
    """Convert bare NSE symbol to yfinance format e.g. RELIANCE → RELIANCE.NS"""
    if symbol.endswith(".NS") or symbol.endswith(".BO") or symbol.startswith("^"):
        return symbol
    return f"{symbol}.NS"


def _yf_current_price(ticker_obj: yf.Ticker) -> float | None:
    """Fast current-price extraction from yfinance Ticker."""
    try:
        info = ticker_obj.fast_info
        price = getattr(info, "last_price", None)
        if price:
            return float(price)
        hist = ticker_obj.history(period="1d", interval="1m")
        if not hist.empty:
            return float(hist["Close"].iloc[-1])
    except Exception as exc:
        log.warning("yf price fetch failed: %s", exc)
    return None


def _score_from_change(pct_change: float, invert: bool) -> int:
    """Map a percentage change to a 0-100 score."""
    raw = min(max(pct_change, -5.0), 5.0)   # clamp to ±5%
    normalised = (raw + 5.0) / 10.0          # 0.0 – 1.0
    score = int(normalised * 100)
    return (100 - score) if invert else score


def _regime_label_and_confidence(factors: list[dict]) -> tuple[str, int]:
    avg = sum(f["value"] for f in factors) / len(factors)
    if avg >= 70:
        return "RISK-ON / BULL TREND", int(avg)
    if avg >= 55:
        return "RISK-ON / LATE-CYCLE", int(avg)
    if avg >= 40:
        return "MIXED / TRANSITION", int(avg)
    if avg >= 25:
        return "RISK-OFF / CAUTIOUS", int(avg)
    return "RISK-OFF / DEFENSIVE", int(avg)


# ---------------------------------------------------------------------------
# Public async helpers
# ---------------------------------------------------------------------------

async def get_ticker_feed() -> dict:
    cache_key = "market:ticker_feed"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    def _fetch():
        tickers = []
        for display, yf_sym in RIBBON_SYMBOLS:
            try:
                t = yf.Ticker(yf_sym)
                info = t.fast_info
                price = getattr(info, "last_price", None) or 0.0
                prev  = getattr(info, "previous_close", None) or price
                chg_pct = ((price - prev) / prev * 100) if prev else 0.0
                sign  = "+" if chg_pct >= 0 else ""
                # Format price based on magnitude
                if price > 10_000:
                    val_str = f"{price:,.0f}"
                elif price > 100:
                    val_str = f"{price:,.2f}"
                else:
                    val_str = f"{price:.4f}"
                tickers.append({
                    "symbol": display,
                    "value":  val_str,
                    "change": f"{sign}{chg_pct:.2f}%",
                    "up":     chg_pct >= 0,
                })
            except Exception as exc:
                log.warning("Ticker %s failed: %s", yf_sym, exc)
        return tickers

    tickers = await asyncio.to_thread(_fetch)
    ist_now = datetime.now(IST).strftime("%H:%M IST")
    result = {"tickers": tickers, "updated_at": ist_now}
    await cache_set(cache_key, result, settings.CACHE_TTL_TICKER)
    return result


async def get_market_regime() -> dict:
    cache_key = "market:regime"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    def _fetch():
        factors = []
        for cfg in REGIME_FACTORS_CONFIG:
            try:
                t = yf.Ticker(cfg["symbol"])
                hist = t.history(period="5d")
                if len(hist) < 2:
                    score = 50
                else:
                    prev  = hist["Close"].iloc[-2]
                    curr  = hist["Close"].iloc[-1]
                    pct   = (curr - prev) / prev * 100 if prev else 0.0
                    score = _score_from_change(pct, cfg["invert"])
                # Determine state bucket
                state = "favorable" if score >= 60 else ("caution" if score < 35 else "neutral")
                factors.append({"label": cfg["label"], "value": score, "state": state})
            except Exception as exc:
                log.warning("Regime factor %s failed: %s", cfg["label"], exc)
                factors.append({"label": cfg["label"], "value": 50, "state": "neutral"})
        return factors

    factors = await asyncio.to_thread(_fetch)
    label, confidence = _regime_label_and_confidence(factors)
    result = {
        "regime_label":      label,
        "regime_confidence": confidence,
        "factors":           factors,
        "computed_at":       datetime.now(IST).strftime("%H:%M IST"),
    }
    await cache_set(cache_key, result, settings.CACHE_TTL_REGIME)
    return result


async def get_quote(symbol: str) -> dict | None:
    yf_sym = _nse_to_yf(symbol)
    cache_key = f"market:quote:{yf_sym}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    def _fetch():
        t = yf.Ticker(yf_sym)
        info = t.fast_info
        price     = getattr(info, "last_price", None) or 0.0
        prev      = getattr(info, "previous_close", None) or price
        chg       = price - prev
        chg_pct   = (chg / prev * 100) if prev else 0.0
        full_info = t.info
        return {
            "symbol":       symbol.upper(),
            "name":         full_info.get("longName") or full_info.get("shortName") or symbol,
            "price":        round(price, 2),
            "change":       round(chg, 2),
            "change_pct":   round(chg_pct, 4),
            "volume":       getattr(info, "three_month_average_volume", None),
            "day_high":     getattr(info, "day_high", None),
            "day_low":      getattr(info, "day_low", None),
            "week_52_high": getattr(info, "year_high", None),
            "week_52_low":  getattr(info, "year_low", None),
        }

    try:
        result = await asyncio.to_thread(_fetch)
        await cache_set(cache_key, result, settings.CACHE_TTL_QUOTES)
        return result
    except Exception as exc:
        log.error("Quote fetch failed for %s: %s", symbol, exc)
        return None


async def get_history(symbol: str, period: str = "6mo", interval: str = "1d") -> list[dict]:
    yf_sym = _nse_to_yf(symbol)
    cache_key = f"market:history:{yf_sym}:{period}:{interval}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    def _fetch():
        t = yf.Ticker(yf_sym)
        hist = t.history(period=period, interval=interval)
        bars = []
        for ts, row in hist.iterrows():
            bars.append({
                "date":   ts.strftime("%Y-%m-%d"),
                "open":   round(float(row["Open"]), 2),
                "high":   round(float(row["High"]), 2),
                "low":    round(float(row["Low"]), 2),
                "close":  round(float(row["Close"]), 2),
                "volume": float(row["Volume"]) if "Volume" in row else None,
            })
        return bars

    try:
        result = await asyncio.to_thread(_fetch)
        await cache_set(cache_key, result, settings.CACHE_TTL_HISTORY)
        return result
    except Exception as exc:
        log.error("History fetch failed for %s: %s", symbol, exc)
        return []


async def get_current_price(symbol: str) -> float:
    """Lightweight price fetch used internally (e.g. portfolio P&L calc)."""
    yf_sym = _nse_to_yf(symbol)
    cache_key = f"market:price:{yf_sym}"
    cached = await cache_get(cache_key)
    if cached:
        return float(cached)

    def _fetch():
        t = yf.Ticker(yf_sym)
        price = getattr(t.fast_info, "last_price", None)
        if not price:
            hist = t.history(period="1d")
            price = float(hist["Close"].iloc[-1]) if not hist.empty else 0.0
        return float(price)

    try:
        price = await asyncio.to_thread(_fetch)
        await cache_set(cache_key, price, settings.CACHE_TTL_QUOTES)
        return price
    except Exception:
        return 0.0
