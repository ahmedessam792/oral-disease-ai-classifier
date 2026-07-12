"""Pydantic validation for model/metadata.json and model/labels.json.

These files are supplied by the ML owner together with the trained model
(see model/README.md). Everything the inference pipeline does — input size,
color mode, normalization, upload limit — is driven by this config so the
model can be swapped without code changes.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


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
