"""Development-only mock predictor.

Exists solely so the frontend, tests, and demos can exercise the full
upload -> predict -> result flow before the real model is trained. It is
deterministic per image, clearly labeled (model_name "mock-development-model",
mock=true in responses), and the registry refuses to create it when
APP_ENV=production.
"""

import hashlib

import numpy as np

from app.adapters.base import ModelAdapter


class MockAdapter(ModelAdapter):
    def load(self) -> None:
        self._loaded = True

    def predict(self, batch: np.ndarray) -> list[float]:
        # Deterministic: the same image always yields the same distribution.
        digest = hashlib.sha256(np.ascontiguousarray(batch).tobytes()).digest()
        seed = int.from_bytes(digest[:8], "big")
        rng = np.random.default_rng(seed)
        weights = rng.dirichlet(np.full(len(self.labels), 1.5))
        return [float(w) for w in weights]
