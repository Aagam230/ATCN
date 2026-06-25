"""
Risk router — /api/v1/risk
"""
from fastapi import APIRouter

from app.deps import CurrentUser, DbDep
from app.schemas.risk import (
    CorrelationResponse, DrawdownResponse, RiskAlertsResponse,
    RiskHeatmapResponse, StressTestingResponse, TailRiskResponse,
)
from app.services import risk_service

router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("/alerts", response_model=RiskAlertsResponse)
async def risk_alerts(current_user: CurrentUser, db: DbDep):
    alerts = await risk_service.get_risk_alerts(current_user.id, db)
    return {"alerts": alerts}


@router.get("/tail", response_model=TailRiskResponse)
async def tail_risk(_: CurrentUser):
    return await risk_service.get_tail_risk()


@router.get("/stress", response_model=StressTestingResponse)
async def stress_testing(_: CurrentUser):
    scenarios = await risk_service.get_stress_scenarios()
    return {"scenarios": scenarios}


@router.get("/drawdown", response_model=DrawdownResponse)
async def drawdown(_: CurrentUser):
    series = await risk_service.get_drawdown_series()
    return {"series": series}


@router.get("/correlation", response_model=CorrelationResponse)
async def correlation(_: CurrentUser):
    return await risk_service.get_correlation_matrix()


@router.get("/heatmap", response_model=RiskHeatmapResponse)
async def risk_heatmap(_: CurrentUser):
    return await risk_service.get_risk_heatmap()
