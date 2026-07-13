"""Centralized, environment-driven configuration."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

# Repo layout: apps/api/app/core/config.py -> repo root is 5 levels up.
# Inside the Docker image the tree is shallower (/app/app/core/config.py) and
# MODEL_DIR is always provided via env, so fall back safely instead of crashing.
_PARENTS = Path(__file__).resolve().parents
REPO_ROOT = _PARENTS[4] if len(_PARENTS) > 4 else _PARENTS[-1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", protected_namespaces=())

    app_env: Literal["development", "test", "production"] = "development"

    # Comma-separated allowlist. Wildcard is rejected in production (see main.py).
    cors_origins: str = "http://localhost:3000"

    # --- Model selection ---------------------------------------------------
    # real  : the trained model must load; a failure is reported, never masked
    #         by falling back to the mock.
    # mock   : development/test predictor only; refused in production.
    # auto   : real when the model files are present, otherwise mock outside
    #          production. The default, and what local dev + Docker use.
    model_mode: Literal["auto", "real", "mock"] = "auto"
    model_framework: Literal["tensorflow", "mock"] = "tensorflow"

    # All model paths are resolved relative to model_dir — never absolute, so
    # the same settings work on any machine, in Docker, and on HF Spaces.
    model_dir: Path = REPO_ROOT / "model"
    model_path: str = "oral_disease_resnet50v2_deployment.keras"
    model_config_path: str = "class_config.json"

    # class_config.json carries no version field, so the deployment supplies
    # one. Bump it when a newly trained model is dropped in.
    model_version: str = "1.0.0"

    # Legacy metadata.json + labels.json fallback (see schemas/metadata.py).
    model_metadata_file: str = "metadata.json"
    model_labels_file: str = "labels.json"

    # Fallback upload limit; the model config can narrow it.
    max_upload_mb: int = 10

    api_host: str = "0.0.0.0"
    api_port: int = 8000

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def model_file(self) -> Path:
        return self.model_dir / self.model_path

    @property
    def class_config_file(self) -> Path:
        return self.model_dir / self.model_config_path


@lru_cache
def get_settings() -> Settings:
    return Settings()
