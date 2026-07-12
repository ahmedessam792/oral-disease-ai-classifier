---
name: pre-release-check
description: Run the complete verification ladder before claiming any milestone complete, committing large changes, or preparing a deployment. Executes backend, frontend, e2e, and Docker checks and requires real output before any success claim.
---

# Pre-Release Check

Never report success without running these. Report actual numbers and any failure verbatim.

## 1. Backend (apps/api)

```powershell
cd apps/api
.venv\Scripts\python.exe -m ruff check .
.venv\Scripts\python.exe -m pytest
```

Expect: ruff "All checks passed!", pytest all green (36 tests at last count).

## 2. Frontend (apps/web)

```powershell
cd apps/web
npm run lint
npm run typecheck
npm test
npm run build
```

Expect: zero eslint/tsc errors, Vitest all green (25 at last count), build completes.

## 3. End-to-end (e2e)

```powershell
cd e2e
npx playwright test
```

Expect: 27/27 across desktop/tablet/mobile, including axe scans at zero serious/critical.

## 4. Docker (requires Docker Desktop running)

```powershell
docker compose build
docker compose up -d
# probe: http://localhost:8000/health then http://localhost:3000
docker compose down
```

If the daemon is off, say so explicitly and mark this step as NOT verified — do not skip silently.

## 5. Guardrails

- No secrets, model binaries, or datasets staged: `git status --short` review.
- Production safety intact: `pytest tests/test_prod_safety.py`.
- Mock banner behavior intact: `npm test -- classifier`.
