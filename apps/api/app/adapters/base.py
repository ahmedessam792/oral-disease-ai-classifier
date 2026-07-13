"""Framework-agnostic model adapter contract.

Routes and services never import an ML framework; they talk to this
interface only. Concrete adapters (mock, tensorflow, and future
pytorch/onnx) live in this package and are selected by registry.py from
model/metadata.json.
"""

from abc import ABC, abstractmethod
from pathlib import Path

import numpy as np

from app.schemas.metadata import ModelMetadata


class ModelLoadError(Exception):
    """Raised when a model cannot be loaded; the app degrades safely."""


class ModelOutputError(Exception):
    """The model produced an output the service refuses to serve: wrong length,
    NaN/inf, or not a probability distribution. Never silently corrected."""


class ModelAdapter(ABC):
    def __init__(self, metadata: ModelMetadata, labels: list[str], model_dir: Path) -> None:
        self.metadata = metadata
        self.labels = labels
        self.model_dir = model_dir
        self._loaded = False

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @abstractmethod
    def load(self) -> None:
        """Load model weights into memory. Must set self._loaded on success."""

    @abstractmethod
    def predict(self, batch: np.ndarray) -> list[float]:
        """Return a probability per label (same order as self.labels, sums to ~1)
        for a preprocessed batch of shape (1, H, W, C)."""
