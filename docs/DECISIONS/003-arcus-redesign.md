---
title: "ADR 003: Arcus redesign — the analyzer is the product"
status: accepted
date: 2026-07-13
tags:
  - adr
  - design
---

# ADR 003: Arcus redesign — the analyzer is the product

**Decision** — Replace the v1 "clinical lightbox" editorial direction with **Arcus**: a product identity built around the analyzer as the hero. Frontend only; no backend, API, adapter, Docker, or security changes.

**Context** — v1 was clean, accessible, and fully tested, but read as a well-written document rather than an AI product: a serif headline over prose columns, four near-identical text sections, and the upload control roughly 700px below the fold on a laptop. The core action was invisible on arrival.

**Rationale**

- **Serif → Instrument Sans.** The Newsreader display face was the single biggest driver of the "blog" feel. Mono (Spline Sans Mono) is retained for data, which is what makes the type feel deliberate rather than decorative.
- **Analyzer above the fold.** The page now opens on a two-column split: a short message + trust chips on the left, the instrument on the right. Below 1280px the instrument spans full width directly under a compact message.
- **A signature, not decoration.** The *Scan Arc* — a dental arch abstracted into a point cloud with a traversing scan line — is the one bold element, and it lives inside the instrument's empty state where it does work (it *is* the dropzone's face). No medical imagery.
- **Progressive disclosure.** Limitations and Privacy became native `<details>` accordions. Every word is preserved; the page just stopped shouting documentation at people who haven't uploaded anything yet. The footer disclaimer remains permanently visible.
- **Report, not bars.** The result is now a confidence ring + ranked probabilities + an explicit "confidence is not certainty" note, which is both more premium and more honest.

**Alternatives rejected** — The `ui-ux-pro-max` skill's stock healthcare system (cyan `#0891B2`, Figtree/Noto Sans, "Medical Clinic" palette) was rejected: it is precisely the generic medical template the brief forbids. Its *rules* (AA contrast, 44px targets, 150–300ms transitions, no neon, no AI purple/pink gradients) were adopted.

**Consequences** — `Limitations.tsx` and `PrivacyNotice.tsx` are replaced by `Disclosures.tsx`. The palette gains `scan`, `ink-faint`, and `warn-ink` tokens. All 25 Vitest and 27 Playwright tests still pass unchanged in intent; two contrast defects introduced during the redesign were caught by the axe scans and fixed (`ink-faint`, `warn-ink`). ADR 002 (CSS motion over Framer Motion) still holds.
