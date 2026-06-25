"""
SQLAlchemy ORM models for ATCN.
All tables used by the FastAPI backend.
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger, Boolean, DateTime, Enum, Float, ForeignKey,
    Integer, String, Text, UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.engine import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class AssetClass(str, enum.Enum):
    EQUITY_LARGE   = "Equities — Large Cap"
    EQUITY_GROWTH  = "Equities — Growth"
    EQUITY_MIDCAP  = "Equities — Mid Cap"
    EQUITY_SMALLCAP= "Equities — Small Cap"
    FIXED_INCOME   = "Fixed Income"
    ALTERNATIVES   = "Alternatives"
    COMMODITIES    = "Commodities"
    CASH           = "Cash & Equivalents"


class Exchange(str, enum.Enum):
    NSE  = "NSE"
    BSE  = "BSE"


class AlertSeverity(str, enum.Enum):
    CRITICAL = "critical"
    ELEVATED = "elevated"
    WATCH    = "watch"


class ActivityActor(str, enum.Enum):
    SYSTEM = "system"
    AI     = "ai"
    USER   = "user"
    DESK   = "desk"


class OpportunityType(str, enum.Enum):
    LONG     = "long"
    SHORT    = "short"
    HEDGE    = "hedge"
    ROTATION = "rotation"


class TradeStatus(str, enum.Enum):
    PENDING  = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    RETURNED = "returned"


class TradeSide(str, enum.Enum):
    BUY  = "BUY"
    SELL = "SELL"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id         : Mapped[int]  = mapped_column(Integer, primary_key=True, index=True)
    email      : Mapped[str]  = mapped_column(String(255), unique=True, nullable=False, index=True)
    name       : Mapped[str]  = mapped_column(String(255), nullable=False)
    hashed_pw  : Mapped[str]  = mapped_column(String(255), nullable=False)
    is_active  : Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at : Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    holdings         : Mapped[list["Holding"]]         = relationship(back_populates="user", cascade="all, delete-orphan")
    trades_under_review: Mapped[list["TradeUnderReview"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    activity_events  : Mapped[list["ActivityEvent"]]   = relationship(back_populates="user", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Holdings (portfolio positions)
# ---------------------------------------------------------------------------

class Holding(Base):
    __tablename__ = "holdings"
    __table_args__ = (
        UniqueConstraint("user_id", "symbol", "exchange", name="uq_holding_user_symbol_exchange"),
    )

    id           : Mapped[int]        = mapped_column(Integer, primary_key=True, index=True)
    user_id      : Mapped[int]        = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    symbol       : Mapped[str]        = mapped_column(String(32), nullable=False)
    yf_symbol    : Mapped[str]        = mapped_column(String(32), nullable=False)   # e.g. RELIANCE.NS
    exchange     : Mapped[Exchange]   = mapped_column(Enum(Exchange), default=Exchange.NSE, nullable=False)
    asset_class  : Mapped[AssetClass] = mapped_column(Enum(AssetClass), default=AssetClass.EQUITY_LARGE, nullable=False)
    sector       : Mapped[str | None] = mapped_column(String(128), nullable=True)
    quantity     : Mapped[float]      = mapped_column(Float, nullable=False)
    avg_cost_inr : Mapped[float]      = mapped_column(Float, nullable=False)
    updated_at   : Mapped[datetime]   = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped["User"] = relationship(back_populates="holdings")


# ---------------------------------------------------------------------------
# AUM History (monthly NAV snapshots)
# ---------------------------------------------------------------------------

class AumHistory(Base):
    __tablename__ = "aum_history"

    id       : Mapped[int]   = mapped_column(Integer, primary_key=True, index=True)
    user_id  : Mapped[int]   = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    label    : Mapped[str]   = mapped_column(String(16), nullable=False)   # "Jan", "Feb" …
    nav_inr  : Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


# ---------------------------------------------------------------------------
# Risk Alerts
# ---------------------------------------------------------------------------

class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id         : Mapped[int]           = mapped_column(Integer, primary_key=True, index=True)
    user_id    : Mapped[int]           = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    severity   : Mapped[AlertSeverity] = mapped_column(Enum(AlertSeverity), nullable=False)
    title      : Mapped[str]           = mapped_column(String(255), nullable=False)
    detail     : Mapped[str]           = mapped_column(Text, nullable=False)
    desk       : Mapped[str]           = mapped_column(String(64), nullable=False)
    is_active  : Mapped[bool]          = mapped_column(Boolean, default=True)
    created_at : Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow)


# ---------------------------------------------------------------------------
# Activity Events (timeline feed)
# ---------------------------------------------------------------------------

class ActivityEvent(Base):
    __tablename__ = "activity_events"

    id         : Mapped[int]           = mapped_column(Integer, primary_key=True, index=True)
    user_id    : Mapped[int]           = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    actor      : Mapped[ActivityActor] = mapped_column(Enum(ActivityActor), nullable=False)
    message    : Mapped[str]           = mapped_column(Text, nullable=False)
    tag        : Mapped[str | None]    = mapped_column(String(64), nullable=True)
    created_at : Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="activity_events")


# ---------------------------------------------------------------------------
# Opportunities (AI surfaced)
# ---------------------------------------------------------------------------

class Opportunity(Base):
    __tablename__ = "opportunities"

    id          : Mapped[int]             = mapped_column(Integer, primary_key=True, index=True)
    ticker      : Mapped[str]             = mapped_column(String(32), nullable=False)
    name        : Mapped[str]             = mapped_column(String(255), nullable=False)
    thesis      : Mapped[str]             = mapped_column(Text, nullable=False)
    confidence  : Mapped[int]             = mapped_column(Integer, nullable=False)   # 0-100
    horizon     : Mapped[str]             = mapped_column(String(64), nullable=False)
    opp_type    : Mapped[OpportunityType] = mapped_column(Enum(OpportunityType), nullable=False)
    edge_bps    : Mapped[int]             = mapped_column(Integer, nullable=False)
    tags        : Mapped[str]             = mapped_column(Text, nullable=False, default="")  # JSON list stored as text
    is_active   : Mapped[bool]            = mapped_column(Boolean, default=True)
    created_at  : Mapped[datetime]        = mapped_column(DateTime(timezone=True), default=utcnow)


# ---------------------------------------------------------------------------
# Trade Under Review (Decision Twin queue)
# ---------------------------------------------------------------------------

class TradeUnderReview(Base):
    __tablename__ = "trades_under_review"

    id                  : Mapped[int]        = mapped_column(Integer, primary_key=True, index=True)
    user_id             : Mapped[int]        = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    ticker              : Mapped[str]        = mapped_column(String(32), nullable=False)
    side                : Mapped[TradeSide]  = mapped_column(Enum(TradeSide), nullable=False)
    proposed_size_pct   : Mapped[float]      = mapped_column(Float, nullable=False)
    entry_low           : Mapped[float]      = mapped_column(Float, nullable=False)
    entry_high          : Mapped[float]      = mapped_column(Float, nullable=False)
    stop_level          : Mapped[float]      = mapped_column(Float, nullable=False)
    target_level        : Mapped[float]      = mapped_column(Float, nullable=False)
    notes               : Mapped[str | None] = mapped_column(Text, nullable=True)
    status              : Mapped[TradeStatus]= mapped_column(Enum(TradeStatus), default=TradeStatus.PENDING)
    decision_comment    : Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at          : Mapped[datetime]   = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at          : Mapped[datetime]   = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped["User"] = relationship(back_populates="trades_under_review")


# ---------------------------------------------------------------------------
# Market Regime Cache (stored results from compute-heavy regime engine)
# ---------------------------------------------------------------------------

class MarketRegimeCache(Base):
    __tablename__ = "market_regime_cache"

    id              : Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    regime_label    : Mapped[str]      = mapped_column(String(128), nullable=False)
    regime_confidence: Mapped[int]     = mapped_column(Integer, nullable=False)
    factors_json    : Mapped[str]      = mapped_column(Text, nullable=False)       # JSON
    computed_at     : Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


# ---------------------------------------------------------------------------
# Price Cache (last-known prices for offline fallback)
# ---------------------------------------------------------------------------

class PriceCache(Base):
    __tablename__ = "price_cache"
    __table_args__ = (
        UniqueConstraint("yf_symbol", name="uq_price_cache_symbol"),
    )

    id         : Mapped[int]   = mapped_column(Integer, primary_key=True, index=True)
    yf_symbol  : Mapped[str]   = mapped_column(String(32), nullable=False, index=True)
    price      : Mapped[float] = mapped_column(Float, nullable=False)
    updated_at : Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
