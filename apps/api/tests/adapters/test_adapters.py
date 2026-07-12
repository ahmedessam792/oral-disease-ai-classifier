import math
from pathlib import Path

import numpy as np
import pytest

from app.adapters.base import ModelLoadError
from app.adapters.mock_adapter import MockAdapter
from app.adapters.registry import MockInProductionError, create_adapter
from app.adapters.tf_adapter import TensorFlowAdapter
from app.schemas.metadata import MOCK_LABELS, build_mock_metadata


@pytest.fixture
def mock_adapter() -> MockAdapter:
    adapter = MockAdapter(build_mock_metadata(10), list(MOCK_LABELS), Path("."))
    adapter.load()
    return adapter


def test_mock_adapter_distribution(mock_adapter):
    batch = np.zeros((1, 224, 224, 3), dtype=np.float32)
    probs = mock_adapter.predict(batch)
    assert len(probs) == len(MOCK_LABELS)
    assert math.isclose(sum(probs), 1.0, abs_tol=1e-6)
    assert all(0.0 <= p <= 1.0 for p in probs)


def test_mock_adapter_deterministic_and_input_sensitive(mock_adapter):
    a = np.zeros((1, 224, 224, 3), dtype=np.float32)
    b = np.ones((1, 224, 224, 3), dtype=np.float32)
    assert mock_adapter.predict(a) == mock_adapter.predict(a)
    assert mock_adapter.predict(a) != mock_adapter.predict(b)


def test_registry_selects_mock_outside_production():
    metadata = build_mock_metadata(10)
    adapter = create_adapter(metadata, list(MOCK_LABELS), Path("."), "development")
    assert isinstance(adapter, MockAdapter)


def test_registry_rejects_mock_in_production():
    metadata = build_mock_metadata(10)
    with pytest.raises(MockInProductionError):
        create_adapter(metadata, list(MOCK_LABELS), Path("."), "production")


def test_registry_selects_tensorflow_adapter():
    metadata = build_mock_metadata(10).model_copy(
        update={"framework": "tensorflow", "model_path": "model.keras"}
    )
    adapter = create_adapter(metadata, ["A", "B"], Path("."), "production")
    assert isinstance(adapter, TensorFlowAdapter)


def test_tf_adapter_load_fails_cleanly_without_runtime_or_file(tmp_path):
    metadata = build_mock_metadata(10).model_copy(
        update={"framework": "tensorflow", "model_path": "missing.keras"}
    )
    adapter = TensorFlowAdapter(metadata, ["A", "B"], tmp_path)
    with pytest.raises(ModelLoadError):
        adapter.load()
    assert adapter.is_loaded is False
