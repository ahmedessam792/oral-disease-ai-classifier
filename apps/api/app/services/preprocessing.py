"""Config-driven image preprocessing.

Input size, color mode, resize strategy, and normalization all come from
model/metadata.json so the pipeline matches whatever the final model was
trained with — no code changes on model swap.
"""

import numpy as np
from PIL import Image, ImageOps

from app.schemas.metadata import ModelMetadata

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def _resize(image: Image.Image, metadata: ModelMetadata) -> Image.Image:
    target = (metadata.input_width, metadata.input_height)
    if metadata.preprocessing == "resize_center_crop":
        return ImageOps.fit(image, target, Image.Resampling.LANCZOS)
    return image.resize(target, Image.Resampling.LANCZOS)


def preprocess_image(image: Image.Image, metadata: ModelMetadata) -> np.ndarray:
    """PIL image -> float32 batch of shape (1, H, W, C)."""
    # Respect camera orientation before anything else.
    image = ImageOps.exif_transpose(image)

    image = image.convert("L" if metadata.color_mode == "grayscale" else "RGB")
    image = _resize(image, metadata)

    array = np.asarray(image, dtype=np.float32)
    if metadata.color_mode == "grayscale":
        array = array[..., np.newaxis]

    if metadata.normalization == "0-1":
        array = array / 255.0
    elif metadata.normalization == "-1-1":
        array = array / 127.5 - 1.0
    elif metadata.normalization == "imagenet":
        array = array / 255.0
        if metadata.channels == 3:
            array = (array - IMAGENET_MEAN) / IMAGENET_STD
    # "none": raw 0-255 floats (e.g. models with a built-in Rescaling layer)

    return array[np.newaxis, ...]
