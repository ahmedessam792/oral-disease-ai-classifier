---
title: Model Integration
tags:
  - model-integration
---

# Model Integration

The ML work (custom CNN, pretrained models, tuning, evaluation, selection, export) happens outside this repo. This document covers how the finished model plugs in. The step-by-step drop-in guide lives in [model/README.md](../model/README.md).

> [!IMPORTANT]
> Integrating the real model requires **zero changes** to the frontend or the public API. If it doesn't, that's a bug in the adapter layer.

## The adapter contract

`apps/api/app/adapters/base.py`:

```python
class ModelAdapter(ABC):
    def load(self) -> None: ...                       # load weights; set _loaded
    def predict(self, batch: np.ndarray) -> list[float]: ...  # probs per label
    is_loaded: bool
```

- Input: preprocessed float32 batch `(1, H, W, C)` built by `services/preprocessing.py` from `model/metadata.json`.
- Output: one probability per entry of `model/labels.json`, in order, summing to ~1. The TensorFlow adapter also normalizes logits and expands single-sigmoid binary outputs to two classes.

## Selection

`adapters/registry.py` picks the adapter from `metadata.json → framework`:

| framework | Adapter | Notes |
|---|---|---|
| `tensorflow` | `TensorFlowAdapter` | `.keras`, `.h5`, SavedModel. TF imported lazily; install `requirements-tf.txt` |
| `mock` | `MockAdapter` | development/test only — the registry raises in production |
| `pytorch`, `onnx` | not implemented | add an adapter class + a `framework` literal + a registry entry |

## Lifecycle

Loaded once at FastAPI startup (lifespan). Failure never crashes the app: mode becomes `unavailable`, `/health` reports `model_loaded: false`, `/predict` returns typed 503. See the model-loading flowchart in [ARCHITECTURE.md](ARCHITECTURE.md).

## Configuration surface

All of it lives beside the model, not in code:

- `model/metadata.json` — name, version, framework, path, input size/channels/color mode, preprocessing (`resize` | `resize_center_crop`), normalization (`0-1` | `-1-1` | `imagenet` | `none`), confidence threshold, upload limit. Validated by `app/schemas/metadata.py`.
- `model/labels.json` — ordered class names matching the model's output indices.

> [!WARNING]
> Normalization and input size must match training exactly, and label order must match the output layer — mismatches produce silently wrong predictions. Export label order from the training notebook; never retype it from memory.

## Testing an integrated model

```powershell
cd apps/api
.venv\Scripts\activate
pip install -r requirements-tf.txt
pytest                          # full suite still green
pytest tests/adapters -v        # adapter behavior
uvicorn app.main:app --port 8000
# /health → "mode": "real"; POST an image → real prediction
```
