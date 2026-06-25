"""
ATCN FastAPI application.
Run with: uvicorn app.main:app --reload --port 8000
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.engine import create_all_tables
from app.cache import close_redis
from app.routers import auth, market, portfolio, risk, decision, activity

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Startup / shutdown
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup():
    await create_all_tables()


@app.on_event("shutdown")
async def shutdown():
    await close_redis()


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
API = "/api/v1"

app.include_router(auth.router,      prefix=API)
app.include_router(market.router,    prefix=API)
app.include_router(portfolio.router, prefix=API)
app.include_router(risk.router,      prefix=API)
app.include_router(decision.router,  prefix=API)


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}
