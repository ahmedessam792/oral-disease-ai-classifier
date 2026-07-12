from tests.conftest import upload


def error_code(response) -> str:
    return response.json()["error"]["code"]


def test_missing_file_field(dev_client):
    response = dev_client.post("/api/v1/predict")
    assert response.status_code == 400
    assert error_code(response) == "VALIDATION_ERROR"


def test_empty_file(dev_client):
    response = upload(dev_client, b"")
    assert response.status_code == 400
    assert error_code(response) == "EMPTY_FILE"


def test_invalid_extension(dev_client, jpeg_bytes):
    response = upload(dev_client, jpeg_bytes, filename="notes.txt")
    assert response.status_code == 400
    assert error_code(response) == "INVALID_FILE_TYPE"


def test_invalid_mime_type(dev_client, jpeg_bytes):
    response = upload(dev_client, jpeg_bytes, content_type="text/plain")
    assert response.status_code == 400
    assert error_code(response) == "INVALID_FILE_TYPE"


def test_oversized_file(dev_client):
    # max_upload_mb=1 in test settings; size check runs before decoding.
    response = upload(dev_client, b"\xff\xd8\xff" + b"0" * (2 * 1024 * 1024))
    assert response.status_code == 413
    assert error_code(response) == "FILE_TOO_LARGE"


def test_corrupt_image(dev_client, corrupt_jpeg_bytes):
    response = upload(dev_client, corrupt_jpeg_bytes)
    assert response.status_code == 400
    assert error_code(response) == "INVALID_IMAGE"


def test_unsafe_dimensions(dev_client, huge_dimensions_png):
    response = upload(dev_client, huge_dimensions_png, filename="big.png", content_type="image/png")
    assert response.status_code == 400
    assert error_code(response) == "IMAGE_TOO_LARGE_DIMENSIONS"


def test_image_too_small(dev_client, tiny_png):
    response = upload(dev_client, tiny_png, filename="tiny.png", content_type="image/png")
    assert response.status_code == 400
    assert error_code(response) == "INVALID_IMAGE"
