"""
Market router — /api/v1/market
"""
from fastapi import APIRouter, HTTPException

from app.deps import CurrentUser
from app.schemas.market import (
    MarketRegimeResponse, QuoteResponse, TickerFeedResponse, HistoryPoint
)
from app.services import market_service

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/ticker", response_model=TickerFeedResponse)
async def ticker_feed(_: CurrentUser):
    return await market_service.get_ticker_feed()


@router.get("/regime", response_model=MarketRegimeResponse)
async def market_regime(_: CurrentUser):
    return await market_service.get_market_regime()


@router.get("/quote/{symbol}", response_model=QuoteResponse)
async def quote(symbol: str, _: CurrentUser):
    data = await market_service.get_quote(symbol)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    return data


@router.get("/history/{symbol}", response_model=list[HistoryPoint])
async def history(symbol: str, period: str = "6mo", interval: str = "1d", _: CurrentUser = None):
    return await market_service.get_history(symbol, period, interval)
