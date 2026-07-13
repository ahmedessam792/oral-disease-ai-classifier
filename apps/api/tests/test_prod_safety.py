"""Production-safety rules: the mock is development-only, CORS can't be
wildcarded, and a real-model failure is REPORTED — never silently replaced
by mock predictions."""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import BASE_TF_METADATA, make_settings, upload, write_model_config


def test_mock_framework_is_rejected_in_production(tmp_path, jpeg_bytes):
    mock_metadata = {**BASE_TF_METADATA, "framework": "mock", "model_path": ""}
    write_model_config(tmp_path, mock_metadata, ["Mock A", "Mock B"])

    app = create_app(make_settings(app_env="production", model_dir=tmp_path))
    with TestClient(app, raise_server_exceptions=False) as client:
        health = client.get("/health").json()
        assert health["mode"] == "model_load_failed"
        assert health["error_code"] == "MOCK_FORBIDDEN_IN_PRODUCTION"
        assert health["model_loaded"] is False

        response = upload(client, jpeg_bytes)
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "MODEL_NOT_AVAILABLE"


def test_explicit_mock_mode_is_rejected_in_production(jpeg_bytes):
    """MODEL_MODE=mock must not start a production server in mock mode."""
    app = create_app(make_settings(app_env="production", model_mode="mock"))
    with TestClient(app, raise_server_exceptions=False) as client:
        health = client.get("/health").json()
        assert health["mode"] == "model_load_failed"
        assert health["error_code"] == "MOCK_FORBIDDEN_IN_PRODUCTION"
        assert upload(client, jpeg_bytes).status_code == 503


def test_mock_framework_allowed_in_development(tmp_path, jpeg_bytes):
    mock_metadata = {**BASE_TF_METADATA, "framework": "mock", "model_path": ""}
    write_model_config(tmp_path, mock_metadata, ["Mock A", "Mock B"])

    app = create_app(make_settings(app_env="development", model_dir=tmp_path))
    with TestClient(app, raise_server_exceptions=False) as client:
        assert client.get("/health").json()["mode"] == "mock"
        body = upload(client, jpeg_bytes).json()
        assert body["mock"] is True
        assert set(body["probabilities"]) == {"Mock A", "Mock B"}


def test_real_mode_never_falls_back_to_mock(tmp_path, jpeg_bytes):
    """MODEL_MODE=real with an unloadable model must fail loudly, even in
    development, where the mock would otherwise be permitted."""
    write_model_config(tmp_path, BASE_TF_METADATA, ["A", "B", "C"])

    app = create_app(
        make_settings(app_env="development", model_mode="real", model_dir=tmp_path)
    )
    with TestClient(app, raise_server_exceptions=False) as client:
        health = client.get("/health").json()
        assert health["mode"] == "model_load_failed"
        assert health["model_loaded"] is False

        response = upload(client, jpeg_bytes)
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "MODEL_NOT_AVAILABLE"
        # Crucially: no mock prediction was served.
        assert "predicted_class" not in response.json()


def test_missing_model_file_reports_load_failure(tmp_path, jpeg_bytes):
    write_model_config(tmp_path, BASE_TF_METADATA, ["A", "B", "C"])

    app = create_app(make_settings(app_env="production", model_dir=tmp_path))
    with TestClient(app, raise_server_exceptions=False) as client:
        health = client.get("/health").json()
        assert health["mode"] == "model_load_failed"
        assert health["error_code"] == "MODEL_LOAD_FAILED"
        assert upload(client, jpeg_bytes).status_code == 503


def test_invalid_metadata_reports_config_error(tmp_path):
    write_model_config(tmp_path, {"model_name": "broken"}, ["A", "B"])
    app = create_app(make_settings(model_dir=tmp_path))
    with TestClient(app, raise_server_exceptions=False) as client:
        health = client.get("/health").json()
        assert health["mode"] == "model_load_failed"
        assert health["error_code"] == "INVALID_MODEL_CONFIG"


def test_missing_labels_file_reports_config_error(tmp_path):
    write_model_config(tmp_path, BASE_TF_METADATA, labels=None)
    app = create_app(make_settings(model_dir=tmp_path))
    with TestClient(app, raise_server_exceptions=False) as client:
        assert client.get("/health").json()["mode"] == "model_load_failed"


def test_wildcard_cors_is_rejected_in_production():
    with pytest.raises(RuntimeError, match="Wildcard CORS"):
        create_app(make_settings(app_env="production", cors_origins="*"))


def test_wildcard_cors_is_allowed_in_development():
    create_app(make_settings(app_env="development", cors_origins="*"))
