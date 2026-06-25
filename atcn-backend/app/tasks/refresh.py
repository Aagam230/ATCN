"""
Background refresh tasks.
These run in a Celery worker and keep the Redis cache warm.
"""
import asyncio
from app.tasks.celery_app import celery
from app.cache import cache_delete


def _run(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery.task(name="app.tasks.refresh.refresh_ticker")
def refresh_ticker():
    from app.services.market_service import get_ticker_feed
    _run(cache_delete("market:ticker_feed"))
    _run(get_ticker_feed())


@celery.task(name="app.tasks.refresh.refresh_regime")
def refresh_regime():
    from app.services.market_service import get_market_regime
    _run(cache_delete("market:regime"))
    _run(get_market_regime())


@celery.task(name="app.tasks.refresh.refresh_opportunities")
def refresh_opportunities():
    from app.services.opportunity_engine import scan_opportunities
    _run(cache_delete("opportunities:feed"))
    _run(scan_opportunities())
