import numpy as np
from PIL import Image

from app.schemas.metadata import ModelMetadata
from app.services.preprocessing import preprocess_image


def metadata(**overrides) -> ModelMetadata:
    base = {
        "model_name": "m", "model_version": "1", "framework": "mock", "model_path": "",
        "input_width": 96, "input_height": 96, "channels": 3, "color_mode": "rgb",
        "preprocessing": "resize", "normalization": "0-1",
    }
    base.update(overrides)
    return ModelMetadata.model_validate(base)


def sample_image(size=(200, 120), mode="RGB") -> Image.Image:
    return Image.new(mode, size, color=(200, 100, 50) if mode == "RGB" else 200)


def test_rgb_shape_and_range_0_1():
    batch = preprocess_image(sample_image(), metadata())
    assert batch.shape == (1, 96, 96, 3)
    assert batch.dtype == np.float32
    assert batch.min() >= 0.0 and batch.max() <= 1.0


def test_grayscale_shape():
    m = metadata(channels=1, color_mode="grayscale")
    batch = preprocess_image(sample_image(), m)
    assert batch.shape == (1, 96, 96, 1)


def test_normalization_minus_one_to_one():
    batch = preprocess_image(sample_image(), metadata(normalization="-1-1"))
    assert batch.min() >= -1.0 and batch.max() <= 1.0
    # A solid (200,100,50) image is not all zeros after scaling.
    assert not np.allclose(batch, 0.0)


def test_normalization_none_keeps_0_255():
    batch = preprocess_image(sample_image(), metadata(normalization="none"))
    assert batch.max() > 1.0
    assert batch.max() <= 255.0


def test_normalization_imagenet_centers_values():
    batch = preprocess_image(sample_image(), metadata(normalization="imagenet"))
    # ImageNet standardization produces values outside [0, 1].
    assert batch.min() < 0.0


def test_center_crop_output_size():
    m = metadata(preprocessing="resize_center_crop", input_width=64, input_height=64)
    batch = preprocess_image(sample_image(size=(400, 100)), m)
    assert batch.shape == (1, 64, 64, 3)


def test_nonsquare_target_orientation():
    # (width=48, height=96) target must give an (H=96, W=48) array.
    m = metadata(input_width=48, input_height=96)
    batch = preprocess_image(sample_image(), m)
    assert batch.shape == (1, 96, 48, 3)
