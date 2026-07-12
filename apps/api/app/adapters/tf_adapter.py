"""TensorFlow/Keras adapter.

TensorFlow is imported lazily inside load() so the core app, mock mode,
and CI never need it installed. Activate with:
    pip install -r requirements-tf.txt
after placing the trained model in model/ (see model/README.md).
"""

import numpy as np

from app.adapters.base import ModelAdapter, ModelLoadError


class TensorFlowAdapter(ModelAdapter):
    _model = None

    def load(self) -> None:
        try:
            from tensorflow import keras  # noqa: PLC0415 — intentional lazy import
        except ImportError as exc:
            raise ModelLoadError(
                "TensorFlow is not installed. Run: pip install -r requirements-tf.txt"
            ) from exc

        if not self.metadata.model_path:
            raise ModelLoadError("metadata.json has an empty model_path.")
        model_path = self.model_dir / self.metadata.model_path
        if not model_path.exists():
            raise ModelLoadError(
                f"Model file '{self.metadata.model_path}' not found in the model directory."
            )
        self._model = keras.models.load_model(model_path)
        self._loaded = True

    def predict(self, batch: np.ndarray) -> list[float]:
        if self._model is None:
            raise ModelLoadError("Model is not loaded.")
        raw = self._model.predict(batch, verbose=0)
        row = np.asarray(raw, dtype=np.float64).reshape(-1)

        # Binary models with a single sigmoid unit -> expand to two classes.
        if row.size == 1:
            p = float(np.clip(row[0], 0.0, 1.0))
            row = np.array([1.0 - p, p])

        # Softmax if the output looks like logits, otherwise renormalize.
        if np.any(row < 0.0) or not np.isclose(row.sum(), 1.0, atol=1e-3):
            if np.any(row < 0.0) or np.any(row > 1.0):
                shifted = np.exp(row - row.max())
                row = shifted / shifted.sum()
            else:
                row = row / row.sum()

        return [float(p) for p in row]
