"""Adapter selection driven by model/metadata.json.

Adding a future framework (pytorch, onnx) means: write an adapter in this
package, add its name to ModelMetadata.framework, and register it here.
Nothing above the adapter layer changes.
"""

from pathlib import Path

from app.adapters.base import ModelAdapter, ModelLoadError
from app.adapters.mock_adapter import MockAdapter
from app.adapters.tf_adapter import TensorFlowAdapter
from app.schemas.metadata import ModelMetadata


class MockInProductionError(Exception):
    """The mock predictor must never serve production traffic."""


def create_adapter(
    metadata: ModelMetadata,
    labels: list[str],
    model_dir: Path,
    app_env: str,
) -> ModelAdapter:
    if metadata.framework == "mock":
        if app_env == "production":
            raise MockInProductionError(
                "framework='mock' is forbidden when APP_ENV=production."
            )
        return MockAdapter(metadata, labels, model_dir)

    if metadata.framework == "tensorflow":
        return TensorFlowAdapter(metadata, labels, model_dir)

    raise ModelLoadError(f"Unsupported framework: {metadata.framework}")
