---
title: Design System — Arcus (v2)
date: 2026-07-13
tags:
  - design
  - frontend
---

# Design System — Arcus (v2)

> [!NOTE]
> v1 (the "clinical lightbox" editorial direction) was replaced on 2026-07-13. It was calm and readable but read as a *document*: serif headline, prose-heavy sections, and the analyzer below the fold. v2 makes the analyzer the product. Rationale in `docs/DECISIONS/003-arcus-redesign.md`.

## 1. Product identity

**Arcus** — from *arcus dentalis*, the dental arch. The product name lives only in the UI; the repository, docs, and footer keep `oral-disease-ai-classifier`.

Personality: **a diagnostic instrument, not a document.** Porcelain page, one dark precision instrument, everything else quiet. Attributes: precise · calm · candid · instrument-grade · educational. Never: playful, salesy, gradient-heavy, glassmorphic, dashboard-like.

Voice: plain verbs, sentence case, no marketing language. Results are "AI classification result", never a diagnosis. Errors state what happened and what to do next.

## 2. Color — "Porcelain & Petrol"

| Token | Hex | Role |
|---|---|---|
| `porcelain` | `#f4f6f5` | Page background |
| `surface` | `#ffffff` | Panels, chips |
| `ink` | `#101e24` | Primary text |
| `ink-soft` | `#4b5d66` | Secondary text |
| `ink-faint` | `#5c6d75` | Mono labels — **lightest text tone allowed** (≥4.5:1 on white) |
| `line` / `line-strong` | `#dce3e1` / `#c4cfcc` | Hairlines, borders |
| `teal` / `teal-deep` | `#146f63` / `#0f584e` | The only interactive color: CTAs, links, focus |
| `teal-wash` | `#e6f0ee` | Icon tiles, hover fills |
| **`scan`** | `#5fe3d3` | **Instrument-only.** Scan/AI affordances: the arc, reticle, ready state, result eyebrow. Never on porcelain — it fails contrast there. |
| `housing` / `-2` / `-3` | `#0e1f26` / `#17313a` / `#21454f` | The instrument body and its panels; footer |
| `glow` | `#f2f7f6` | Text and lit surfaces inside the housing |
| `rose` | `#bf6272` | Marking color: the predicted class only (confidence ring + its bar) |
| `success` | `#1f7a4c` | Positive status |
| `warn` / `warn-ink` | `#d19a3c` / `#8a5a12` | Mock/caution — `warn` on housing, `warn-ink` on light surfaces (AA) |
| `error` / `error-ink` | `#b4483a` / `#a03f32` | Error states |

Rules: teal is the only interactive color; rose never exceeds ~2% of a viewport; the housing palette appears only in the instrument and footer. **All text ≥ 4.5:1** — on the housing, never fall below `/70` opacity (axe scans enforce this).

## 3. Typography

| Role | Face | Weights | Usage |
|---|---|---|---|
| Display | **Sora** | 600, 700 | `h1`–`h3` only |
| Body + UI | **Inter** | 400, 500, 600 | Paragraphs, controls, forms |
| Data | **JetBrains Mono** | 400, 500 | Percentages, class labels, model IDs, timestamps, specs |

Loaded with `next/font` (self-hosted, `latin` subset, `display: swap`), seven weights total. Pairing is on a real contrast axis — geometric display against a neutral grotesque UI face — with mono reserved strictly for values. No serif.

Scale: `h1 1.75→2.5rem` by breakpoint · `h2 1.25rem` · `body 1rem/1.6` · `small 0.875rem` · `mono label 0.6875rem, tracking 0.14em, uppercase`. Headline tracking `-0.02em`, max 17ch. Prose max 50–62ch. Numbers use `tabular-nums`.

## 4. Space, radius, elevation

- **Spacing**: 4px base. Sections 56–64px vertical (was 96–128 — v1's emptiness read as filler).
- **Radius**: `sm 6` · `md 10` (buttons, panels) · `lg 14` (instrument panels) · `xl 20` (the instrument shell).
- **Elevation**: flat + hairlines everywhere, except the instrument, which carries `--shadow-instrument` (a deep, soft drop) and a 1px top-edge light gradient so it reads as a physical object on the page.

## 5. Iconography

Lucide, 1.75px stroke, 14–22px, `currentColor`. Always paired with text, except the remove-image control (which has an `aria-label`). No emoji.

## 5b. Routes and the page-intro transition

Two route-level destinations: `/` (**Analyze**) and `/about` (**About Arcus**). There is no `/model` route — model detail lives inside About.

**Title Settle** (`components/transition/RouteTransition.tsx`) plays on route change only:

1. a porcelain panel wipes down over the page (`clip-path`, 180ms),
2. the destination's name holds, large, in the display face (200ms),
3. the panel wipes away while the title scales down and rises out, and the page fades in beneath it (260ms).

**~640ms total**, `ease-out-expo`. Transform / opacity / clip-path only. It never fires on cold load, and never for in-page interactions — uploading, analyzing, opening the report drawer, or expanding an accordion do not change the path.

Accessibility: the overlay is `aria-hidden` (it is decoration); the document title updates, a polite live region announces the route, and focus moves to the destination `<h1>`. Under `prefers-reduced-motion` no overlay mounts at all and navigation is not delayed.

## 5c. The report drawer

A right-side drawer ≥768px, a full-screen sheet below, built on a native modal `<dialog>` — focus trapping, Escape, and page inertness come from the platform rather than a hand-rolled trap; focus returns to the trigger on close. Its own 220ms panel animation; the route transition is never involved. Contents mount only while open. Print styles render it on white with controls removed.

The PDF is generated client-side with a lazily-imported `jsPDF`: the image is re-drawn from the in-memory object URL through a canvas (which strips EXIF), so it is **never re-uploaded and never stored**.

## 6. Motion — four moments, CSS only

Framer Motion remains uninstalled (ADR 002). Motion explains state; it never decorates.

1. **Scan arc** — nodes pulse out of phase; one scan line traverses the arch. The idle instrument's heartbeat.
2. **Power-on** — the viewing surface lights when an image is accepted (350ms).
3. **Analysis sweep** — a single band crosses the dimmed image while classifying. This *is* the loading indicator.
4. **Result reveal** — the report rises in (420ms), the confidence ring draws (700ms), probability bars grow with a 60ms stagger.

Everything else is a ≤200ms color transition. Under `prefers-reduced-motion: reduce`, the sweep and scan line are removed and all durations collapse to ~0.

## 7. Accessibility (enforced by the axe scans in `e2e/`)

- Keyboard: dropzone browse is a real `<button>`; disclosures are native `<details>`; full analyze flow is keyboard-operable (covered by an e2e test).
- Focus: 2px teal ring on porcelain, `scan` ring inside the housing, always `outline-offset: 2px`.
- Touch targets ≥ 44px (all buttons are `h-11`/`h-12`).
- Live regions: report panel is `aria-live="polite"`; errors are `role="alert"` scoped inside `#classifier`; loading is `role="status"`.
- One `h1`; semantic `header`/`main`/`section`/`footer`; probability bars are decorative with the values as text.
- Long class labels: truncate with a `title`, or wrap via `overflow-wrap: anywhere` for the predicted class.

## 8. Layout

Container `max-w-1320px`, 16–24px gutters.

```text
≥1280px                              1024–1279px / <1024px
┌──────────────────────────────┐     ┌──────────────────┐
│ sticky header (64px)         │     │ sticky header    │
├───────────────┬──────────────┤     ├──────────────────┤
│ message       │ INSTRUMENT   │     │ compact message  │
│ + trust chips │  scan arc |  │     ├──────────────────┤
│               │  preview  |  │     │ INSTRUMENT       │
│               │  report      │     │ (full width,     │
└───────────────┴──────────────┘     │  panels side-by- │
  How it works (5 icon steps)        │  side ≥1024,     │
  The model (spec strip + chips)     │  stacked <1024)  │
  Before you rely on a reading       └──────────────────┘
    (2 accordions)
  Footer (wordmark + disclaimer)
```

The upload control is visible without scrolling at 1440, 1280, and 1024; on mobile it sits directly under a three-line message.

## 9. Instrument states

| State | Viewing surface | Report panel |
|---|---|---|
| **Empty** | Scan arc + reticle brackets, "Drop an oral image here", Browse button, formats | Ghost report (dimmed rings/bars) + "what will appear here" |
| **Drag-active** | Panel lightens, reticle brackets tighten and brighten | unchanged |
| **Preview** | Image lit (`power-on`), filename + size, Remove control | Ghost report turns **scan-colored**, `ready` label, Analyze button |
| **Loading** | Image dimmed 45%, sweep band | "Analyzing image…" + Validate/Preprocess/Classify pipeline; Analyze disabled |
| **Result** | Image stays lit | Confidence ring + predicted class, all-classes bars, "confidence is not certainty", model · version, disclaimer, Analyze another |
| **Invalid file** | Back to empty | `role="alert"` + "Choose another image" |
| **Missing model (503)** | Preview retained | Alert: "The classification model isn't available yet" — retry allowed |
| **Backend down** | Preview retained | Alert: "Can't reach the analysis service" — retry allowed |
| **Server error** | Preview retained | Alert: "Something went wrong" |
| **Mock mode** | — | Amber banner: "Development mock — not a real classification result" |

## 10. Responsible-language rules (unchanged from v1)

- Result heading is always "AI classification result".
- *Diagnosis*, *detected*, *confirmed* never appear in UI copy.
- The disclaimer appears under every result **and** permanently in the footer.
- Mock results are always visibly labeled; production cannot serve them.
