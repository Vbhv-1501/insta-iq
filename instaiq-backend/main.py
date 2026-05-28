import logging

import structlog
import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.api.routes import router
from app.db.models import init_db

settings = get_settings()


# ──────────────── OBSERVABILITY ────────────────
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=0.1,
    )

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer() if settings.DEBUG else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.DEBUG if settings.DEBUG else logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)
log = structlog.get_logger()


# ──────────────── RATE LIMITER ────────────────
limiter = Limiter(key_func=get_remote_address)


# ──────────────── APP FACTORY ────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        description="""
## InstaIQ API

AI-powered Instagram audience intelligence platform.

### Features
- **Audience Analysis** — Demographics, language, country distribution
- **Fake Follower Detection** — ML-powered bot scoring
- **Compare Accounts** — Mutual followers and audience overlap (Pro)
- **AI Insights** — GPT-generated summaries and recommendations
- **Rate Limited** — Free: 3/day, Pro: unlimited

### Authentication
All endpoints except `/health` require a Bearer JWT token.  
Obtain one via `POST /auth/register` or `POST /auth/login`.
        """,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Rate limiter
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Request ID middleware
    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        import uuid
        req_id = str(uuid.uuid4())[:8]
        structlog.contextvars.bind_contextvars(request_id=req_id)
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response

    # Global error handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        log.error("unhandled_exception", path=request.url.path, error=str(exc))
        return JSONResponse(status_code=500, content={"detail": "An internal error occurred."})

    # Routes
    app.include_router(router, prefix="/api/v1")

    @app.on_event("startup")
    async def startup():
        log.info("app_starting", env=settings.ENVIRONMENT, version=settings.VERSION)
        await init_db()
        log.info("app_ready")

    @app.on_event("shutdown")
    async def shutdown():
        log.info("app_shutting_down")

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
