---
title: API Contract
tags:
  - api
---

# API Contract (v1)

Base URL: configured per environment (`NEXT_PUBLIC_API_URL` on the frontend). Interactive docs at `/docs` (OpenAPI). This contract is frozen; the final model integrates without changing it. Frontend mirror: `apps/web/src/lib/types.ts`.

## GET /health

Always 200 while the process is alive.

```json
{ "status": "ok", "model_loaded": true, "mode": "real", "error_code": null }
```

| `mode` | Meaning |
|---|---|
| `real` | the trained model (ResNet50V2) is loaded and serving |
| `mock` | the development predictor is serving — never in production |
| `unavailable` | no model is configured |
| `model_load_failed` | a real model was expected but could not be loaded |

`error_code` is `null` when serving, otherwise a short, safe reason:
`MODEL_LOAD_FAILED`, `INVALID_MODEL_CONFIG`, `MOCK_FORBIDDEN_IN_PRODUCTION`, or
`MODEL_NOT_CONFIGURED`. It never contains paths, stack traces, or model
internals.

> [!IMPORTANT]
> A real model that fails to load is **reported**, never replaced by mock
> predictions.

## GET /api/v1/model/info

200 when a model (real or dev-mock) is loaded:

```json
{
  "model_name": "…",
  "model_version": "…",
  "framework": "tensorflow",
  "classes": ["…", "…"],
  "input_size": { "width": 224, "height": 224 },
  "confidence_threshold": 0.5,
  "max_upload_mb": 10,
  "mock": false,
  "disclaimer": "Arcus provides an AI classification result and is not a substitute for professional medical advice, diagnosis, or treatment."
}
```

503 `MODEL_NOT_AVAILABLE` when unavailable.

## POST /api/v1/predict

Multipart form, field name `file`. Accepted: `.jpg .jpeg .png .webp .bmp`, MIME `image/jpeg|png|webp|bmp`, ≤ `max_upload_mb`, ≥ 32px per side, ≤ 8000px per side / 50 MP.

200:

```json
{
  "predicted_class": "…",
  "confidence": 0.93,
  "probabilities": { "class_a": 0.93, "class_b": 0.07 },
  "model_name": "…",
  "model_version": "…",
  "mock": false
}
```

`probabilities` has one entry per class from `model/class_config.json` (6 classes
for the current ResNet50V2), summing to ~1. `confidence` equals the maximum
probability. `mock: true` only ever appears in development; UIs must label such
results as not real, and must show no mock banner when `mock: false`.

Typical real-model response times are ~0.6–1.1 s of CPU per image; inference runs
in a threadpool so concurrent requests are not blocked.

## Error envelope

Every non-2xx response:

```json
{ "error": { "code": "…", "message": "safe human-readable message" } }
```

| Status | Code | Trigger |
|---|---|---|
| 400 | `EMPTY_FILE` | zero-byte upload |
| 400 | `INVALID_FILE_TYPE` | extension or MIME not allowed |
| 400 | `INVALID_IMAGE` | undecodable/corrupt, or smaller than 32px |
| 400 | `IMAGE_TOO_LARGE_DIMENSIONS` | > 8000px per side or > 50 MP |
| 400 | `VALIDATION_ERROR` | missing/invalid `file` field |
| 413 | `FILE_TOO_LARGE` | over the size limit |
| 503 | `MODEL_NOT_AVAILABLE` | no model loaded (or load failed) |
| 500 | `INTERNAL_ERROR` | unexpected error (details only in server logs) |
