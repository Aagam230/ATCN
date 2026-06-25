"""
Celery worker — background refresh tasks.
Run with: celery -A app.tasks.celery_app worker --beat -l info
"""
from celery import Celery
from app.config import settings

celery = Celery(
    "atcn",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.refresh"],
)

celery.conf.beat_schedule = {
    "refresh-ticker-feed": {
        "task":     "app.tasks.refresh.refresh_ticker",
        "schedule": 30,          # every 30s
    },
    "refresh-market-regime": {
        "task":     "app.tasks.refresh.refresh_regime",
        "schedule": 3600,        # every 1h
    },
    "refresh-opportunities": {
        "task":     "app.tasks.refresh.refresh_opportunities",
        "schedule": 900,         # every 15m
    },
}
celery.conf.timezone = "Asia/Kolkata"
