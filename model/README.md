---
title: Model Integration Guide
tags:
  - model-integration
---

# Model Integration Guide

This folder holds the trained model and its configuration. Everything here is
gitignored except this README and the `.example.json` files — **model weights
and sample images are never committed**.

## What is here now

```text
model/
├── oral_disease_resnet50v2_deployment.keras   # the trained model (350 MB)
├── class_config.json                          # source of truth for labels + preprocessing
└── samples/                                   # held-out images used for integration tests
    ├── Calculus/  Caries/  Gingivitis/
    └── Hypodontia/  Mouth_Ulcer/  Tooth_Discoloration/
```

`class_config.json` drives the entire inference pipeline:

```json
{
  "model": "ResNet50V2",
  "image_size": [224, 224],
  "classes": ["Calculus", "Caries", "Gingivitis", "Hypodontia", "Mouth Ulcer", "Tooth Discoloration"],
  "pixel_range": [0, 255],
  "preprocessing": "Built into the model"
}
```

> [!IMPORTANT]
> **Class names are read from this file, never hardcoded.** They flow
> `class_config.json` → `/api/v1/model/info` → the UI. Retrain with different
> classes and the whole app follows, with no code change.

## How preprocessing works (and the one rule that matters)

The model carries its own `Rescaling(scale=1/127.5, offset=-1)` layer, which is
why the config says `"preprocessing": "Built into the model"` and
`"pixel_range": [0, 255]`.

> [!WARNING]
> **Do not scale the pixels in the service.** The API feeds raw **0–255
> float32 RGB** (`normalization: "none"`). Dividing by 255 here would
> double-normalize the input and silently corrupt every prediction — the model
> would still return confident-looking numbers, they would just be wrong.

The service pipeline is: validate → decode → EXIF orientation → convert to RGB
→ resize to 224×224 → `float32` → add batch dim → `(1, 224, 224, 3)`.

The model's head is `Dense(6, activation="softmax")`, so its output is
**already a probability distribution**. The adapter never applies a softmax; it
validates the output instead (length, finiteness, sums to ~1) and refuses to
serve anything else.

## Running with the real model

Real mode is the **default** — `MODEL_MODE=auto` uses the real model whenever
`class_config.json` and the `.keras` file are both present.

```powershell
cd apps/api
.venv\Scripts\activate
pip install -r requirements-tf.txt     # TensorFlow 2.21 + Keras 3.13.2
uvicorn app.main:app --port 8000
```

Verify:

```powershell
curl http://localhost:8000/health          # -> "mode": "real", "model_loaded": true
curl http://localhost:8000/api/v1/model/info   # -> ResNet50V2, 6 classes, "mock": false
```

With Docker (model mounted read-only, TF baked in):

```powershell
docker compose up --build
```

## Mock mode (development only)

Mock mode must now be asked for **explicitly**:

```powershell
$env:MODEL_MODE = "mock"; uvicorn app.main:app --port 8000
```

It is refused when `APP_ENV=production`, and any mock result is visibly
labeled in the UI. `MODEL_MODE=real` never falls back to it: if the model
fails to load, `/health` reports `model_load_failed` and `/predict` returns a
typed 503.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `MODEL_MODE` | `auto` | `real` \| `mock` \| `auto` |
| `MODEL_DIR` | repo `model/` (`/app/model` in Docker) | where these files live |
| `MODEL_PATH` | `oral_disease_resnet50v2_deployment.keras` | filename inside `MODEL_DIR` |
| `MODEL_CONFIG_PATH` | `class_config.json` | filename inside `MODEL_DIR` |
| `MODEL_VERSION` | `1.0.0` | reported by the API (the config has no version field) |
| `MODEL_FRAMEWORK` | `tensorflow` | adapter selection |

All paths are relative to `MODEL_DIR` — nothing depends on where the repo sits
on disk, so the same settings work locally, in Docker, and on HF Spaces.

## Replacing the model later

1. Drop the new `.keras` and its `class_config.json` in here.
2. Update `MODEL_PATH` if the filename changed; bump `MODEL_VERSION`.
3. `pytest -m real_model` — loads the model, checks the signature against the
   config, and runs every image in `samples/`.

The adapter asserts at startup that the model's input shape and output class
count match `class_config.json`, so a mismatch fails loudly instead of
producing mislabeled predictions.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `/health` → `model_load_failed`, `MODEL_LOAD_FAILED` | `.keras` missing from `MODEL_DIR`, or TensorFlow not installed (`pip install -r requirements-tf.txt`) |
| `/health` → `model_load_failed`, `INVALID_MODEL_CONFIG` | `class_config.json` missing, malformed, or has an unsupported `pixel_range` |
| `/health` → `model_load_failed`, `MOCK_FORBIDDEN_IN_PRODUCTION` | `MODEL_MODE=mock` with `APP_ENV=production` — intended |
| Startup error: "Model outputs N classes but the configuration lists M" | the `.keras` and `class_config.json` disagree — do not paper over it |
| Predictions look uniformly wrong | check nothing re-scaled the pixels; this model needs raw 0–255 |
