def test_health_in_mock_mode(dev_client):
    response = dev_client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True
    assert body["mode"] == "mock"
    assert body["error_code"] is None


def test_health_in_production_without_model(prod_client):
    response = prod_client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is False
    assert body["mode"] == "unavailable"
    assert body["error_code"] == "MODEL_NOT_CONFIGURED"


def test_health_never_leaks_paths_or_internals(prod_client):
    body = prod_client.get("/health").text
    for leak in ("Traceback", "/app", "C:\\", "site-packages", ".keras"):
        assert leak not in body
