---
title: "ADR 004: Routes, the Title Settle transition, and the report drawer"
status: accepted
date: 2026-07-14
tags:
  - adr
  - design
  - frontend
---

# ADR 004: Routes, the Title Settle transition, and the report drawer

**Decision** — Split the single page into two routes (`/` Analyze, `/about` About Arcus), add a route-level page-intro transition, and give the result a full report in a modal drawer with a client-side PDF download. Palette evolves to "Porcelain & Petrol"; type moves to Sora / Inter / JetBrains Mono. Backend, model, and the API contract are untouched.

## Why

The homepage carried the analyzer *and* four documentation sections, so it scrolled long and read partly as a doc page. A design critique (run as two isolated assessments — a heuristic review and a deterministic anti-pattern scan) scored the interface **28/40** and surfaced concrete defects rather than opinions:

- the confidence ring rendered `99%` while the line beside it rendered `99.9%` — two numbers for one quantity, in the exact moment a reviewer judges the engineering;
- four of six classes rendered a bare `0.0%` with an empty track, so "show the whole distribution" resolved to one bar and four blanks;
- the specimen image floated in ~450px of dead white, because the viewer's height was slaved to the report panel;
- at 1024×768 the primary upload button was clipped by the fold;
- `transition: width` on the probability bars animated a layout property.

## What was chosen, and what was refused

**Transition (Title Settle):** a porcelain panel wipes down, the destination's name holds briefly, then the panel wipes away as the title settles into the page heading — ~640ms, `clip-path`/`transform`/`opacity` only, CSS-only (no motion library, so [[002-css-motion-over-framer]] still holds). The **View Transitions API was rejected**: unstable in Next 16 and not deterministically testable. It fires on route change only — never for uploads, analysis, accordions, or the drawer.

**Report drawer:** a native modal `<dialog>`, because focus trapping, Escape, and page inertness are platform guarantees rather than hand-rolled ones. A right drawer on desktop, a full sheet on mobile.

**PDF:** `jsPDF`, lazily imported on click. This is the only route to the required exact filename (`window.print()` cannot set one). The specimen is redrawn from the in-memory object URL through a canvas — so it is **never re-uploaded, never stored, and EXIF is stripped by the re-encode**.

**Refused:** sample images in the UI (would mean publishing medical images — forbidden); accuracy or dataset figures on the page (no verified evaluation results exist to cite, and inventing them is not an option); a separate `/model` route (a thin page, and a dead nav CTA); a warm cream/bone palette (the current AI-template default).

**Anti-pattern scan, honestly:** 9 findings. Eight were false positives — the dropzone's viewfinder corner brackets matched a "side-tab" border rule structurally but not semantically. They were still rewritten as a single SVG, which is cleaner and silences the rule. The ninth (`transition: width`) was real and is now `transform: scaleX`.

## Consequences

`Hero`, `HowItWorks`, and `ModelInfo` are replaced by the About page and `ModelClasses`. Confidence is displayed exactly once and always rounded **down**; probabilities below 0.05% render as `<0.1%` with a minimum visible bar. Two layout bugs found by the tests are fixed and worth remembering: a bare `grid` creates one `auto` track that sizes to *max-content* and overflows mobile (`grid-cols-1` is load-bearing), and a percentage height inside an auto-height parent collapses (which dropped the figcaption on top of the Remove button).
