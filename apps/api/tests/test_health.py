def test_health_in_mock_mode(dev_client):
    response = dev_client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body == {"status": "ok", "model_loaded": True, "mode": "mock"}


def test_health_in_production_without_model(prod_client):
    response = prod_client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body == {"status": "ok", "model_loaded": False, "mode": "unavailable"}
