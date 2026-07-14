# Arcus backend on Google Cloud Run

Deployment preparation only. Nothing here creates a GCP project, enables
billing, or deploys anything — the commands below are documented examples for
when you choose to deploy manually.

## Required GCP services

- **Cloud Run** — runs the container.
- **Artifact Registry** — stores the built image (Cloud Run pulls from here;
  the older Container Registry is deprecated for new projects).
- **Cloud Build** — only if you build the image on Google's infrastructure
  (`gcloud run deploy --source .`) instead of building locally and pushing
  with `docker push`. Either path works; building locally avoids enabling
  one more API.

## Why 512 MiB must not be used

Measured locally against the real model, not estimated:

| Cap | Result |
|---|---|
| 512 MiB | **OOM-killed during model load** (`OOMKilled: true`, exit 137) |
| 1 GiB | Succeeds — model loads, a real prediction returns 200, steady usage ~450–470 MiB |

Peak RAM during model load reached **~700 MiB** in testing — above 512 MiB
before a single request is even served. 1 GiB is the minimum viable setting;
it is also Cloud Run's own default allocation, so no override is needed
beyond confirming it explicitly.

## Recommended initial settings

| Setting | Value | Why |
|---|---|---|
| Memory | **1 GiB** | Matches the measured requirement with real headroom (see above) |
| CPU | **1** | Sufficient for single-request CPU inference (~0.6–1.1 s/image observed) |
| Min instances | **0** | True scale-to-zero — no idle cost |
| Max instances | **1** | Bounds worst-case cost while validating; raise once traffic patterns are known |
| Concurrency | **1** | One request in flight at a time initially — CPU-bound inference does not benefit from concurrent requests on a single vCPU, and this keeps memory behavior predictable |
| Request timeout | **300s** (5 min) | Comfortably covers a cold start (image pull + TensorFlow import + model load) *plus* one inference; Cloud Run's own maximum is 60 minutes if this ever needs raising |

Cold start budget: image pull + TensorFlow/Keras import + model load. Expect
this to land somewhere in the range already documented for this project's
Hugging Face Space (tens of seconds, not instant) — a cold Cloud Run instance
is doing the same work.

## Required environment variables

| Variable | Value | Notes |
|---|---|---|
| `APP_ENV` | `production` | |
| `MODEL_MODE` | `real` | Fail loudly rather than silently degrade |
| `MODEL_VERSION` | `1.0.0` | |
| `CORS_ORIGINS` | *(set after the frontend is deployed)* | Comma-separated; no wildcard in production. **Do not hard-code a Vercel URL here or anywhere else until it exists.** |
| `PORT` | *(injected by Cloud Run)* | Do not set manually; the container already reads it with a safe local fallback (`7860`) |

`MODEL_DIR`, `MODEL_PATH`, and `MODEL_CONFIG_PATH` already default correctly
for this image (`/app/model`, `oral_disease_resnet50v2_deployment.keras`,
`class_config.json`) and do not need to be set unless the filename changes.

## Model privacy rules

- The `.keras` weight is never committed to GitHub — `deploy/cloud-run/model/`
  is gitignored, same as `deploy/huggingface/model/`.
- It reaches the built image only through a local build step (this
  directory, populated with `scripts/sync-cloud-run.sh --with-model`) or by
  being staged directly wherever the image is actually built. It is not
  fetched from any network location at container startup.
- `model/samples/` (the held-out clinical images) is never touched by the
  sync scripts and is never part of any built image.

## Manual authentication and deployment — examples only

Nothing below has been run. Replace every placeholder before use; none of
these are real values.

```bash
# One-time setup
gcloud auth login
gcloud config set project <PROJECT_ID>
gcloud services enable run.googleapis.com artifactregistry.googleapis.com

# Build context (from the repo root)
scripts/sync-cloud-run.sh --with-model

# Build and push (from this directory)
gcloud builds submit --tag <REGION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY>/arcus-api:latest

# Deploy
gcloud run deploy <SERVICE_NAME> \
  --image <REGION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY>/arcus-api:latest \
  --region <REGION> \
  --port 7860 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 1 \
  --concurrency 1 \
  --timeout 300 \
  --allow-unauthenticated \
  --set-env-vars APP_ENV=production,MODEL_MODE=real,MODEL_VERSION=1.0.0

# After the frontend is deployed, point CORS at its real URL
gcloud run services update <SERVICE_NAME> \
  --region <REGION> \
  --set-env-vars CORS_ORIGINS=<VERCEL_URL>
```

## Budget alert (recommended before any real deployment)

Cloud Run's always-free tier is genuinely free, but the project still
requires a billing account with a payment method attached. Set a budget
alert before deploying anything for real:

```bash
gcloud billing budgets create \
  --billing-account=<BILLING_ACCOUNT_ID> \
  --display-name="Arcus budget alert" \
  --budget-amount=1USD \
  --threshold-rule=percent=100
```

A `--max-instances 1` cap plus a low-dollar alert bounds the worst case to
"a notification," not a surprise bill.
