"""Model lifecycle: loaded once at startup, held on app.state.

Modes:
  real        — model/metadata.json found, adapter loaded successfully
  mock        — no metadata.json (or framework "mock"), non-production only
  unavailable — production without a model, or a load failure; /predict
                returns a typed 503 and /health reports model_loaded=false
"""

import json
from dataclasses import dataclass, field
from pathlib import Path

from pydantic import ValidationError

from app.adapters.base import ModelAdapter, ModelLoadError
from app.adapters.registry import MockInProductionError, create_adapter
from app.core.config import Settings
from app.core.logging import get_logger
from app.schemas.metadata import (
    MOCK_LABELS,
    ModelLabels,
    ModelMetadata,
    build_mock_metadata,
)

logger = get_logger(__name__)


@dataclass
class ModelState:
    mode: str = "unavailable"  # "real" | "mock" | "unavailable"
    adapter: ModelAdapter | None = None
    metadata: ModelMetadata | None = None
    labels: list[str] = field(default_factory=list)

    @property
    def is_ready(self) -> bool:
        return self.adapter is not None and self.adapter.is_loaded

    @property
    def is_mock(self) -> bool:
        return self.mode == "mock"


def _read_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def initialize_model_state(settings: Settings) -> ModelState:
    metadata_path = settings.model_dir / settings.model_metadata_file
    labels_path = settings.model_dir / settings.model_labels_file

    if metadata_path.exists():
        try:
            metadata = ModelMetadata.model_validate(_read_json(metadata_path))
            labels = ModelLabels.model_validate(_read_json(labels_path)).labels
            adapter = create_adapter(metadata, labels, settings.model_dir, settings.app_env)
            adapter.load()
        except FileNotFoundError:
            logger.error("model_init_failed reason=labels_file_missing")
            return ModelState()
        except (json.JSONDecodeError, ValidationError):
            logger.exception("model_init_failed reason=invalid_metadata_or_labels")
            return ModelState()
        except MockInProductionError:
            logger.error("model_init_failed reason=mock_forbidden_in_production")
            return ModelState()
        except ModelLoadError as exc:
            # Message is safe (no absolute paths); full trace stays in logs.
            logger.error("model_init_failed reason=load_error detail=%s", exc)
            return ModelState()

        mode = "mock" if metadata.framework == "mock" else "real"
        logger.info(
            "model_loaded mode=%s name=%s version=%s classes=%d",
            mode, metadata.model_name, metadata.model_version, len(labels),
        )
        return ModelState(mode=mode, adapter=adapter, metadata=metadata, labels=labels)

    # No metadata.json — mock in development/test, safe degradation in production.
    if settings.is_production:
        logger.warning("model_unavailable reason=no_metadata_in_production")
        return ModelState()

    metadata = build_mock_metadata(settings.max_upload_mb)
    adapter = create_adapter(metadata, MOCK_LABELS, settings.model_dir, settings.app_env)
    adapter.load()
    logger.info("model_loaded mode=mock (development fallback — NOT real predictions)")
    return ModelState(mode="mock", adapter=adapter, metadata=metadata, labels=list(MOCK_LABELS))
