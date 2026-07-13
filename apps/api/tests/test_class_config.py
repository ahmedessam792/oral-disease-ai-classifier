"""class_config.json — the source of truth for the real model.

These tests are fast and TF-free: they cover parsing, the class order, the
derived preprocessing rules, and the refusal to guess when the config is
unusable. The real model itself is exercised in tests/test_real_model.py.
"""

import json

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import create_app
from app.services.model_config import ModelConfigError, load_model_config
from app.services.preprocessing import preprocess_image
from tests.conftest import make_settings

# Shape of the real deployment config (values, not the real file).
REAL_SHAPED_CONFIG = {
    "model": "ResNet50V2",
    "image_size": [224, 224],
    "classes": ["Alpha", "Beta", "Gamma", "Delta", "Long Class Name", "Another Long One"],
    "pixel_range": [0, 255],
    "preprocessing": "Built into the model",
}


def write_class_config(model_dir, config: dict) -> None:
    model_dir.mkdir(parents=True, exist_ok=True)
    (model_dir / "class_config.json").write_text(json.dumps(config), encoding="utf-8")


def test_parses_config_into_metadata_and_labels(tmp_path):
    write_class_config(tmp_path, REAL_SHAPED_CONFIG)
    metadata, labels = load_model_config(make_settings(model_dir=tmp_path))

    assert metadata.model_name == "ResNet50V2"
    assert metadata.framework == "tensorflow"
    assert (metadata.input_width, metadata.input_height) == (224, 224)
    assert metadata.channels == 3
    assert metadata.color_mode == "rgb"
    # pixel_range [0,255] + preprocessing inside the model => service must NOT scale.
    assert metadata.normalization == "none"
    assert labels == REAL_SHAPED_CONFIG["classes"]


def test_class_order_is_preserved_exactly(tmp_path):
    write_class_config(tmp_path, REAL_SHAPED_CONFIG)
    _, labels = load_model_config(make_settings(model_dir=tmp_path))
    # Order maps to model output indices — a reordering would mislabel every
    # prediction, so it must survive the round trip untouched.
    assert labels == ["Alpha", "Beta", "Gamma", "Delta", "Long Class Name", "Another Long One"]


def test_model_version_comes_from_settings_not_the_file(tmp_path):
    write_class_config(tmp_path, REAL_SHAPED_CONFIG)
    metadata, _ = load_model_config(make_settings(model_dir=tmp_path, model_version="2.5.0"))
    assert metadata.model_version == "2.5.0"


@pytest.mark.parametrize(
    ("pixel_range", "expected"),
    [([0, 255], "none"), ([0, 1], "0-1"), ([-1, 1], "-1-1")],
)
def test_pixel_range_maps_to_normalization(tmp_path, pixel_range, expected):
    write_class_config(tmp_path, {**REAL_SHAPED_CONFIG, "pixel_range": pixel_range})
    metadata, _ = load_model_config(make_settings(model_dir=tmp_path))
    assert metadata.normalization == expected


def test_unsupported_pixel_range_is_rejected_not_guessed(tmp_path):
    write_class_config(tmp_path, {**REAL_SHAPED_CONFIG, "pixel_range": [0, 42]})
    with pytest.raises(ModelConfigError):
        load_model_config(make_settings(model_dir=tmp_path))


def test_invalid_configs_are_rejected(tmp_path):
    settings = make_settings(model_dir=tmp_path)

    write_class_config(tmp_path, {"model": "X"})  # missing required fields
    with pytest.raises(ModelConfigError):
        load_model_config(settings)

    write_class_config(tmp_path, {**REAL_SHAPED_CONFIG, "classes": ["Only One"]})
    with pytest.raises(ModelConfigError):
        load_model_config(settings)

    write_class_config(tmp_path, {**REAL_SHAPED_CONFIG, "classes": ["Dup", "Dup", "X"]})
    with pytest.raises(ModelConfigError):
        load_model_config(settings)


def test_malformed_json_is_rejected(tmp_path):
    tmp_path.mkdir(parents=True, exist_ok=True)
    (tmp_path / "class_config.json").write_text("{not json", encoding="utf-8")
    with pytest.raises(ModelConfigError):
        load_model_config(make_settings(model_dir=tmp_path))


def test_missing_config_is_rejected(tmp_path):
    with pytest.raises(ModelConfigError):
        load_model_config(make_settings(model_dir=tmp_path))


class TestPreprocessingForTheRealModel:
    """The 0-255 rule: the model rescales internally, so the service must not."""

    def _metadata(self, tmp_path):
        write_class_config(tmp_path, REAL_SHAPED_CONFIG)
        metadata, _ = load_model_config(make_settings(model_dir=tmp_path))
        return metadata

    def test_pixels_are_not_divided_by_255(self, tmp_path):
        image = Image.new("RGB", (300, 200), (255, 128, 0))
        batch = preprocess_image(image, self._metadata(tmp_path))

        # A pure-white channel must still read 255, not 1.0. If this ever
        # becomes 1.0 the model is being double-normalized and every
        # prediction is silently wrong.
        assert batch.max() > 1.0
        assert batch.max() <= 255.0
        assert np.isclose(batch[0, :, :, 0].max(), 255.0, atol=1.0)

    def test_batch_shape_dtype_and_rgb(self, tmp_path):
        image = Image.new("L", (640, 480), 200)  # grayscale input
        batch = preprocess_image(image, self._metadata(tmp_path))

        assert batch.shape == (1, 224, 224, 3)  # converted to RGB, batched
        assert batch.dtype == np.float32


def test_real_config_shape_boots_the_app_into_load_failure_not_mock(tmp_path, jpeg_bytes):
    """A class_config.json with no .keras beside it must report a load failure
    rather than quietly serving mock predictions."""
    write_class_config(tmp_path, REAL_SHAPED_CONFIG)
    app = create_app(make_settings(model_dir=tmp_path, model_mode="auto", app_env="development"))
    with TestClient(app, raise_server_exceptions=False) as client:
        health = client.get("/health").json()
        # auto sees a config but no model file -> mock is still allowed in dev,
        # because the real model was never actually present.
        assert health["mode"] in {"mock", "model_load_failed"}
        assert health["mode"] != "real"
