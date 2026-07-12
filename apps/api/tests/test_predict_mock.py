import math

from tests.conftest import upload


def test_predict_returns_full_contract(dev_client, jpeg_bytes):
    response = upload(dev_client, jpeg_bytes)
    assert response.status_code == 200
    body = response.json()

    assert set(body) == {
        "predicted_class", "confidence", "probabilities", "model_name", "model_version", "mock",
    }
    assert body["mock"] is True
    assert body["model_name"] == "mock-development-model"
    assert body["predicted_class"] in body["probabilities"]
    assert math.isclose(sum(body["probabilities"].values()), 1.0, abs_tol=1e-3)
    assert math.isclose(body["confidence"], max(body["probabilities"].values()), abs_tol=1e-9)
    assert 0.0 <= body["confidence"] <= 1.0


def test_predict_accepts_png(dev_client, png_bytes):
    response = upload(dev_client, png_bytes, filename="scan.png", content_type="image/png")
    assert response.status_code == 200


def test_mock_predictions_are_deterministic(dev_client, jpeg_bytes):
    first = upload(dev_client, jpeg_bytes).json()
    second = upload(dev_client, jpeg_bytes).json()
    assert first["probabilities"] == second["probabilities"]


def test_predict_unavailable_in_production_without_model(prod_client, jpeg_bytes):
    response = upload(prod_client, jpeg_bytes)
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "MODEL_NOT_AVAILABLE"
