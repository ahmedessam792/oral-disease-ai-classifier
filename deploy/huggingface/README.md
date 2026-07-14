---
title: Arcus API
emoji: 🦷
colorFrom: teal
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# Arcus — oral disease classification API

FastAPI backend serving a trained ResNet50V2 that classifies photographs of
teeth, gums, and oral tissue into six conditions. Not a medical device: the
result is an AI classification, never a diagnosis, and is not a substitute
for professional medical advice.

- `GET /health` — liveness and model status
- `GET /api/v1/model/info` — model name, version, classes, input size
- `POST /api/v1/predict` — multipart image upload → prediction
- `GET /docs` — interactive OpenAPI docs

Source, tests, and documentation: see the project's GitHub repository. This
Space's Dockerfile and application code are synced from there with
`scripts/sync-huggingface-space.sh` (or `.ps1`); the trained model weight is
added directly to this Space and is never part of the GitHub repository.

## Required Space variables

| Variable | Example | Notes |
|---|---|---|
| `APP_ENV` | `production` | |
| `MODEL_MODE` | `real` | Fail loudly rather than silently degrade |
| `CORS_ORIGINS` | `https://<your-app>.vercel.app` | Comma-separated; no wildcard |
| `MODEL_VERSION` | `1.0.0` | |

`MODEL_DIR`, `MODEL_PATH`, and `MODEL_CONFIG_PATH` already default correctly
for this image (`/app/model`, `oral_disease_resnet50v2_deployment.keras`,
`class_config.json`) and do not need to be set unless the filename changes.

## Adding the model to this Space

The `.keras` weight (~350 MB) is tracked with Git LFS directly in this
Space's own repository — not in GitHub:

```bash
git lfs install
git lfs track "*.keras"
git add .gitattributes model/oral_disease_resnet50v2_deployment.keras
git commit -m "Add trained model weights"
```
