"""Model lifecycle: resolved once at startup, held on app.state.

Modes reported by /health:

  real              the trained model is loaded and serving
  mock              the development predictor is serving (never in production)
  unavailable       no model is configured
  model_load_failed real mode was expected but the model could not be loaded

The last one matters: when the real model is expected, a failure is REPORTED,
never silently replaced by mock predictions.
"""

from dataclasses import dataclass, field

from app.adapters.base import ModelAdapter, ModelLoadError
from app.adapters.registry import MockInProductionError, create_adapter
from app.core.config import Settings
from app.core.logging import get_logger
from app.schemas.metadata import MOCK_LABELS, ModelMetadata, build_mock_metadata
from app.services.model_config import ModelConfigError, load_model_config

logger = get_logger(__name__)

REAL = "real"
MOCK = "mock"
UNAVAILABLE = "unavailable"
LOAD_FAILED = "model_load_failed"


@dataclass
class ModelState:
    mode: str = UNAVAILABLE
    adapter: ModelAdapter | None = None
    metadata: ModelMetadata | None = None
    labels: list[str] = field(default_factory=list)
    # Short, safe reason shown by /health when something went wrong. Never
    # contains paths, stack traces, or model internals.
    error_code: str | None = None

    @property
    def is_ready(self) -> bool:
        return self.adapter is not None and self.adapter.is_loaded

    @property
    def is_mock(self) -> bool:
        return self.mode == MOCK


def _failed(error_code: str) -> ModelState:
    return ModelState(mode=LOAD_FAILED, error_code=error_code)


def _load_real(settings: Settings) -> ModelState:
    """Load the trained model. Any failure returns model_load_failed."""
    try:
        metadata, labels = load_model_config(settings)
    except ModelConfigError as exc:
        logger.error("model_config_invalid detail=%s", exc)
        return _failed("INVALID_MODEL_CONFIG")

    try:
        adapter = create_adapter(metadata, labels, settings.model_dir, settings.app_env)
        adapter.load()
    except MockInProductionError:
        logger.error("model_init_failed reason=mock_forbidden_in_production")
        return _failed("MOCK_FORBIDDEN_IN_PRODUCTION")
    except ModelLoadError as exc:
        # Safe message (no absolute paths); full trace stays in the logs.
        logger.error("model_load_failed detail=%s", exc)
        return _failed("MODEL_LOAD_FAILED")

    # A config may legitimately declare the mock framework (development
    # setups). The mode must follow the adapter that actually got created,
    # otherwise mock predictions would be reported as real ones and the UI
    # would drop its mock banner.
    mode = MOCK if metadata.framework == "mock" else REAL

    logger.info(
        "model_loaded mode=%s name=%s version=%s classes=%d input=%dx%d normalization=%s",
        mode,
        metadata.model_name,
        metadata.model_version,
        len(labels),
        metadata.input_width,
        metadata.input_height,
        metadata.normalization,
    )
    return ModelState(mode=mode, adapter=adapter, metadata=metadata, labels=labels)


def _load_mock(settings: Settings) -> ModelState:
    metadata = build_mock_metadata(settings.max_upload_mb)
    try:
        adapter = create_adapter(metadata, MOCK_LABELS, settings.model_dir, settings.app_env)
        adapter.load()
    except MockInProductionError:
        logger.error("model_init_failed reason=mock_forbidden_in_production")
        return _failed("MOCK_FORBIDDEN_IN_PRODUCTION")

    logger.warning("model_loaded mode=mock — DEVELOPMENT PREDICTOR, NOT REAL PREDICTIONS")
    return ModelState(mode=MOCK, adapter=adapter, metadata=metadata, labels=list(MOCK_LABELS))


def _real_model_present(settings: Settings) -> bool:
    return settings.model_file.exists() and settings.class_config_file.exists()


def initialize_model_state(settings: Settings) -> ModelState:
    mode = settings.model_mode

    if mode == "real":
        return _load_real(settings)

    if mode == "mock":
        if settings.is_production:
            logger.error("model_init_failed reason=mock_forbidden_in_production")
            return _failed("MOCK_FORBIDDEN_IN_PRODUCTION")
        return _load_mock(settings)

    # auto: prefer the real model whenever its files are there.
    if _real_model_present(settings):
        return _load_real(settings)

    # Legacy metadata.json setups are still honored by load_model_config.
    if (settings.model_dir / settings.model_metadata_file).exists():
        return _load_real(settings)

    if settings.is_production:
        logger.warning("model_unavailable reason=no_model_files_in_production")
        return ModelState(mode=UNAVAILABLE, error_code="MODEL_NOT_CONFIGURED")

    logger.info("model_auto_fallback reason=no_model_files → mock (development only)")
    return _load_mock(settings)
