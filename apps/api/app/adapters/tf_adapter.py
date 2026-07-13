"""TensorFlow/Keras adapter for the real deployment model.

Keras is imported lazily inside load() so the core app, mock mode, and the
fast test suite never need TensorFlow installed. Activate with:
    pip install -r requirements-tf.txt

Model facts this adapter relies on (verified from the .keras archive, and
re-asserted at runtime against model/class_config.json):

* Input  : (None, 224, 224, 3), raw 0-255 float pixels. The model carries its
           own Rescaling(1/127.5, offset=-1) layer, so the service must NOT
           scale the pixels — see services/preprocessing.py, normalization
           "none".
* Head   : Dense(n_classes, activation="softmax") -> the output is ALREADY a
           probability distribution. This adapter therefore never applies a
           softmax; it validates the distribution instead.
* Augment: the model embeds RandomFlip/Rotation/Zoom/Contrast layers, which
           Keras applies only in training mode. Calling the model with
           training=False guarantees they are inactive.
"""

import threading

import numpy as np

from app.adapters.base import ModelAdapter, ModelLoadError, ModelOutputError

# Probabilities must sum to 1 within this tolerance (float32 softmax noise).
_SUM_TOLERANCE = 1e-3


class TensorFlowAdapter(ModelAdapter):
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._model = None
        # Keras inference is not guaranteed re-entrant; serialize calls. The
        # route runs this in a threadpool, so the event loop is never blocked.
        self._lock = threading.Lock()

    def load(self) -> None:
        """Load the model once. Raises ModelLoadError with a safe message; the
        caller degrades to a reported failure state, never to the mock."""
        try:
            import keras  # noqa: PLC0415 — intentional lazy import
        except ImportError as exc:
            raise ModelLoadError(
                "TensorFlow/Keras is not installed. Run: pip install -r requirements-tf.txt"
            ) from exc

        if not self.metadata.model_path:
            raise ModelLoadError("Model configuration has an empty model_path.")

        model_file = self.model_dir / self.metadata.model_path
        if not model_file.exists():
            raise ModelLoadError(
                f"Model file '{self.metadata.model_path}' not found in the model directory."
            )

        try:
            # compile=False: inference only — skips the optimizer state and
            # loads faster with a smaller memory footprint.
            self._model = keras.saving.load_model(model_file, compile=False)
        except Exception as exc:  # noqa: BLE001 — surfaced as a safe load error
            raise ModelLoadError(f"Keras could not load the model: {type(exc).__name__}") from exc

        self._assert_signature_matches_config()
        self._loaded = True

    def _assert_signature_matches_config(self) -> None:
        """Fail loudly at startup if the model disagrees with class_config.json,
        rather than serving silently wrong predictions."""
        assert self._model is not None

        output_units = int(self._model.output_shape[-1])
        if output_units != len(self.labels):
            raise ModelLoadError(
                f"Model outputs {output_units} classes but the configuration lists "
                f"{len(self.labels)}."
            )

        expected = (self.metadata.input_height, self.metadata.input_width, self.metadata.channels)
        actual = tuple(self._model.input_shape[1:])
        if actual != expected:
            raise ModelLoadError(
                f"Model expects input {actual} but the configuration says {expected}."
            )

    def predict(self, batch: np.ndarray) -> list[float]:
        if self._model is None:
            raise ModelLoadError("Model is not loaded.")

        expected_shape = (
            1,
            self.metadata.input_height,
            self.metadata.input_width,
            self.metadata.channels,
        )
        if batch.shape != expected_shape:
            raise ModelOutputError(
                f"Preprocessed batch has shape {batch.shape}, expected {expected_shape}."
            )

        with self._lock:
            # training=False keeps the embedded augmentation layers inactive.
            raw = self._model(batch, training=False)

        row = np.asarray(raw, dtype=np.float64).reshape(-1)
        return self._validate_distribution(row)

    def _validate_distribution(self, row: np.ndarray) -> list[float]:
        if row.size != len(self.labels):
            raise ModelOutputError(
                f"Model returned {row.size} values for {len(self.labels)} classes."
            )
        if not np.all(np.isfinite(row)):
            raise ModelOutputError("Model returned NaN or infinite values.")

        total = float(row.sum())
        if abs(total - 1.0) > _SUM_TOLERANCE or np.any(row < 0.0):
            # The configured model has a softmax head, so this means the model
            # and the config have diverged. Refuse rather than quietly applying
            # a softmax and inventing a distribution.
            raise ModelOutputError(
                f"Model output is not a probability distribution (sum={total:.6f}). "
                "Expected a softmax head."
            )

        return [float(value) for value in row]
