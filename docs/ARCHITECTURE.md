---
title: Architecture
tags:
  - architecture
---

# Architecture

A stateless two-service system: a static-friendly Next.js frontend and a FastAPI inference API with a framework-agnostic model adapter layer. No database — see [DECISIONS/001-no-database.md](DECISIONS/001-no-database.md).

## System overview

```mermaid
flowchart LR
    U[Browser] -->|HTTPS| W[Next.js<br/>Vercel]
    W -->|"POST /api/v1/predict (multipart)"| A[FastAPI<br/>Cloud Run Docker]
    W -->|GET /api/v1/model/info| A
    subgraph A2 [FastAPI container]
        direction TB
        R[api/v1 routes] --> V[image_validation]
        V --> P[preprocessing]
        P --> S[prediction_service]
        S --> AD{ModelAdapter<br/>registry}
        AD -->|framework=tensorflow| TF[TensorFlowAdapter<br/>model/*.keras]
        AD -->|framework=mock, dev only| MK[MockAdapter]
    end
    A --- A2
```

## Backend layering

```text
app/
├── main.py            app factory: CORS, error handlers, lifespan model load
├── core/              config (pydantic-settings), logging, typed errors
├── api/               health (unversioned) + api/v1 routers
├── schemas/           public response models + metadata validation
├── services/          model_state, image_validation, preprocessing, prediction_service
└── adapters/          base ABC, mock, tensorflow, registry
```

Rules:
- Routes never touch ML frameworks; only `adapters/` may import TensorFlow, lazily inside `load()`.
- Everything the pipeline does (input size, color mode, normalization, upload limit) comes from `model/metadata.json`, validated by Pydantic.
- Every error leaving the API is `{"error": {"code", "message"}}` with a safe public message.

## Upload & prediction sequence

```mermaid
sequenceDiagram
    participant B as Browser
    participant W as Next.js UI
    participant A as FastAPI
    participant M as ModelAdapter

    B->>W: drop / choose image
    W->>W: client pre-validation (ext, MIME, size)
    W->>W: object URL preview
    B->>W: click Analyze
    W->>A: POST /api/v1/predict (multipart)
    A->>A: validate (empty, ext, MIME, size, decode, dimensions)
    A->>A: preprocess in memory (EXIF, resize, normalize)
    A->>M: predict(batch)
    M-->>A: probabilities[]
    A-->>W: predicted_class, confidence, probabilities, model_name/version, mock
    W-->>B: result view (bars, disclaimer, mock banner if mock)
    Note over A: image bytes discarded — never stored or logged
```

## Model-loading flow (startup)

```mermaid
flowchart TD
    S[FastAPI lifespan start] --> C{model/metadata.json exists?}
    C -->|yes| VAL[validate metadata + labels]
    VAL -->|ok| REG[registry selects adapter]
    REG --> LOAD[adapter.load]
    LOAD -->|ok| REAL[mode = real or mock per framework]
    LOAD -->|fail| UN[mode = unavailable → /predict 503]
    VAL -->|invalid| UN
    C -->|no| ENV{APP_ENV production?}
    ENV -->|yes| UN
    ENV -->|no| MOCK[built-in mock adapter<br/>mode = mock]
```

Mode is reported by `GET /health` (`real` / `mock` / `unavailable`). The registry raises if `framework=mock` under `APP_ENV=production`.

## Frontend structure

```text
src/
├── app/               layout (fonts, metadata), page, error boundary, globals.css (tokens)
├── components/
│   ├── classifier/    Classifier (state machine), UploadDropzone, ImagePreview,
│   │                  StatusPanel, ResultPanel, ProbabilityList, MockBanner
│   └── sections/      Header, Hero, HowItWorks, ModelInfo, Limitations, PrivacyNotice, Footer
└── lib/               config, types (mirrors API schemas), api-client, validation
```

The classifier is a five-phase state machine: `empty → preview → loading → result | failed`. Service errors keep the preview for retry; file rejections drop it.

## Local development flow

```mermaid
flowchart LR
    D[developer] -->|uvicorn :8000| API[FastAPI, mock mode]
    D -->|npm run dev :3000| WEB[Next.js dev]
    WEB -->|NEXT_PUBLIC_API_URL| API
    D -->|docker compose up| BOTH[api + web containers]
```

## Deployment topology

See [DEPLOYMENT.md](DEPLOYMENT.md).

```mermaid
flowchart LR
    U[Users] --> V[Vercel CDN<br/>Next.js static + SSR]
    V -->|browser calls API directly| CR[Google Cloud Run<br/>Docker, port 7860]
    CR --> MODEL[model/ files<br/>baked into the image]
```
