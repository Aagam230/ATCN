"""
Activity Timeline router — /api/v1/activity
"""
import pytz
from fastapi import APIRouter
from sqlalchemy import select

from app.deps import CurrentUser, DbDep
from app.models.models import ActivityEvent

router = APIRouter(prefix="/activity", tags=["activity"])
IST = pytz.timezone("Asia/Kolkata")


@router.get("/events")
async def activity_events(current_user: CurrentUser, db: DbDep, limit: int = 30):
    result = await db.execute(
        select(ActivityEvent)
        .where(ActivityEvent.user_id == current_user.id)
        .order_by(ActivityEvent.created_at.desc())
        .limit(limit)
    )
    events = list(result.scalars().all())
    return {
        "events": [
            {
                "id":      str(e.id),
                "time":    e.created_at.astimezone(IST).strftime("%H:%M"),
                "actor":   e.actor.value,
                "message": e.message,
                "tag":     e.tag,
            }
            for e in reversed(events)
        ]
    }
