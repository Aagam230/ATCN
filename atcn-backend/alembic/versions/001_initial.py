"""Initial schema — all ATCN tables

Revision ID: 001_initial
Revises: 
Create Date: 2025-01-01 00:00:00.000000
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id",         sa.Integer(),     nullable=False),
        sa.Column("email",      sa.String(255),   nullable=False),
        sa.Column("name",       sa.String(255),   nullable=False),
        sa.Column("hashed_pw",  sa.String(255),   nullable=False),
        sa.Column("is_active",  sa.Boolean(),     nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id",    "users", ["id"],    unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # holdings
    op.create_table(
        "holdings",
        sa.Column("id",           sa.Integer(), nullable=False),
        sa.Column("user_id",      sa.Integer(), nullable=False),
        sa.Column("symbol",       sa.String(32), nullable=False),
        sa.Column("yf_symbol",    sa.String(32), nullable=False),
        sa.Column("exchange",     sa.String(8),  nullable=False, server_default="NSE"),
        sa.Column("asset_class",  sa.String(32), nullable=False),
        sa.Column("sector",       sa.String(128), nullable=True),
        sa.Column("quantity",     sa.Float(),    nullable=False),
        sa.Column("avg_cost_inr", sa.Float(),    nullable=False),
        sa.Column("updated_at",   sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "symbol", "exchange", name="uq_holding_user_symbol_exchange"),
    )
    op.create_index("ix_holdings_id",      "holdings", ["id"],      unique=False)
    op.create_index("ix_holdings_user_id", "holdings", ["user_id"], unique=False)

    # aum_history
    op.create_table(
        "aum_history",
        sa.Column("id",          sa.Integer(), nullable=False),
        sa.Column("user_id",     sa.Integer(), nullable=False),
        sa.Column("label",       sa.String(16), nullable=False),
        sa.Column("nav_inr",     sa.Float(),   nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_aum_history_id",      "aum_history", ["id"],      unique=False)
    op.create_index("ix_aum_history_user_id", "aum_history", ["user_id"], unique=False)

    # risk_alerts
    op.create_table(
        "risk_alerts",
        sa.Column("id",         sa.Integer(),   nullable=False),
        sa.Column("user_id",    sa.Integer(),   nullable=False),
        sa.Column("severity",   sa.String(16),  nullable=False),
        sa.Column("title",      sa.String(255), nullable=False),
        sa.Column("detail",     sa.Text(),      nullable=False),
        sa.Column("desk",       sa.String(64),  nullable=False),
        sa.Column("is_active",  sa.Boolean(),   nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_risk_alerts_id",      "risk_alerts", ["id"],      unique=False)
    op.create_index("ix_risk_alerts_user_id", "risk_alerts", ["user_id"], unique=False)

    # activity_events
    op.create_table(
        "activity_events",
        sa.Column("id",         sa.Integer(),   nullable=False),
        sa.Column("user_id",    sa.Integer(),   nullable=False),
        sa.Column("actor",      sa.String(16),  nullable=False),
        sa.Column("message",    sa.Text(),      nullable=False),
        sa.Column("tag",        sa.String(64),  nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_activity_events_id",      "activity_events", ["id"],      unique=False)
    op.create_index("ix_activity_events_user_id", "activity_events", ["user_id"], unique=False)

    # opportunities
    op.create_table(
        "opportunities",
        sa.Column("id",         sa.Integer(),   nullable=False),
        sa.Column("ticker",     sa.String(32),  nullable=False),
        sa.Column("name",       sa.String(255), nullable=False),
        sa.Column("thesis",     sa.Text(),      nullable=False),
        sa.Column("confidence", sa.Integer(),   nullable=False),
        sa.Column("horizon",    sa.String(64),  nullable=False),
        sa.Column("opp_type",   sa.String(16),  nullable=False),
        sa.Column("edge_bps",   sa.Integer(),   nullable=False),
        sa.Column("tags",       sa.Text(),      nullable=False, server_default="[]"),
        sa.Column("is_active",  sa.Boolean(),   nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_opportunities_id", "opportunities", ["id"], unique=False)

    # trades_under_review
    op.create_table(
        "trades_under_review",
        sa.Column("id",                sa.Integer(), nullable=False),
        sa.Column("user_id",           sa.Integer(), nullable=False),
        sa.Column("ticker",            sa.String(32), nullable=False),
        sa.Column("side",              sa.String(8),  nullable=False),
        sa.Column("proposed_size_pct", sa.Float(),   nullable=False),
        sa.Column("entry_low",         sa.Float(),   nullable=False),
        sa.Column("entry_high",        sa.Float(),   nullable=False),
        sa.Column("stop_level",        sa.Float(),   nullable=False),
        sa.Column("target_level",      sa.Float(),   nullable=False),
        sa.Column("notes",             sa.Text(),    nullable=True),
        sa.Column("status",            sa.String(16), nullable=False, server_default="pending"),
        sa.Column("decision_comment",  sa.Text(),    nullable=True),
        sa.Column("created_at",        sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at",        sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_trades_under_review_id",      "trades_under_review", ["id"],      unique=False)
    op.create_index("ix_trades_under_review_user_id", "trades_under_review", ["user_id"], unique=False)

    # market_regime_cache
    op.create_table(
        "market_regime_cache",
        sa.Column("id",                sa.Integer(),   nullable=False),
        sa.Column("regime_label",      sa.String(128), nullable=False),
        sa.Column("regime_confidence", sa.Integer(),   nullable=False),
        sa.Column("factors_json",      sa.Text(),      nullable=False),
        sa.Column("computed_at",       sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_market_regime_cache_id", "market_regime_cache", ["id"], unique=False)

    # price_cache
    op.create_table(
        "price_cache",
        sa.Column("id",         sa.Integer(),  nullable=False),
        sa.Column("yf_symbol",  sa.String(32), nullable=False),
        sa.Column("price",      sa.Float(),    nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("yf_symbol", name="uq_price_cache_symbol"),
    )
    op.create_index("ix_price_cache_id",        "price_cache", ["id"],        unique=False)
    op.create_index("ix_price_cache_yf_symbol", "price_cache", ["yf_symbol"], unique=False)


def downgrade() -> None:
    op.drop_table("price_cache")
    op.drop_table("market_regime_cache")
    op.drop_table("trades_under_review")
    op.drop_table("opportunities")
    op.drop_table("activity_events")
    op.drop_table("risk_alerts")
    op.drop_table("aum_history")
    op.drop_table("holdings")
    op.drop_table("users")
