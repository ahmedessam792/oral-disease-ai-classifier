"""FastAPI application factory.

Run locally:  uvicorn app.main:app --reload --port 8000
OpenAPI docs: http://localhost:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.v1.router import api_router
from app.core.config import Settings, get_settings
from app.core.errors import register_error_handlers
from app.core.logging import configure_logging, get_logger
from app.services.model_state import initialize_model_state

logger = get_logger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    configure_logging()
    settings = settings or get_settings()

    if settings.is_production and "*" in settings.cors_origin_list:
        raise RuntimeError("Wildcard CORS origins are forbidden in production.")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Load once at startup; failure degrades safely to "unavailable".
        app.state.model_state = initialize_model_state(settings)
        yield

    app = FastAPI(
        title="Oral Disease AI Classifier API",
        description=(
            "Oral image-classification API. Not a medical device. Arcus provides "
            "an AI classification result and is not a substitute for professional "
            "medical advice, diagnosis, or treatment."
        ),
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    register_error_handlers(app)
    app.include_router(health_router)
    app.include_router(api_router)
    return app


app = create_app()
