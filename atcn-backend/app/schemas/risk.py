"""
Schemas for risk endpoints.
Match the TypeScript types: StressScenario, DrawdownPoint,
CorrelationCell, HeatmapCell, TAIL_RISK.
"""
from pydantic import BaseModel
from typing import Literal


# --- Matches RISK_ALERTS → RiskAlertsFeed ---
class RiskAlertOut(BaseModel):
    id: str
    severity: Literal["critical", "elevated", "watch"]
    title: str
    detail: str
    time: str       # "HH:MM" IST
    desk: str


class RiskAlertsResponse(BaseModel):
    alerts: list[RiskAlertOut]


# --- Matches TAIL_RISK → TailRiskMonitor ---
class TailEvent(BaseModel):
    label: str
    value: float


class TailRiskResponse(BaseModel):
    var95: float
    var99: float
    cvar99: float
    expected_shortfall: float
    kurtosis: float
    skew: float
    tail_events: list[TailEvent]


# --- Matches STRESS_SCENARIOS → StressTesting ---
class StressScenarioOut(BaseModel):
    id: str
    name: str
    description: str
    portfolio_impact: float     # negative percentage
    worst_asset: str
    probability: Literal["low", "moderate", "elevated"]


class StressTestingResponse(BaseModel):
    scenarios: list[StressScenarioOut]


# --- Matches DRAWDOWN_SERIES → DrawdownScenarios ---
class DrawdownPoint(BaseModel):
    day: int
    base: float
    adverse: float
    severe: float


class DrawdownResponse(BaseModel):
    series: list[DrawdownPoint]


# --- Matches CORRELATION_MATRIX → CorrelationAnalysis ---
class CorrelationCell(BaseModel):
    row: str
    col: str
    value: float


class CorrelationResponse(BaseModel):
    matrix: list[CorrelationCell]
    assets: list[str]
    period_days: int = 60


# --- Matches RISK_HEATMAP → RiskHeatmap ---
class HeatmapCell(BaseModel):
    asset: str
    metric: str
    value: float    # 0–100 risk score


class RiskHeatmapResponse(BaseModel):
    cells: list[HeatmapCell]
    assets: list[str]
    metrics: list[str]
