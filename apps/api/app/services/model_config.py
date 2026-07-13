"""Loads the model's configuration from disk.

Preferred source is `class_config.json` (what the training pipeline exports).
The older `metadata.json` + `labels.json` pair is still honored so existing
setups keep working. Either way the result is the same internal shape —
(ModelMetadata, labels) — which is all the rest of the app knows about.

Class names are never hardcoded: they come from these files only.
"""

import json
from pathlib import Path

from pydantic import ValidationError

from app.core.config import Settings
from app.schemas.metadata import ClassConfig, ModelLabels, ModelMetadata


class ModelConfigError(Exception):
    """Configuration is missing or invalid. Message is safe to log, and is
    mapped to a generic public error before it can reach a client."""


def _read_json(path: Path) -> dict:
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError as exc:
        raise ModelConfigError(
            f"Config file '{path.name}' not found in the model directory."
        ) from exc
    except json.JSONDecodeError as exc:
        raise ModelConfigError(f"Config file '{path.name}' is not valid JSON.") from exc


def has_class_config(settings: Settings) -> bool:
    return settings.class_config_file.exists()


def has_legacy_config(settings: Settings) -> bool:
    return (settings.model_dir / settings.model_metadata_file).exists()


def load_class_config(settings: Settings) -> tuple[ModelMetadata, list[str]]:
    """class_config.json -> (metadata, labels)."""
    raw = _read_json(settings.class_config_file)
    try:
        config = ClassConfig.model_validate(raw)
        metadata = config.to_metadata(
            model_path=settings.model_path,
            model_version=settings.model_version,
            max_upload_mb=settings.max_upload_mb,
            framework=settings.model_framework,
        )
    except (ValidationError, ValueError) as exc:
        raise ModelConfigError(f"class_config.json is invalid: {exc}") from exc

    return metadata, list(config.classes)


def load_legacy_config(settings: Settings) -> tuple[ModelMetadata, list[str]]:
    """metadata.json + labels.json -> (metadata, labels)."""
    metadata_raw = _read_json(settings.model_dir / settings.model_metadata_file)
    labels_raw = _read_json(settings.model_dir / settings.model_labels_file)
    try:
        metadata = ModelMetadata.model_validate(metadata_raw)
        labels = ModelLabels.model_validate(labels_raw).labels
    except ValidationError as exc:
        raise ModelConfigError(f"metadata.json or labels.json is invalid: {exc}") from exc

    return metadata, labels


def load_model_config(settings: Settings) -> tuple[ModelMetadata, list[str]]:
    """Resolve whichever config format is present, preferring class_config.json."""
    if has_class_config(settings):
        return load_class_config(settings)
    if has_legacy_config(settings):
        return load_legacy_config(settings)
    raise ModelConfigError(
        f"No model configuration found ('{settings.model_config_path}' or "
        f"'{settings.model_metadata_file}')."
    )
