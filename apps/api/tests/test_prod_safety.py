"""Production-safety rules: mock is dev-only, CORS can't be wildcarded,
and load failures degrade to a typed 503 instead of crashing."""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import BASE_TF_METADATA, make_settings, upload, write_model_config


def test_mock_framework_is_rejected_in_production(tmp_path, jpeg_bytes):
    mock_metadata = {**BASE_TF_METADATA, "framework": "mock", "model_path": ""}
    write_model_config(tmp_path, mock_metadata, ["Mock A", "Mock B"])

    app = create_app(make_settings(app_env="production", model_dir=tmp_path))
    with TestClient(app, raise_server_exceptions=False) as client:
        assert client.get("/health").json()["mode"] == "unavailable"
        response = upload(client, jpeg_bytes)
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "MODEL_NOT_AVAILABLE"


def test_mock_framework_allowed_in_development(tmp_path, jpeg_bytes):
    mock_metadata = {**BASE_TF_METADATA, "framework": "mock", "model_path": ""}
    write_model_config(tmp_path, mock_metadata, ["Mock A", "Mock B"])

    app = create_app(make_settings(app_env="development", model_dir=tmp_path))
    with TestClient(app, raise_server_exceptions=False) as client:
        assert client.get("/health").json()["mode"] == "mock"
        body = upload(client, jpeg_bytes).json()
        assert body["mock"] is True
        assert set(body["probabilities"]) == {"Mock A", "Mock B"}


def test_tensorflow_metadata_without_runtime_degrades_safely(tmp_path, jpeg_bytes):
    # metadata.json points at a real framework, but TF isn't installed and
    # the model file doesn't exist -> unavailable, never a crash.
    write_model_config(tmp_path, BASE_TF_METADATA, ["A", "B", "C"])

    app = create_app(make_settings(app_env="production", model_dir=tmp_path))
    with TestClient(app, raise_server_exceptions=False) as client:
        assert client.get("/health").json() == {
            "status": "ok", "model_loaded": False, "mode": "unavailable",
        }
        assert upload(client, jpeg_bytes).status_code == 503


def test_invalid_metadata_degrades_safely(tmp_path):
    write_model_config(tmp_path, {"model_name": "broken"}, ["A", "B"])
    app = create_app(make_settings(model_dir=tmp_path))
    with TestClient(app, raise_server_exceptions=False) as client:
        assert client.get("/health").json()["mode"] == "unavailable"


def test_missing_labels_file_degrades_safely(tmp_path):
    write_model_config(tmp_path, BASE_TF_METADATA, labels=None)
    app = create_app(make_settings(model_dir=tmp_path))
    with TestClient(app, raise_server_exceptions=False) as client:
        assert client.get("/health").json()["mode"] == "unavailable"


def test_wildcard_cors_is_rejected_in_production():
    with pytest.raises(RuntimeError, match="Wildcard CORS"):
        create_app(make_settings(app_env="production", cors_origins="*"))


def test_wildcard_cors_is_allowed_in_development():
    create_app(make_settings(app_env="development", cors_origins="*"))
