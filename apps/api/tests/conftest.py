"""Shared fixtures: app clients in each mode + generated test images.

All test images are tiny and generated in memory with Pillow — no binary
fixtures are committed to the repo.
"""

import io
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.core.config import Settings
from app.main import create_app

MISSING_MODEL_DIR = Path("model-dir-that-does-not-exist")


def make_settings(**overrides) -> Settings:
    defaults = {
        "app_env": "test",
        "cors_origins": "http://localhost:3000",
        "model_dir": MISSING_MODEL_DIR,
        "max_upload_mb": 1,  # small so oversize tests stay cheap
    }
    defaults.update(overrides)
    return Settings(_env_file=None, **defaults)


@pytest.fixture
def dev_client():
    """App in mock mode (no metadata.json, non-production env)."""
    app = create_app(make_settings())
    with TestClient(app, raise_server_exceptions=False) as client:
        yield client


@pytest.fixture
def prod_client():
    """Production without a model -> degraded 'unavailable' mode."""
    app = create_app(make_settings(app_env="production"))
    with TestClient(app, raise_server_exceptions=False) as client:
        yield client


def write_model_config(model_dir: Path, metadata: dict, labels: list[str] | None) -> None:
    model_dir.mkdir(parents=True, exist_ok=True)
    (model_dir / "metadata.json").write_text(json.dumps(metadata), encoding="utf-8")
    if labels is not None:
        (model_dir / "labels.json").write_text(json.dumps({"labels": labels}), encoding="utf-8")


BASE_TF_METADATA = {
    "model_name": "test-model",
    "model_version": "1.0.0",
    "framework": "tensorflow",
    "model_path": "model.keras",
    "input_width": 224,
    "input_height": 224,
    "channels": 3,
    "color_mode": "rgb",
    "preprocessing": "resize",
    "normalization": "0-1",
    "confidence_threshold": 0.5,
    "max_upload_mb": 10,
}


# ---------- image factories ----------

def image_bytes(fmt: str = "JPEG", size: tuple[int, int] = (64, 64), mode: str = "RGB") -> bytes:
    buffer = io.BytesIO()
    Image.new(mode, size, color=(120, 90, 80) if mode == "RGB" else 128).save(buffer, format=fmt)
    return buffer.getvalue()


@pytest.fixture
def jpeg_bytes() -> bytes:
    return image_bytes("JPEG")


@pytest.fixture
def png_bytes() -> bytes:
    return image_bytes("PNG")


@pytest.fixture
def corrupt_jpeg_bytes(jpeg_bytes) -> bytes:
    # Valid header so the type checks pass, garbage body so decoding fails.
    return jpeg_bytes[:24] + b"\x00garbage-not-an-image" * 40


@pytest.fixture
def huge_dimensions_png() -> bytes:
    # 8100x8100 grayscale: >8000px per side and >50MP, compresses to ~a few KB.
    return image_bytes("PNG", size=(8100, 8100), mode="L")


@pytest.fixture
def tiny_png() -> bytes:
    return image_bytes("PNG", size=(8, 8))


def upload(client: TestClient, data: bytes, filename: str = "test.jpg",
           content_type: str = "image/jpeg"):
    return client.post("/api/v1/predict", files={"file": (filename, data, content_type)})
