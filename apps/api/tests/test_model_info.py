from app.schemas.metadata import MOCK_LABELS


def test_model_info_in_mock_mode(dev_client):
    response = dev_client.get("/api/v1/model/info")
    assert response.status_code == 200
    body = response.json()
    assert body["model_name"] == "mock-development-model"
    assert body["mock"] is True
    assert body["classes"] == MOCK_LABELS
    assert body["input_size"] == {"width": 224, "height": 224}
    assert "not a substitute for professional medical advice" in body["disclaimer"]


def test_model_info_unavailable_in_production(prod_client):
    response = prod_client.get("/api/v1/model/info")
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "MODEL_NOT_AVAILABLE"
