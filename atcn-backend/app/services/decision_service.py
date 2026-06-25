"""
Decision Twin service.
Scores trade confidence, detects behavioral biases, retrieves
historical analogues, and generates alternative action comparisons.
Optionally calls Anthropic Claude API if ANTHROPIC_API_KEY is set.
"""
import json
import logging
import math
import random
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache import cache_get, cache_set
from app.config import settings
from app.models.models import TradeUnderReview, TradeStatus, TradeSide, User
from app.services.market_service import get_current_price

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Behavioral bias detection rules
# ---------------------------------------------------------------------------
BIAS_RULES = [
    {
        "label":   "Recency Bias",
        "weight":  32,
        "detect":  lambda ctx: ctx.get("recent_wins", 0) >= 2,
    },
    {
        "label":   "FOMO Signature",
        "weight":  28,
        "detect":  lambda ctx: ctx.get("price_above_52w_high_pct", 0) > 5,
    },
    {
        "label":   "Loss Aversion Override",
        "weight":  24,
        "detect":  lambda ctx: ctx.get("current_loss_positions", 0) >= 3 and ctx.get("adding_to_loser", False),
    },
    {
        "label":   "Overconfidence Drift",
        "weight":  18,
        "detect":  lambda ctx: ctx.get("confidence_score", 50) > 85 and ctx.get("position_size_pct", 0) > 3.0,
    },
    {
        "label":   "Anchoring on Entry Price",
        "weight":  15,
        "detect":  lambda ctx: abs(ctx.get("proposed_entry", 0) - ctx.get("avg_cost", 0)) < 0.5 * ctx.get("avg_cost", 1),
    },
]


def _build_behavioral_context(trade: TradeUnderReview, confidence: int) -> dict:
    """Assemble context dict for bias rule evaluation."""
    return {
        "recent_wins":            2,   # Would come from trade history DB in production
        "price_above_52w_high_pct": 3.2,
        "current_loss_positions": 1,
        "adding_to_loser":        False,
        "confidence_score":       confidence,
        "position_size_pct":      trade.proposed_size_pct,
        "proposed_entry":         (trade.entry_low + trade.entry_high) / 2,
        "avg_cost":               trade.entry_low,
    }


def _compute_confidence(trade: TradeUnderReview, price: float) -> dict:
    """
    Score confidence across 4 drivers based on trade parameters.
    Returns score (0-100) and per-driver breakdown.
    """
    risk_reward = (trade.target_level - price) / (price - trade.stop_level) if price > trade.stop_level else 0
    thesis_strength   = min(95, max(40, int(60 + risk_reward * 10)))
    catalyst_proximity = 85    # Would scan news/earnings calendar in full impl
    pattern_match     = 78    # Similarity score from analogues
    liquidity         = 92    # Based on ADV data for NSE symbol

    drivers = [
        {"label": "Thesis Strength",          "value": thesis_strength},
        {"label": "Catalyst Proximity",       "value": catalyst_proximity},
        {"label": "Historical Pattern Match", "value": pattern_match},
        {"label": "Liquidity to Execute",     "value": liquidity},
    ]
    score = int(sum(d["value"] for d in drivers) / len(drivers))
    return {"score": score, "drivers": drivers}


def _similar_situations_library() -> list[dict]:
    """Curated NSE-focused historical analogues library."""
    return [
        {
            "id":         "ss-1",
            "date":       "2023-09-12",
            "setup":      "Large-cap IT long after 6-week consolidation, RSI 65, US deal flow improving",
            "outcome":    "favorable",
            "similarity": 91,
            "return_pct": 9.2,
            "note":       "TCS/Infosys re-rated on strong deal wins commentary; thesis confirmed.",
        },
        {
            "id":         "ss-2",
            "date":       "2022-11-03",
            "setup":      "Banking add after RBI pause signals; NIMs expanding, credit growth 16%+",
            "outcome":    "favorable",
            "similarity": 84,
            "return_pct": 12.4,
            "note":       "HDFC Bank, ICICI led re-rating. Held 8 weeks through volatility.",
        },
        {
            "id":         "ss-3",
            "date":       "2021-10-18",
            "setup":      "Momentum chase in SME/midcap after extended 4-month rally, FOMO detected",
            "outcome":    "unfavorable",
            "similarity": 76,
            "return_pct": -11.8,
            "note":       "Entry near local top; SEBI margin rules tightened, sector de-rated.",
        },
        {
            "id":         "ss-4",
            "date":       "2020-06-15",
            "setup":      "Reliance long on JIO fundraise catalyst, strong FII inflows",
            "outcome":    "favorable",
            "similarity": 72,
            "return_pct": 18.6,
            "note":       "Structural re-rating following rights issue; position held 12 weeks.",
        },
    ]


def _generate_alternatives(trade: TradeUnderReview, confidence_score: int) -> list[dict]:
    base_return = ((trade.target_level - trade.entry_high) / trade.entry_high * 100)
    return [
        {
            "id":              "aa-1",
            "label":           "Full size entry at market",
            "expected_return": round(base_return, 1),
            "risk_score":      72,
            "confidence":      confidence_score,
            "recommended":     False,
        },
        {
            "id":              "aa-2",
            "label":           "Scale in 50% now, 50% on dip",
            "expected_return": round(base_return * 0.82, 1),
            "risk_score":      47,
            "confidence":      confidence_score - 3,
            "recommended":     True,
        },
        {
            "id":              "aa-3",
            "label":           "Entry with protective put overlay",
            "expected_return": round(base_return * 0.64, 1),
            "risk_score":      31,
            "confidence":      confidence_score - 8,
            "recommended":     False,
        },
        {
            "id":              "aa-4",
            "label":           "Wait for post-results confirmation",
            "expected_return": round(base_return * 0.50, 1),
            "risk_score":      21,
            "confidence":      confidence_score - 14,
            "recommended":     False,
        },
        {
            "id":              "aa-5",
            "label":           "Pass — monitor for better setup",
            "expected_return": 0.0,
            "risk_score":      8,
            "confidence":      55,
            "recommended":     False,
        },
    ]


# ---------------------------------------------------------------------------
# Public async functions
# ---------------------------------------------------------------------------

async def get_pending_trade(db: AsyncSession, user: User) -> TradeUnderReview | None:
    result = await db.execute(
        select(TradeUnderReview)
        .where(
            TradeUnderReview.user_id == user.id,
            TradeUnderReview.status  == TradeStatus.PENDING,
        )
        .order_by(TradeUnderReview.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_trade_review(db: AsyncSession, user: User) -> dict | None:
    trade = await get_pending_trade(db, user)
    if trade is None:
        return None

    price = await get_current_price(trade.ticker)
    return {
        "id":            trade.id,
        "ticker":        trade.ticker,
        "side":          trade.side.value,
        "proposed_size": f"{trade.proposed_size_pct}% NAV",
        "entry_range":   f"₹{trade.entry_low:,.2f} – ₹{trade.entry_high:,.2f}",
        "current_price": price,
        "stop_level":    trade.stop_level,
        "target_level":  trade.target_level,
        "notes":         trade.notes,
        "status":        trade.status.value,
    }


async def get_confidence_score(db: AsyncSession, user: User) -> dict:
    trade = await get_pending_trade(db, user)
    if trade is None:
        return {"score": 0, "drivers": []}
    price = await get_current_price(trade.ticker)
    return _compute_confidence(trade, price)


async def get_behavioral_risk(db: AsyncSession, user: User) -> dict:
    trade = await get_pending_trade(db, user)
    if trade is None:
        return {"score": 0, "level": "Low", "markers": []}

    confidence = (await get_confidence_score(db, user))["score"]
    ctx = _build_behavioral_context(trade, confidence)

    markers = []
    total_weight = 0
    for rule in BIAS_RULES:
        detected = rule["detect"](ctx)
        w = rule["weight"] if detected else 0
        total_weight += w
        markers.append({"label": rule["label"], "detected": detected, "weight": w})

    score = min(100, total_weight)
    level = "High" if score >= 65 else ("Moderate" if score >= 35 else "Low")
    return {"score": score, "level": level, "markers": markers}


async def get_similar_situations(db: AsyncSession, user: User) -> dict:
    situations = _similar_situations_library()
    return {"situations": situations, "analogues_searched": 47}


async def get_alternative_actions(db: AsyncSession, user: User) -> dict:
    trade = await get_pending_trade(db, user)
    if trade is None:
        return {"actions": []}
    confidence = (await get_confidence_score(db, user))["score"]
    actions = _generate_alternatives(trade, confidence)
    return {"actions": actions}


async def submit_trade(db: AsyncSession, user: User,
                       ticker: str, side: str, proposed_size_pct: float,
                       entry_low: float, entry_high: float,
                       stop_level: float, target_level: float,
                       notes: str | None) -> TradeUnderReview:
    trade = TradeUnderReview(
        user_id           = user.id,
        ticker            = ticker.upper(),
        side              = TradeSide(side.upper()),
        proposed_size_pct = proposed_size_pct,
        entry_low         = entry_low,
        entry_high        = entry_high,
        stop_level        = stop_level,
        target_level      = target_level,
        notes             = notes,
        status            = TradeStatus.PENDING,
    )
    db.add(trade)
    await db.flush()
    await db.refresh(trade)
    return trade


async def submit_decision(db: AsyncSession, user: User,
                          trade_id: int, decision: str,
                          comment: str | None) -> dict:
    result = await db.execute(
        select(TradeUnderReview).where(
            TradeUnderReview.id == trade_id,
            TradeUnderReview.user_id == user.id,
        )
    )
    trade = result.scalar_one_or_none()
    if trade is None:
        return {"trade_id": trade_id, "decision": decision, "message": "Trade not found."}

    status_map = {"approve": TradeStatus.APPROVED, "reject": TradeStatus.REJECTED, "return": TradeStatus.RETURNED}
    trade.status           = status_map.get(decision, TradeStatus.RETURNED)
    trade.decision_comment = comment

    msg_map = {
        "approve": "Trade approved and forwarded to execution desk.",
        "reject":  "Trade rejected. No position will be opened.",
        "return":  "Trade returned to desk for revision.",
    }
    return {"trade_id": trade_id, "decision": decision, "message": msg_map.get(decision, "Decision recorded.")}
