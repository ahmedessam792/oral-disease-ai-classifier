---
name: api-contract-review
description: Verify the frontend types, backend schemas, and docs stay in sync whenever the API surface is touched. Use after editing apps/api/app/schemas, apps/api routes, apps/web/src/lib/types.ts, or docs/API_CONTRACT.md.
---

# API Contract Review

The public contract is frozen (docs/API_CONTRACT.md). The final trained model must integrate with zero frontend/API changes, so contract drift is the project's most expensive bug.

## The three mirrors

Any change must land in all three, or in none:

1. **Backend**: `apps/api/app/schemas/prediction.py` (+ error codes in `apps/api/app/core/errors.py`)
2. **Frontend**: `apps/web/src/lib/types.ts` (+ error-kind mapping in `api-client.ts`)
3. **Docs**: `docs/API_CONTRACT.md`

## Review steps

1. Diff the three files above; confirm field names, optionality, and types agree exactly (snake_case on the wire).
2. Response invariants: `probabilities` keys = labels list; values sum ≈ 1; `confidence` = max probability; `mock` is always present and boolean.
3. Error invariants: every non-2xx body is `{"error": {"code", "message"}}`; new codes get a row in the docs table and a frontend `kind` mapping (400/413 → invalid_file, 503 → model_unavailable, else server).
4. Run the contract's guardians:
   - `cd apps/api && pytest tests/test_predict_mock.py tests/test_model_info.py`
   - `cd apps/web && npm test -- api-client`
5. Breaking changes (renaming/removing a field) are forbidden without versioning a new route under `/api/v2`.
