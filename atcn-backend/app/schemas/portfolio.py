"""
Schemas for portfolio endpoints.
Each schema maps to a specific frontend component's data need.
"""
from pydantic import BaseModel
from typing import Optional
from app.models.models import AssetClass, Exchange


# --- Matches PORTFOLIO_SUMMARY → PortfolioSummaryPanel + page.tsx MetricCards ---
class PortfolioSummaryResponse(BaseModel):
    nav: float                  # Total NAV in INR
    nav_change_pct: float       # vs prior close
    day_pnl: float              # INR P&L today
    ytd_return: float           # % YTD
    benchmark_ytd: float        # NIFTY 50 YTD %
    sharpe: float               # trailing 12M Sharpe
    beta: float                 # portfolio beta vs NIFTY 50
    cash: float                 # cash weight %
    updated_at: str


# --- Matches AUM_SERIES → Sparkline in PortfolioSummaryPanel ---
class MetricPoint(BaseModel):
    t: str      # label e.g. "Jan"
    v: float    # value


class AumSeriesResponse(BaseModel):
    series: list[MetricPoint]


# --- Holdings CRUD ---
class HoldingCreate(BaseModel):
    symbol: str
    exchange: Exchange = Exchange.NSE
    asset_class: AssetClass = AssetClass.EQUITY_LARGE
    quantity: float
    avg_cost_inr: float


class HoldingUpdate(BaseModel):
    quantity: Optional[float] = None
    avg_cost_inr: Optional[float] = None
    asset_class: Optional[AssetClass] = None


class HoldingOut(BaseModel):
    id: int
    symbol: str
    yf_symbol: str
    exchange: str
    asset_class: str
    sector: Optional[str]
    quantity: float
    avg_cost_inr: float
    current_price: float = 0.0
    current_value: float = 0.0
    unrealised_pnl: float = 0.0
    unrealised_pnl_pct: float = 0.0

    model_config = {"from_attributes": True}


# --- Matches HOLDINGS_ALLOCATION → AllocationChart ---
class AllocationItem(BaseModel):
    name: str       # asset class display name
    value: float    # percentage weight
    color: str      # hex colour for donut chart


class AllocationResponse(BaseModel):
    items: list[AllocationItem]


# --- Matches SECTOR_EXPOSURE → SectorExposure ---
class SectorExposureItem(BaseModel):
    sector: str
    weight: float       # portfolio weight %
    benchmark: float    # NIFTY 50 benchmark weight %
    active: float       # active weight (weight - benchmark)


class SectorExposureResponse(BaseModel):
    items: list[SectorExposureItem]


# --- Matches PERFORMANCE_ATTRIBUTION → PerformanceAttribution ---
class AttributionItem(BaseModel):
    factor: str
    contribution: float     # % contribution


class AttributionResponse(BaseModel):
    items: list[AttributionItem]
    period: str = "Trailing 12 Months"


# --- Matches PORTFOLIO_HEALTH → HealthScore ---
class HealthComponent(BaseModel):
    label: str
    score: int      # 0–100


class PortfolioHealthResponse(BaseModel):
    score: int
    prior: int
    components: list[HealthComponent]


# --- Matches SUGGESTED_ACTIONS → SuggestedActions ---
class SuggestedActionItem(BaseModel):
    id: str
    priority: str   # "high" | "medium" | "low"
    action: str
    rationale: str
    impact: str


class SuggestedActionsResponse(BaseModel):
    items: list[SuggestedActionItem]
