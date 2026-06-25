"""
Schemas for Opportunities, Decision Twin, and Activity Timeline.
"""
from pydantic import BaseModel
from typing import Literal, Optional


# ---------------------------------------------------------------------------
# Opportunities → OpportunityFeed
# ---------------------------------------------------------------------------

class OpportunityOut(BaseModel):
    id: str
    ticker: str
    name: str
    thesis: str
    confidence: int
    horizon: str
    type: Literal["long", "short", "hedge", "rotation"]
    edge_bps: int
    tags: list[str]


class OpportunitiesResponse(BaseModel):
    opportunities: list[OpportunityOut]
    count: int


# ---------------------------------------------------------------------------
# Activity Timeline → ActivityTimeline component
# ---------------------------------------------------------------------------

class ActivityEventOut(BaseModel):
    id: str
    time: str       # "HH:MM" IST
    actor: Literal["system", "ai", "user", "desk"]
    message: str
    tag: Optional[str] = None


class ActivityTimelineResponse(BaseModel):
    events: list[ActivityEventOut]


# ---------------------------------------------------------------------------
# Decision Twin — Trade Under Review → TradeReview component
# ---------------------------------------------------------------------------

class TradeSubmitRequest(BaseModel):
    ticker: str
    side: Literal["BUY", "SELL"]
    proposed_size_pct: float        # % of NAV e.g. 2.5
    entry_low: float
    entry_high: float
    stop_level: float
    target_level: float
    notes: Optional[str] = None


class TradeReviewOut(BaseModel):
    id: int
    ticker: str
    side: str
    proposed_size: str              # "2.5% NAV" — formatted
    entry_range: str                # "₹128.40 – ₹131.20"
    current_price: float
    stop_level: float
    target_level: float
    notes: Optional[str]
    status: str


# ---------------------------------------------------------------------------
# Decision Twin — Confidence Score → ConfidenceScore component
# ---------------------------------------------------------------------------

class ConfidenceDriver(BaseModel):
    label: str
    value: int      # 0–100


class ConfidenceScoreResponse(BaseModel):
    score: int
    drivers: list[ConfidenceDriver]


# ---------------------------------------------------------------------------
# Decision Twin — Behavioral Risk → BehavioralRiskScore component
# ---------------------------------------------------------------------------

class BehavioralMarker(BaseModel):
    label: str
    detected: bool
    weight: int     # contribution to risk score


class BehavioralRiskResponse(BaseModel):
    score: int
    level: str      # "Low" | "Moderate" | "High"
    markers: list[BehavioralMarker]


# ---------------------------------------------------------------------------
# Decision Twin — Similar Situations → SimilarSituations component
# ---------------------------------------------------------------------------

class SimilarSituationOut(BaseModel):
    id: str
    date: str
    setup: str
    outcome: Literal["favorable", "unfavorable", "neutral"]
    similarity: int     # 0–100
    return_pct: float
    note: str


class SimilarSituationsResponse(BaseModel):
    situations: list[SimilarSituationOut]
    analogues_searched: int


# ---------------------------------------------------------------------------
# Decision Twin — Alternative Actions → AlternativeActions component
# ---------------------------------------------------------------------------

class AlternativeActionOut(BaseModel):
    id: str
    label: str
    expected_return: float
    risk_score: int     # 0–100
    confidence: int     # 0–100
    recommended: bool = False


class AlternativeActionsResponse(BaseModel):
    actions: list[AlternativeActionOut]


# ---------------------------------------------------------------------------
# Decision Twin — Submit Decision
# ---------------------------------------------------------------------------

class DecisionSubmitRequest(BaseModel):
    decision: Literal["approve", "reject", "return"]
    comment: Optional[str] = None


class DecisionSubmitResponse(BaseModel):
    trade_id: int
    decision: str
    message: str
