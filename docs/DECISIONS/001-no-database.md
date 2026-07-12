---
title: "ADR 001: No database"
status: accepted
date: 2026-07-12
tags:
  - adr
---

# ADR 001: No database

**Decision** — v1 ships with no persistence of any kind.

**Context** — The product flow is stateless: receive image → validate → preprocess in memory → predict → respond → discard. Candidate reasons to persist (prediction history, analytics, admin dashboards) are not requirements, and users upload medical-adjacent images.

**Rationale** — Storing such images creates real privacy liability (retention policy, deletion rights, breach surface) in exchange for zero product value at this stage. Configuration lives in env vars; model config lives in `model/metadata.json` + `labels.json`. A database added "for the ERD" would be résumé-driven design.

**Consequences** — No history feature; each page load is fresh. If persistence is ever genuinely needed, it can be added behind `prediction_service` without touching the public API — accompanied by a retention policy and explicit user consent, and only after owner approval.
