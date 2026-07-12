---
title: Model Integration Guide
tags:
  - model-integration
---

# Model Integration Guide

This folder is the **drop-in location for the final trained model**. It is gitignored (except this README, the `.example.json` files, and `.gitkeep`) — model artifacts are never committed.

> [!IMPORTANT]
> Until a real model is placed here, the API can only run in **mock mode** (`APP_ENV=development`). Mock mode is development-only, clearly labeled in the UI and API responses, and refuses to start in production.

## 1. What to place here

After completing training, evaluation, and model selection, copy the final exported model plus two config files:

```text
model/
├── oral_disease_model.keras     # your final model (any filename)
├── metadata.json                # copied from metadata.example.json, then edited
└── labels.json                  # copied from labels.example.json, then edited
```

Supported today: **TensorFlow/Keras** (`.keras`, `.h5`, or SavedModel directory). The adapter layer (`apps/api/app/adapters/`) is framework-agnostic — PyTorch/ONNX adapters can be added later without touching the API or frontend.

## 2. Configure `metadata.json`

Copy the example and edit every field to match your final model:

```powershell
Copy-Item model/metadata.example.json model/metadata.json
Copy-Item model/labels.example.json model/labels.json
```

| Field | Meaning |
|---|---|
| `model_name` | Display name shown in the UI (e.g. `"OralNet-EfficientNetB0"`) |
| `model_version` | Your version string (e.g. `"1.0.0"`) |
| `framework` | `"tensorflow"` (or `"mock"` for dev) |
| `model_path` | Filename inside this folder, e.g. `"oral_disease_model.keras"` |
| `input_width` / `input_height` | Input size your model expects (e.g. 224 × 224) |
| `channels` | 3 for RGB, 1 for grayscale |
| `color_mode` | `"rgb"` or `"grayscale"` |
| `preprocessing` | `"resize"` (plain resize) or `"resize_center_crop"` |
| `normalization` | `"0-1"`, `"-1-1"`, `"imagenet"`, or `"none"` — must match training |
| `confidence_threshold` | Below this, the UI flags the result as low-confidence (e.g. `0.5`) |
| `max_upload_mb` | Upload size limit exposed to clients |

> [!WARNING]
> `normalization` and input size **must match exactly what you used in training**, or predictions will be silently wrong.

## 3. Configure `labels.json`

An **ordered array** of class names whose order matches your model's output layer indices (the order of `class_indices` from your training generator):

```json
{ "labels": ["class_at_index_0", "class_at_index_1", "..."] }
```

Do not guess — export the exact order from your training notebook, e.g. `list(train_generator.class_indices.keys())` for Keras.

## 4. Install the TensorFlow dependency

ML frameworks are intentionally not in the core requirements. Activate them only now:

```powershell
cd apps/api
.venv\Scripts\activate
pip install -r requirements-tf.txt
```

## 5. Switch off mock mode and test

```powershell
# apps/api/.env
APP_ENV=production        # or keep development; a real model always wins over mock
```

Then verify:

```powershell
cd apps/api
pytest tests/adapters -v                 # adapter unit tests against your metadata
uvicorn app.main:app --port 8000         # start the API
# GET http://localhost:8000/health        -> "model_loaded": true, "mode": "real"
# GET http://localhost:8000/api/v1/model/info  -> your name/version/classes
# POST an image to /api/v1/predict        -> real prediction
```

The frontend needs **zero changes** — it renders whatever classes and metadata the API reports.

## 6. Troubleshooting

- `/health` shows `model_loaded: false` → check `model_path` in `metadata.json` and that the file exists here.
- Startup error about TensorFlow → `requirements-tf.txt` not installed in the active venv.
- Predictions look wrong → re-check `normalization`, input size, and label order (steps 2–3).
- Production + no model → the API starts, `/predict` returns a typed `503 MODEL_NOT_AVAILABLE`; this is intended safe behavior.
