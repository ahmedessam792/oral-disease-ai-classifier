---
title: Deployment
tags:
  - deployment
---

# Deployment

> [!IMPORTANT]
> Nothing is deployed automatically. Files and instructions only — deploying,
> creating accounts, or pushing to GitHub are owner actions.

## Topology

- **Frontend → Vercel** (free Hobby tier). The browser calls the API directly.
- **Backend + model → Hugging Face Spaces** (Docker Space, free tier: 2 vCPU /
  16 GB RAM). The 350 MB ResNet50V2 plus TensorFlow needs real memory — it must
  never live in a Vercel serverless function.

## Backend on Hugging Face Spaces

1. Create a Space → SDK: **Docker**.
2. Copy into the Space repo:
   - `apps/api/` contents (Dockerfile at the Space root, `app/`, requirements),
   - `model/oral_disease_resnet50v2_deployment.keras`,
   - `model/class_config.json`.

   The `.keras` file is 350 MB, so track it with Git LFS **before** committing:
   ```bash
   git lfs install
   git lfs track "*.keras"
   git add .gitattributes
   ```
3. Space settings → Variables:
   - `APP_ENV=production`
   - `MODEL_MODE=real` (fail loudly rather than degrade — recommended in prod)
   - `MODEL_DIR=/app/model`
   - `MODEL_PATH=oral_disease_resnet50v2_deployment.keras`
   - `MODEL_CONFIG_PATH=class_config.json`
   - `MODEL_VERSION=1.0.0`
   - `CORS_ORIGINS=https://<your-app>.vercel.app`
4. The image listens on **7860** (HF requirement) and ships a `/health`
   HEALTHCHECK with a **90 s start period**, because loading ResNet50V2 takes
   ~10–20 s on a cold container.

### Memory and cold starts

| | Observed locally |
|---|---|
| Image size (with `tensorflow-cpu`) | ~2 GB |
| Model load time | ~9 s (local venv), ~10–20 s in-container |
| Container memory, model resident | see the Docker validation notes in the project report |
| Inference | ~0.6–1.1 s per image (CPU) |

Free Spaces sleep after ~48 h idle; the first request after a sleep pays the
full container start **plus** the model load. Budget ~30–60 s for that first
response and keep the UI's timeout (30 s) in mind — a warm Space answers in
about a second.

### Safe failure

If the model or its config is missing, the Space still starts: `/health` reports
`model_load_failed` with a safe `error_code`, and `/predict` returns a typed
`503`. It never falls back to mock predictions in production — `MODEL_MODE=mock`
is refused outright when `APP_ENV=production`.

## Frontend on Vercel

1. Import the repo in Vercel → **Root Directory: `apps/web`**.
2. Environment variable: `NEXT_PUBLIC_API_URL=https://<user>-<space>.hf.space`
   (build-time inlined — redeploy after changing it).
3. After the first deploy, set the Space's `CORS_ORIGINS` to the final Vercel URL.

## Alternative: Render

`apps/api/Dockerfile` works on Render as-is (respect `PORT`). The free tier's
**512 MB RAM cannot hold TensorFlow + a 350 MB model** — a ≥2 GB paid instance is
required, which is why HF Spaces is the primary target.

## Local Docker

```powershell
docker compose up --build
# web http://localhost:3000 · api http://localhost:8000 · docs :8000/docs
```

`docker-compose.yml` mounts `./model` **read-only** into the container, so the
real model is served without ever being baked into an image or committed. Set
`MODEL_MODE=mock` in the compose file for a TF-free development container.

## Deployment checklist

- [ ] `pytest -m real_model` green locally (model loads, samples run)
- [ ] `APP_ENV=production`, `MODEL_MODE=real`, exact `CORS_ORIGINS`, no wildcard
- [ ] `.keras` tracked with Git LFS in the Space repo
- [ ] `/health` → `"mode": "real"`, `"error_code": null`
- [ ] `/api/v1/model/info` → ResNet50V2, 6 classes, `"mock": false`
- [ ] Vercel `NEXT_PUBLIC_API_URL` points at the Space; upload works end to end
- [ ] **No mock banner** anywhere in production
