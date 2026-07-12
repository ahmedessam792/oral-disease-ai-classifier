---
name: upload-prediction-ux
description: Conventions for the classifier's upload/analyze state machine — phases, error routing, object-URL hygiene, and duplicate-submission protection. Use when modifying apps/web/src/components/classifier or adding new interaction states.
---

# Upload & Prediction UX Conventions

The classifier (apps/web/src/components/classifier/Classifier.tsx) is a single state machine. Keep it one.

## Phases

`empty → preview → loading → result | failed`

- **empty**: dropzone visible; result panel shows the quiet explainer.
- **preview**: image lit on the viewing surface; Analyze enabled exactly once.
- **loading**: Analyze disabled, sweep animation runs, `role="status"` announces.
- **result**: ResultPanel replaces StatusPanel inside the `aria-live="polite"` region.
- **failed**: file-level rejection; preview dropped; recovery button shown.

## Error routing (do not change without api-contract-review)

| Error kind | Behavior |
|---|---|
| `invalid_file` (client or 400/413) | drop preview → `failed` + alert |
| `model_unavailable` (503) | keep preview → back to `preview` + alert (retry allowed) |
| `network` | keep preview → back to `preview` + alert |
| `server` | keep preview → back to `preview` + alert |

## Invariants

1. Duplicate submission is impossible: the analyze handler guards on phase AND the button is disabled while loading.
2. Every `URL.createObjectURL` has a matching revoke: on replace, on remove, on backend rejection, and on unmount.
3. Stale async responses are ignored (check phase before applying results).
4. New states need: a design-system entry (docs/DESIGN_SYSTEM.md §9), a Vitest case in tests/classifier.test.tsx, and an e2e case if reachable by a real user.
5. Alerts use `role="alert"` inside `#classifier`; loading uses `role="status"`. The e2e helper `classifierAlert()` depends on this scoping (Next.js has its own route-announcer alert).
