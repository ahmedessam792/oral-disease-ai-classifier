"""Pydantic validation for the model's configuration files.

Two supported sources, both supplied by the ML owner alongside the trained
model (see model/README.md):

1. `class_config.json` — the format the training pipeline exports, and the
   source of truth for the real ResNet50V2 deployment model.
2. `metadata.json` + `labels.json` — the original hand-written format, kept
   working as a fallback.

Everything the inference pipeline does — input size, color mode,
normalization, class labels — is driven by these files so the model can be
replaced without code changes. Class names are NEVER hardcoded.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ModelMetadata(BaseModel):
    model_config = ConfigDict(protected_namespaces=(), extra="ignore")

    model_name: str = Field(min_length=1)
    model_version: str = Field(min_length=1)
    framework: Literal["tensorflow", "mock"]
    model_path: str = ""  # filename inside model/; empty is valid only for mock
    input_width: int = Field(ge=16, le=2048)
    input_height: int = Field(ge=16, le=2048)
    channels: Literal[1, 3]
    color_mode: Literal["rgb", "grayscale"]
    preprocessing: Literal["resize", "resize_center_crop"] = "resize"
    normalization: Literal["0-1", "-1-1", "imagenet", "none"] = "0-1"
    confidence_threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    max_upload_mb: int = Field(default=10, ge=1, le=50)


class ModelLabels(BaseModel):
    model_config = ConfigDict(extra="ignore")

    labels: list[str] = Field(min_length=2)


class ClassConfig(BaseModel):
    """model/class_config.json, as exported by the training pipeline.

    Example (the real deployment model):
        {"model": "ResNet50V2", "image_size": [224, 224],
         "classes": [...6 names...], "pixel_range": [0, 255],
         "preprocessing": "Built into the model"}
    """

    model_config = ConfigDict(protected_namespaces=(), extra="ignore")

    model: str = Field(min_length=1)
    image_size: list[int] = Field(min_length=2, max_length=2)
    classes: list[str] = Field(min_length=2)
    pixel_range: list[float] = Field(min_length=2, max_length=2)
    preprocessing: str = ""

    @field_validator("image_size")
    @classmethod
    def _sane_image_size(cls, value: list[int]) -> list[int]:
        if any(dim < 16 or dim > 2048 for dim in value):
            raise ValueError("image_size values must be between 16 and 2048")
        return value

    @field_validator("classes")
    @classmethod
    def _unique_classes(cls, value: list[str]) -> list[str]:
        if len(set(value)) != len(value):
            raise ValueError("classes must be unique")
        if any(not name.strip() for name in value):
            raise ValueError("class names must not be empty")
        return value

    @property
    def normalization(self) -> Literal["0-1", "-1-1", "none"]:
        """Derive the preprocessing the *service* must apply from the pixel
        range the *model* expects.

        The real model carries a Rescaling(1/127.5, offset=-1) layer inside
        it, so it wants raw 0-255 pixels and does its own scaling — hence
        "none". A 0-1 or -1-1 range would mean the model expects the service
        to scale instead. Anything else is rejected rather than guessed at.
        """
        low, high = self.pixel_range
        if (low, high) == (0.0, 255.0):
            return "none"
        if (low, high) == (0.0, 1.0):
            return "0-1"
        if (low, high) == (-1.0, 1.0):
            return "-1-1"
        raise ValueError(
            f"Unsupported pixel_range {self.pixel_range}; expected [0,255], [0,1], or [-1,1]."
        )

    def to_metadata(
        self,
        *,
        model_path: str,
        model_version: str,
        max_upload_mb: int,
        framework: Literal["tensorflow", "mock"] = "tensorflow",
    ) -> ModelMetadata:
        width, height = self.image_size[0], self.image_size[1]
        return ModelMetadata(
            model_name=self.model,
            model_version=model_version,
            framework=framework,
            model_path=model_path,
            input_width=width,
            input_height=height,
            channels=3,
            color_mode="rgb",
            preprocessing="resize",
            normalization=self.normalization,
            max_upload_mb=max_upload_mb,
        )


# Development-only fallback. Deliberately NON-medical placeholder names:
# real disease classes come exclusively from model/labels.json.
MOCK_LABELS = ["Mock Class A", "Mock Class B", "Mock Class C", "Mock Class D"]


def build_mock_metadata(max_upload_mb: int) -> ModelMetadata:
    return ModelMetadata(
        model_name="mock-development-model",
        model_version="0.0.0-mock",
        framework="mock",
        model_path="",
        input_width=224,
        input_height=224,
        channels=3,
        color_mode="rgb",
        preprocessing="resize",
        normalization="0-1",
        confidence_threshold=0.5,
        max_upload_mb=max_upload_mb,
    )
