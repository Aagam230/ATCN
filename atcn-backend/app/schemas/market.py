"""
Schemas for market data endpoints.
Field names match the TypeScript types in the frontend exactly.
"""
from pydantic import BaseModel
from typing import Literal


class TickerItem(BaseModel):
    """Matches TICKER_FEED shape consumed by TickerRibbon in TopBar."""
    symbol: str
    value: str           # formatted string e.g. "24,765.20"
    change: str          # formatted string e.g. "+0.42%"
    up: bool


class MarketRegimeFactor(BaseModel):
    """Matches MarketRegimeFactor TypeScript type."""
    label: str
    value: int           # 0–100
    state: Literal["favorable", "neutral", "caution"]


class MarketRegimeResponse(BaseModel):
    """Full payload for /api/v1/market/regime → MarketRegimePanel."""
    regime_label: str
    regime_confidence: int
    factors: list[MarketRegimeFactor]
    computed_at: str


class QuoteResponse(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_pct: float
    volume: float | None = None
    day_high: float | None = None
    day_low: float | None = None
    week_52_high: float | None = None
    week_52_low: float | None = None


class HistoryPoint(BaseModel):
    """Single OHLCV bar — used for sparklines and drawdown charts."""
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float | None = None


class TickerFeedResponse(BaseModel):
    tickers: list[TickerItem]
    updated_at: str
