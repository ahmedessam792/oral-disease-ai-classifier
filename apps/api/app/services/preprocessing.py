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
    """PIL image -> float32 batch of shape (1, H, W, C).

    Every step is driven by the model's config (model/class_config.json), so
    the pipeline follows the model rather than the other way around.
    """
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
    # "none": pixels stay in 0-255. This is what the real ResNet50V2 wants —
    # it carries its own Rescaling(1/127.5, offset=-1) layer, so scaling here
    # would double-normalize the input and corrupt every prediction.

    batch = array[np.newaxis, ...]

    expected = (1, metadata.input_height, metadata.input_width, metadata.channels)
    if batch.shape != expected or batch.dtype != np.float32:
        raise ValueError(
            f"Preprocessing produced {batch.shape}/{batch.dtype}, expected {expected}/float32."
        )
    return batch
