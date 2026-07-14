"""Public API response schemas. This is the frozen contract mirrored by
apps/web/src/lib/types.ts and documented in docs/API_CONTRACT.md."""

from pydantic import BaseModel, ConfigDict


class PredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    predicted_class: str
    confidence: float
    probabilities: dict[str, float]
    model_name: str
    model_version: str
    # True only when the development mock produced this result. The frontend
    # must show a prominent "not a real result" banner when set.
    mock: bool


class InputSize(BaseModel):
    width: int
    height: int


class ModelInfoResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    model_name: str
    model_version: str
    framework: str
    classes: list[str]
    input_size: InputSize
    confidence_threshold: float
    max_upload_mb: int
    mock: bool
    disclaimer: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    # "real" | "mock" | "unavailable" | "model_load_failed"
    mode: str
    # Short, safe reason when the model isn't serving (e.g. MODEL_LOAD_FAILED).
    # Never carries paths, stack traces, or model internals.
    error_code: str | None = None

    model_config = ConfigDict(protected_namespaces=())


DISCLAIMER = (
    "Arcus provides an AI classification result and is not a substitute for "
    "professional medical advice, diagnosis, or treatment."
)
