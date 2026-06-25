from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "ATCN API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Security
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_USE_LONG_RANDOM_STRING"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS — comma-separated origins
    ALLOWED_ORIGINS: str = "http://localhost:3000,https://atcn.vercel.app"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://atcn:atcn@localhost:5432/atcn"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Cache TTLs (seconds)
    CACHE_TTL_TICKER: int = 30          # live ticker ribbon
    CACHE_TTL_QUOTES: int = 60          # individual quotes
    CACHE_TTL_REGIME: int = 3600        # market regime (1h)
    CACHE_TTL_HISTORY: int = 3600       # price history
    CACHE_TTL_OPPORTUNITIES: int = 900  # opportunity feed (15m)
    CACHE_TTL_RISK: int = 1800          # risk metrics (30m)
    CACHE_TTL_PORTFOLIO: int = 120      # portfolio summary (2m)

    # NewsAPI
    NEWS_API_KEY: str = ""

    # OpenAI (optional — used for thesis generation)
    OPENAI_API_KEY: str = ""

    # Anthropic (optional — used for decision twin)
    ANTHROPIC_API_KEY: str = ""

    # NSE / Market
    NIFTY50_BENCHMARK_SYMBOL: str = "^NSEI"
    BANKNIFTY_SYMBOL: str = "^NSEBANK"
    INDIA_VIX_SYMBOL: str = "^INDIAVIX"
    DEFAULT_EXCHANGE: str = "NSE"
    MARKET_TZ: str = "Asia/Kolkata"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
