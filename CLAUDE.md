# CLAUDE.md — Oral Disease AI Classifier

Monorepo: Next.js frontend (`apps/web`) + FastAPI backend (`apps/api`) + drop-in model dir (`model/`). Architecture plan: `docs/PROJECT_PLAN.md`.

## Hard rules

- **Never** build, train, tune, evaluate, or compare ML models — the user does all ML work.
- **Never** invent disease classes, accuracy numbers, metrics, or results. All labels come from `model/labels.json`.
- Mock predictions are development/test only: `APP_ENV=production` must reject the mock adapter; the UI must visibly label mock results.
- No database, no auth, no image persistence, no logging of image bytes/EXIF/paths/secrets.
- No wildcard CORS in production; origins come from `CORS_ORIGINS`.
- Never push to GitHub, deploy, or create paid/external resources without explicit user approval.
- Never claim a test/build passed without actually running it.

## Commands

- Backend: `cd apps/api` → `.venv\Scripts\activate` → `pytest` · `ruff check .` · `uvicorn app.main:app --reload --port 8000`
- Frontend: `cd apps/web` → `npm test` · `npm run lint` · `npm run typecheck` · `npm run build` · `npm run dev`
- E2E: `cd e2e` → `npx playwright test`
- Full local stack: `docker compose up --build`

## Conventions

- Next.js 16 has breaking changes vs. older training data — consult the bundled docs in `apps/web/node_modules/next/dist/docs/` before using unfamiliar Next APIs.

- Backend layering: routes → services → adapters. Routes never import TensorFlow; ML frameworks are touched only inside `app/adapters/` behind optional imports.
- The public API contract (`docs/API_CONTRACT.md`) is frozen: `predicted_class`, `confidence`, `probabilities`, `model_name`, `model_version` (+ `mock` flag in mock mode). Frontend types in `apps/web/src/lib/types.ts` must mirror backend schemas.
- Model behavior is config-driven via `model/metadata.json` + `model/labels.json` (examples in `model/*.example.json`).
- TypeScript strict; Python typed with Pydantic v2; conventional commits.
- Medical wording: results are "AI Classification Result", never a diagnosis; keep disclaimers intact.
