---
title: Testing
tags:
  - testing
---

# Testing

Three layers, all runnable locally and in CI. Every claim of "passing" in this repo's history was produced by actually running these commands.

## Backend — pytest (`apps/api`)

```powershell
cd apps/api
.venv\Scripts\activate
pytest            # 36 tests
ruff check .
```

Covers: health in every mode; model info (mock + unavailable); prediction contract (keys, probability sum, confidence=max, determinism); the full validation ladder (missing field, empty, bad extension, bad MIME, oversize 413, corrupt, oversized dimensions, undersized image); production safety (mock rejected in prod, TF metadata without runtime degrades to 503, invalid metadata/labels degrade safely, wildcard-CORS refusal); preprocessing (shapes, all four normalizations, center crop, non-square targets); adapters (mock determinism/sensitivity, registry selection, TF load failure).

Test images are generated in-memory with Pillow — no binary fixtures.

## Frontend — Vitest + Testing Library (`apps/web`)

```powershell
cd apps/web
npm test          # 25 tests
npm run lint
npm run typecheck
```

Covers: client validation rules; API client mapping (success, 503→model_unavailable, 400/413→invalid_file, network throw, non-JSON 500); the classifier state machine (empty, preview with remove/replace, invalid file alert, success render incl. mock banner, duplicate-submit blocking, missing-model retry path, backend-down state, backend image rejection, analyze-another reset); probability list ordering.

## End-to-end — Playwright (`e2e`)

```powershell
cd e2e
npx playwright test   # 27 tests = 9 scenarios × 3 viewports
```

Servers start automatically (uvicorn :8000 mock mode + `next dev` :3000; running instances are reused). Scenarios: full happy path with mock banner assertion; remove/replace; invalid upload; backend down (route abort); missing model (mocked 503); keyboard-only flow; landmark/heading structure; axe scans on empty and result states (zero serious/critical). Projects: desktop 1280px, tablet 820px, mobile 375px. Upload fixtures are BMPs generated in memory.

## CI

`.github/workflows/ci.yml` runs backend (ruff + pytest), frontend (eslint + tsc + vitest + build), and the Playwright suite on Ubuntu. It triggers on push/PR — relevant once the repo is pushed to GitHub (which requires the owner's explicit action).

## When the real model lands

Re-run everything above, plus `pytest tests/adapters -v` after installing `requirements-tf.txt` — see [MODEL_INTEGRATION.md](MODEL_INTEGRATION.md).
