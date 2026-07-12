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
{ "status": "ok", "model_loaded": true, "mode": "real" }
```

`mode`: `real` | `mock` | `unavailable`.

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
  "disclaimer": "Educational and research use only. …"
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

`probabilities` has one entry per class from `model/labels.json`, summing to ~1. `confidence` equals the maximum probability. `mock: true` only ever appears in development; UIs must label such results as not real.

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
