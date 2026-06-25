"""
Portfolio router — /api/v1/portfolio
"""
from fastapi import APIRouter, HTTPException, status

from app.deps import CurrentUser, DbDep
from app.models.models import Holding, Exchange, AssetClass
from app.schemas.portfolio import (
    AllocationResponse, AttributionResponse, AumSeriesResponse,
    HoldingCreate, HoldingOut, HoldingUpdate, PortfolioHealthResponse,
    PortfolioSummaryResponse, SectorExposureResponse, SuggestedActionsResponse,
)
from app.services import portfolio_service
from app.services.market_service import _nse_to_yf
from sqlalchemy import select

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/summary", response_model=PortfolioSummaryResponse)
async def portfolio_summary(current_user: CurrentUser, db: DbDep):
    return await portfolio_service.get_portfolio_summary(db, current_user)


@router.get("/aum", response_model=AumSeriesResponse)
async def aum_series(current_user: CurrentUser, db: DbDep):
    series = await portfolio_service.get_aum_series(db, current_user)
    return {"series": series}


@router.get("/holdings", response_model=list[HoldingOut])
async def list_holdings(current_user: CurrentUser, db: DbDep):
    return await portfolio_service.get_holdings(db, current_user)


@router.post("/holdings", response_model=HoldingOut, status_code=status.HTTP_201_CREATED)
async def add_holding(payload: HoldingCreate, current_user: CurrentUser, db: DbDep):
    yf_sym = _nse_to_yf(payload.symbol)
    holding = Holding(
        user_id      = current_user.id,
        symbol       = payload.symbol.upper(),
        yf_symbol    = yf_sym,
        exchange     = payload.exchange,
        asset_class  = payload.asset_class,
        quantity     = payload.quantity,
        avg_cost_inr = payload.avg_cost_inr,
    )
    db.add(holding)
    await db.flush()
    await db.refresh(holding)
    holdings = await portfolio_service.get_holdings(db, current_user)
    return next(h for h in holdings if h["id"] == holding.id)


@router.patch("/holdings/{holding_id}", response_model=HoldingOut)
async def update_holding(holding_id: int, payload: HoldingUpdate, current_user: CurrentUser, db: DbDep):
    result = await db.execute(
        select(Holding).where(Holding.id == holding_id, Holding.user_id == current_user.id)
    )
    h = result.scalar_one_or_none()
    if not h:
        raise HTTPException(status_code=404, detail="Holding not found")
    if payload.quantity is not None:
        h.quantity = payload.quantity
    if payload.avg_cost_inr is not None:
        h.avg_cost_inr = payload.avg_cost_inr
    if payload.asset_class is not None:
        h.asset_class = payload.asset_class
    await db.flush()
    holdings = await portfolio_service.get_holdings(db, current_user)
    return next(h2 for h2 in holdings if h2["id"] == holding_id)


@router.delete("/holdings/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_holding(holding_id: int, current_user: CurrentUser, db: DbDep):
    result = await db.execute(
        select(Holding).where(Holding.id == holding_id, Holding.user_id == current_user.id)
    )
    h = result.scalar_one_or_none()
    if not h:
        raise HTTPException(status_code=404, detail="Holding not found")
    await db.delete(h)


@router.get("/allocation", response_model=AllocationResponse)
async def allocation(current_user: CurrentUser, db: DbDep):
    items = await portfolio_service.get_allocation(db, current_user)
    return {"items": items}


@router.get("/sector", response_model=SectorExposureResponse)
async def sector_exposure(current_user: CurrentUser, db: DbDep):
    items = await portfolio_service.get_sector_exposure(db, current_user)
    return {"items": items}


@router.get("/attribution", response_model=AttributionResponse)
async def performance_attribution(current_user: CurrentUser, db: DbDep):
    return await portfolio_service.get_performance_attribution(current_user.id)


@router.get("/health", response_model=PortfolioHealthResponse)
async def portfolio_health(current_user: CurrentUser, db: DbDep):
    return await portfolio_service.get_portfolio_health(db, current_user)


@router.get("/actions", response_model=SuggestedActionsResponse)
async def suggested_actions(current_user: CurrentUser, db: DbDep):
    items = await portfolio_service.get_suggested_actions(db, current_user)
    return {"items": items}
