---
title: "ADR 002: CSS motion instead of Framer Motion"
status: accepted
date: 2026-07-13
tags:
  - adr
---

# ADR 002: CSS motion instead of Framer Motion

**Decision** — All three designed motion moments (lightbox power-on, analysis sweep, probability-bar growth) are plain CSS transitions/keyframes; the `motion` package was installed during scaffolding and then removed.

**Rationale** — The brief said "Framer Motion only when useful." Each moment is a simple property transition with no orchestration, gestures, or layout animation — exactly what CSS does natively. CSS `@media (prefers-reduced-motion)` gives free, robust reduced-motion handling, and the client bundle stays ~40 KB smaller.

**Consequences** — If future work needs orchestrated sequences (staggered page-load choreography, shared-layout transitions), reintroduce `motion` for those cases only.
