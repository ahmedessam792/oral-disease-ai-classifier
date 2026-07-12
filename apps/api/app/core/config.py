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

    model_dir: Path = REPO_ROOT / "model"
    model_metadata_file: str = "metadata.json"
    model_labels_file: str = "labels.json"

    # Fallback upload limit; model/metadata.json can narrow it.
    max_upload_mb: int = 10

    api_host: str = "0.0.0.0"
    api_port: int = 8000

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
