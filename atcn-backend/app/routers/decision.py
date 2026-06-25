"""
Decision Twin router — /api/v1/decision
"""
from fastapi import APIRouter, HTTPException, status

from app.deps import CurrentUser, DbDep
from app.schemas.decision import (
    AlternativeActionsResponse, BehavioralRiskResponse, ConfidenceScoreResponse,
    DecisionSubmitRequest, DecisionSubmitResponse, OpportunitiesResponse,
    SimilarSituationsResponse, TradeReviewOut, TradeSubmitRequest,
)
from app.services import decision_service
from app.services.opportunity_engine import scan_opportunities

router = APIRouter(prefix="/decision", tags=["decision"])


@router.get("/opportunities", response_model=OpportunitiesResponse)
async def opportunities(_: CurrentUser):
    opps = await scan_opportunities()
    return {"opportunities": opps, "count": len(opps)}


@router.get("/trade", response_model=TradeReviewOut)
async def trade_review(current_user: CurrentUser, db: DbDep):
    data = await decision_service.get_trade_review(db, current_user)
    if data is None:
        raise HTTPException(status_code=404, detail="No pending trade under review")
    return data


@router.post("/trade", response_model=TradeReviewOut, status_code=status.HTTP_201_CREATED)
async def submit_trade(payload: TradeSubmitRequest, current_user: CurrentUser, db: DbDep):
    trade = await decision_service.submit_trade(
        db, current_user,
        ticker=payload.ticker,
        side=payload.side,
        proposed_size_pct=payload.proposed_size_pct,
        entry_low=payload.entry_low,
        entry_high=payload.entry_high,
        stop_level=payload.stop_level,
        target_level=payload.target_level,
        notes=payload.notes,
    )
    data = await decision_service.get_trade_review(db, current_user)
    return data


@router.get("/confidence", response_model=ConfidenceScoreResponse)
async def confidence_score(current_user: CurrentUser, db: DbDep):
    return await decision_service.get_confidence_score(db, current_user)


@router.get("/behavioral", response_model=BehavioralRiskResponse)
async def behavioral_risk(current_user: CurrentUser, db: DbDep):
    return await decision_service.get_behavioral_risk(db, current_user)


@router.get("/similar", response_model=SimilarSituationsResponse)
async def similar_situations(current_user: CurrentUser, db: DbDep):
    return await decision_service.get_similar_situations(db, current_user)


@router.get("/alternatives", response_model=AlternativeActionsResponse)
async def alternative_actions(current_user: CurrentUser, db: DbDep):
    return await decision_service.get_alternative_actions(db, current_user)


@router.post("/submit/{trade_id}", response_model=DecisionSubmitResponse)
async def submit_decision(trade_id: int, payload: DecisionSubmitRequest, current_user: CurrentUser, db: DbDep):
    return await decision_service.submit_decision(
        db, current_user, trade_id, payload.decision, payload.comment
    )
