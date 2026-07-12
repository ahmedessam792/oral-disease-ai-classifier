---
title: Deployment
tags:
  - deployment
---

# Deployment

> [!IMPORTANT]
> Nothing is deployed automatically. Files and instructions only — deploying, creating accounts, or pushing to GitHub are owner actions.

## Topology

- **Frontend → Vercel** (free Hobby tier). Static-friendly Next.js; the browser calls the API directly.
- **Backend + model → Hugging Face Spaces** (Docker Space, free tier: 2 vCPU / 16 GB RAM — comfortably fits a TensorFlow CPU model). The deep-learning model must never live in a Vercel serverless function.

## Backend on Hugging Face Spaces

1. Create a Space → SDK: **Docker** → visibility of your choice.
2. Copy into the Space repo: `apps/api/` contents (Dockerfile at Space root, `app/`, requirements files) plus your `model/` files (`model.keras`, `metadata.json`, `labels.json`) into a `model/` folder.
3. In the Dockerfile, uncomment the `tensorflow-cpu` install line (real model) — mock mode needs nothing.
4. Space settings → Variables:
   - `APP_ENV=production`
   - `CORS_ORIGINS=https://<your-app>.vercel.app`
   - `MODEL_DIR=/app/model`
5. The image listens on **7860** (HF requirement) and has a `/health` HEALTHCHECK. First build takes several minutes; free Spaces sleep after ~48h idle and cold-start on the next request (~30–60s with TF).

Safe failure: if the model is missing or fails to load, the Space still starts; `/predict` returns a typed 503 and the UI shows the missing-model state.

Model files >10 MB in a Space repo need `git lfs track "*.keras"` before committing.

## Frontend on Vercel

1. Import the GitHub repo in Vercel → set **Root Directory: `apps/web`** (framework auto-detected).
2. Environment variable: `NEXT_PUBLIC_API_URL=https://<user>-<space>.hf.space` (build-time inlined — redeploy after changing it).
3. After the first deploy, update the Space's `CORS_ORIGINS` with the final Vercel URL.

## Alternative: Render

`apps/api/Dockerfile` works on Render as-is (set `API_PORT=10000` or use Render's `PORT`). The free tier's **512 MB RAM cannot hold TensorFlow + model** — a paid instance (≥2 GB) is required, which is why HF Spaces is the primary target.

## Local Docker

```powershell
docker compose up --build
# web http://localhost:3000 · api http://localhost:8000 (mock mode)
```

The compose file mounts `./model` read-only into the API container, so dropping in real model files upgrades local Docker to real mode too (rebuild with the TF install line uncommented).

## Deployment checklist

- [ ] Real model + metadata + labels in place, adapter tests green
- [ ] `APP_ENV=production`, exact `CORS_ORIGINS`, no wildcard
- [ ] `/health` shows `"mode": "real"` on the Space
- [ ] Vercel `NEXT_PUBLIC_API_URL` points at the Space; end-to-end upload works
- [ ] Mock banner absent in production results
