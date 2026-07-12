"""Strict, ordered upload validation. Everything happens in memory; the
uploaded bytes are never written to disk and never logged."""

import io
from pathlib import PurePosixPath, PureWindowsPath

from PIL import Image, UnidentifiedImageError

from app.core import errors

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}

MIN_DIMENSION = 32
MAX_DIMENSION = 8000
MAX_PIXELS = 50_000_000  # decompression-bomb guard

# Pillow raises DecompressionBombError above 2x this value; our explicit
# dimension check below enforces the exact budget first in most cases.
Image.MAX_IMAGE_PIXELS = MAX_PIXELS


def _extension(filename: str) -> str:
    # Handle both separators defensively; only the final suffix matters.
    name = PureWindowsPath(PurePosixPath(filename).name).name
    dot = name.rfind(".")
    return name[dot:].lower() if dot != -1 else ""


def validate_and_decode(
    data: bytes,
    filename: str | None,
    content_type: str | None,
    max_upload_mb: int,
) -> Image.Image:
    """Validate an upload and return a decoded PIL image, or raise ApiError."""
    if not data:
        raise errors.empty_file()

    ext = _extension(filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise errors.invalid_file_type(
            "Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, BMP."
        )

    if not content_type or content_type.lower() not in ALLOWED_MIME_TYPES:
        raise errors.invalid_file_type(
            "Unsupported content type. Upload a JPG, PNG, WEBP, or BMP image."
        )

    if len(data) > max_upload_mb * 1024 * 1024:
        raise errors.file_too_large(max_upload_mb)

    try:
        with Image.open(io.BytesIO(data)) as probe:
            width, height = probe.size
            if width * height > MAX_PIXELS or width > MAX_DIMENSION or height > MAX_DIMENSION:
                raise errors.image_dimensions(
                    f"Image dimensions are too large. Maximum {MAX_DIMENSION}px per side."
                )
            probe.verify()  # integrity check; invalidates the handle
        image = Image.open(io.BytesIO(data))
        image.load()  # force full decode now so corruption surfaces here
    except errors.ApiError:
        raise
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, ValueError) as exc:
        if isinstance(exc, Image.DecompressionBombError):
            raise errors.image_dimensions("Image dimensions are too large.") from exc
        raise errors.invalid_image() from exc

    if image.width < MIN_DIMENSION or image.height < MIN_DIMENSION:
        raise errors.invalid_image(
            f"Image is too small to analyze. Minimum {MIN_DIMENSION}x{MIN_DIMENSION}px."
        )

    return image
