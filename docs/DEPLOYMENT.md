---
title: Deployment
tags:
  - deployment
---

# Deployment

## Production

| Layer | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://oral-disease-ai-classifier.vercel.app |
| Backend | Google Cloud Run (Docker, `europe-west1`) | https://arcus-api-210946280781.europe-west1.run.app |
| API docs | — | https://arcus-api-210946280781.europe-west1.run.app/docs |
| Container registry | Google Artifact Registry (`europe-west1`) | — |

## Topology

- **Frontend → Vercel.** The browser calls the API directly; `NEXT_PUBLIC_API_URL` is inlined at build time.
- **Backend + model → Google Cloud Run.** The 350 MB ResNet50V2 plus TensorFlow needs real memory — it must never live in a Vercel serverless function. The model is baked into the container image at build time (not downloaded at startup, not stored in this GitHub repository).

## Backend on Cloud Run

Service settings:

| Setting | Value |
|---|---|
| Service name | `arcus-api` |
| Region | `europe-west1` |
| Platform | managed |
| Port | `7860` |
| Memory | `1Gi` |
| CPU | `1` |
| Min instances | `0` — true scale-to-zero, no idle cost |
| Max instances | `1` |
| Concurrency | `1` |
| Request timeout | `300s` — covers a cold start (image pull + TensorFlow import + model load) plus one inference |
| Execution environment | `gen2` |
| Access | unauthenticated (public HTTPS) |

Environment variables:

- `APP_ENV=production`
- `MODEL_MODE=real` — fail loudly rather than degrade
- `MODEL_VERSION=1.0.0`
- `CORS_ORIGINS=https://oral-disease-ai-classifier.vercel.app` — the production Vercel origin only. No wildcard, and no preview-deployment origins: Vercel preview URLs change per deploy, the backend's CORS check is a plain allowlist (no pattern matching), and this is a single-environment portfolio deployment — extending CORS to previews was evaluated and deliberately not adopted.

`MODEL_DIR`, `MODEL_PATH`, and `MODEL_CONFIG_PATH` already default correctly for the image and do not need to be set explicitly.

Deploying (image already built and pushed to Artifact Registry):

```bash
gcloud run deploy arcus-api \
  --image=<ARTIFACT_REGISTRY_IMAGE>:1.0.0 \
  --region=europe-west1 \
  --platform=managed \
  --port=7860 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=1 \
  --concurrency=1 \
  --timeout=300 \
  --execution-environment=gen2 \
  --allow-unauthenticated \
  --set-env-vars=APP_ENV=production,MODEL_MODE=real,MODEL_VERSION=1.0.0,CORS_ORIGINS=https://oral-disease-ai-classifier.vercel.app
```

Updating CORS (or any other env var) without rebuilding the image:

```bash
gcloud run services update arcus-api \
  --region=europe-west1 \
  --update-env-vars=CORS_ORIGINS=https://oral-disease-ai-classifier.vercel.app
```

### Memory and cold starts

| | Observed locally, real model |
|---|---|
| Image size | ~2.1 GB |
| Peak RAM during model load | ~700 MiB |
| Steady-state RAM | ~450–470 MiB |
| Inference | well under 1s per image (CPU) |

512 MiB was tested and **fails** — the model load spike alone exceeds it. 1 GiB was chosen because it comfortably covers the measured peak with headroom.

Cloud Run scales to zero when idle. The **first request after a period of inactivity pays a cold start**: pulling the image (if not cached), importing TensorFlow, and loading the model, before it can answer. A warm instance responds in under a second.

### Safe failure

If the model or its config is missing, the service still starts: `/health` reports `model_load_failed` with a safe `error_code`, and `/predict` returns a typed `503`. It never falls back to mock predictions in production — `MODEL_MODE=mock` is refused outright when `APP_ENV=production`.

## Frontend on Vercel

Project settings:

| Setting | Value |
|---|---|
| Root Directory | `apps/web` |
| Framework Preset | Next.js (auto-detected) |
| Build / Install / Output | defaults — no overrides needed |
| Environment variable (Production) | `NEXT_PUBLIC_API_URL=https://arcus-api-210946280781.europe-west1.run.app` |

`NEXT_PUBLIC_API_URL` is inlined into the client bundle at build time — changing it requires a redeploy.

## Alternative: Hugging Face Spaces

`deploy/huggingface/` in this repository is a fully prepared, working Docker Space build (verified end to end with the real model) that was evaluated alongside Cloud Run. It is not the platform currently serving production traffic, but remains a valid fallback: `scripts/sync-huggingface-space.sh` / `.ps1` assemble its build context the same way `scripts/sync-cloud-run.sh` / `.ps1` do for Cloud Run.

## Alternative: Render

`apps/api/Dockerfile` works on Render as-is (respects `PORT`). The free tier's **512 MB RAM cannot hold TensorFlow + a 350 MB model** — a ≥2 GB paid instance is required.

## Local Docker

```powershell
docker compose up --build
# web http://localhost:3000 · api http://localhost:8000 · docs :8000/docs
```

`docker-compose.yml` mounts `./model` **read-only** into the container, so the real model is served without ever being baked into an image or committed. Set `MODEL_MODE=mock` in the compose file for a TF-free development container.

## Deployment checklist

- [x] `pytest -m real_model` green locally (model loads, samples run)
- [x] `APP_ENV=production`, `MODEL_MODE=real`, exact `CORS_ORIGINS`, no wildcard
- [x] Model baked into the Cloud Run image at build time (not committed to GitHub)
- [x] `/health` → `"mode": "real"`, `"error_code": null`
- [x] `/api/v1/model/info` → ResNet50V2, 6 classes, `"mock": false`
- [x] Vercel `NEXT_PUBLIC_API_URL` points at the Cloud Run service; upload works end to end
- [x] **No mock banner** anywhere in production
