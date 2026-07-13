---
title: Testing
tags:
  - testing
---

# Testing

Four layers, all runnable locally and in CI. Every "passing" claim in this
repo's history was produced by actually running these commands.

## Backend — fast suite (`apps/api`)

```powershell
cd apps/api
.venv\Scripts\activate
pytest            # 52 tests, no TensorFlow needed (~8 s)
ruff check .
```

Covers: health in every mode; model info; the prediction contract; the full
validation ladder (missing field, empty, bad extension, bad MIME, oversize 413,
corrupt, oversized dimensions, undersized image); preprocessing (all
normalizations, center crop, non-square targets); adapters (mock determinism,
registry selection, TF load failure); **`class_config.json`** (parsing, exact
class order, `pixel_range` → normalization mapping, rejection of unsupported
ranges, malformed JSON, duplicate classes); and the **production-safety rules**
below.

Test images are generated in-memory with Pillow — no binary fixtures.

### The safety rules worth knowing

| Test | Guarantees |
|---|---|
| `test_real_mode_never_falls_back_to_mock` | `MODEL_MODE=real` with a broken model serves 503 — it never quietly serves mock predictions |
| `test_explicit_mock_mode_is_rejected_in_production` | `MODEL_MODE=mock` + `APP_ENV=production` refuses to start serving |
| `test_pixels_are_not_divided_by_255` | the real model's 0–255 input rule; a regression here would silently corrupt every prediction |
| `test_health_never_leaks_paths_or_internals` | `/health` exposes no paths, tracebacks, or model internals |

## Backend — real model (`apps/api`)

```powershell
pytest -m real_model      # ~25 s; loads the 350 MB ResNet50V2
```

Skipped automatically when TensorFlow or the `.keras` file is absent, so the
fast suite stays TF-free. It:

- asserts `class_config.json` is the source of truth (name, 224×224, RGB,
  `normalization: "none"`, 6 classes),
- asserts the **model's own signature matches the config** (input `(224,224,3)`,
  6 output units),
- checks the `model/samples/` folder names reconcile with the configured classes,
- runs **every image in `model/samples/`** through the real
  validate → preprocess → predict path, asserting per image: batch shape
  `(1,224,224,3)`, `float32`, pixels still 0–255, output length 6, all values
  finite, sum ≈ 1, predicted class ∈ configured classes, and the full API contract
  with `mock: false`,
- rejects invalid model output (NaN, inf, wrong length, non-distribution).

> [!IMPORTANT]
> This is an **integration check, not an evaluation.** It deliberately does
> **not** assert that a prediction matches its source folder, and it computes no
> accuracy. Sample images are read in place and never modified or committed.

## Frontend — Vitest + Testing Library (`apps/web`)

```powershell
cd apps/web
npm test          # 30 tests
npm run lint
npm run typecheck
```

Covers client validation; API-client error mapping (503 → model_unavailable,
400/413 → invalid_file, network, non-JSON 500); the classifier state machine
(preview, remove/replace, invalid file, success, duplicate-submit blocking,
missing-model retry, backend-down, reset); probability ordering; and
**real-model rendering**: `mock: false` → **no mock banner**, real model name and
version, all six real labels, long labels (`Tooth Discoloration`) titled for
overflow, and the disclaimer present on a real result.

## End-to-end — Playwright (`e2e`)

```powershell
cd e2e
npx playwright test        # 27 mock-mode tests × 3 viewports (~1 min)
```

The API server it starts is pinned to `MODEL_MODE=mock` so this suite stays fast
and TF-free even though a real model now sits in `model/`. Scenarios: happy path
with mock-banner assertion, remove/replace, invalid upload, backend down, missing
model, keyboard-only flow, landmark structure, and axe scans (zero serious or
critical) — at 1280 / 820 / 375 px.

### Real-model end-to-end

```powershell
# with a real-model API on :8000 and the web app on :3000
$env:ARCUS_REAL_MODEL = "1"
npx playwright test tests/real-model.spec.ts    # 2 tests × 3 viewports
```

Skipped by default. Verifies against the **real backend**: `/api/v1/model/info`
reports ResNet50V2 with 6 classes and `mock: false`; the result renders with **no
mock banner**; all six real labels appear; and the page never scrolls
horizontally at any viewport.

## CI

`.github/workflows/ci.yml` runs the backend fast suite (ruff + pytest), the
frontend (eslint + tsc + vitest + build), and the mock-mode Playwright suite. CI
does **not** install TensorFlow or the 350 MB model — the real-model tests are a
local/pre-deploy gate.
