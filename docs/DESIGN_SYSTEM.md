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

Personality: **a diagnostic instrument, not a document.** Porcelain page, one dark precision instrument, everything else quiet. Attributes: precise · calm · candid · instrument-grade · transparent. Never: playful, salesy, gradient-heavy, glassmorphic, dashboard-like.

Voice: plain verbs, sentence case, no marketing language. Results are "AI classification result", never a diagnosis. Errors state what happened and what to do next.

## 2. Color — "Porcelain & Petrol"

| Token | Hex | Role |
|---|---|---|
| `porcelain` | `#f4f6f5` | Page background |
| `surface` | `#ffffff` | Panels, chips |
| `ink` | `#101e24` | Primary text |
| `ink-soft` | `#3c4d55` | Secondary text |
| `ink-faint` | `#5c6d75` | Mono labels — **lightest text tone allowed** (≥4.5:1 on white) |
| `line` / `line-strong` | `#dce3e1` / `#c4cfcc` | Hairlines, borders |
| `teal` / `teal-deep` | `#146f63` / `#0f584e` | The only interactive color: CTAs, links, focus |
| `teal-wash` | `#e6f0ee` | Icon tiles, hover fills |
| **`scan`** | `#5fe3d3` | **Instrument-only.** Scan/AI affordances: the arc, reticle, ready state, result eyebrow. Never on porcelain — it fails contrast there. |
| `housing` / `-2` / `-3` | `#0e1f26` / `#17313a` / `#21454f` | The instrument body and its panels — **nothing else** |
| `glow` | `#f2f7f6` | Text and lit surfaces inside the housing |
| `rose` | `#bf6272` | Marking color: the predicted class only (confidence ring + its bar) |
| `success` | `#1f7a4c` | Positive status |
| `warn` / `warn-ink` | `#d19a3c` / `#8a5a12` | Mock/caution — `warn` on housing, `warn-ink` on light surfaces (AA) |
| `error` / `error-ink` | `#b4483a` / `#a03f32` | Error states |

Rules: teal is the only interactive color; rose never exceeds ~2% of a viewport; **the housing palette appears only in the instrument** — there is exactly one dark mass on the page, and a second one (the old dark footer) competed with it. The ink ramp is deliberately wide (15.7 : 8.1 : 5.0 on porcelain) so secondary and tertiary text are distinguishable rather than muddy. **All text ≥ 4.5:1** — on the housing, never fall below `/70` opacity (axe scans enforce this).

## 3. Typography

| Role | Face | Usage |
|---|---|---|
| Headings **and** UI | **Instrument Sans** (variable) | `h1`–`h3`, paragraphs, controls, the wordmark |
| Data | **Geist Mono** (400, 500) | Percentages, class labels, model IDs, timestamps, specs |

**Two families, not three.** One well-tuned family carries the whole UI; hierarchy comes from weight, size, and color rather than from two typefaces competing. The previous Sora + Inter pairing was two similar sans set against each other — the one pairing the type rules explicitly forbid — and Inter is a generic default besides. Mono is the only second face, and it earns its place on a real contrast axis, reserved strictly for values. No serif.

Loaded with `next/font` (self-hosted, `latin` subset, `display: swap`).

Scale — a **fixed rem ramp at a ~1.2 ratio**, defined as semantic tokens in `globals.css` (`--text-caption` … `--text-display`). No fluid `clamp()` type: this is product UI, where container layouts need spatial predictability.

| Token | Size | Line height |
|---|---|---|
| `caption` | 0.75rem | 1.5 |
| `meta` | 0.8125rem | 1.5 |
| `ui` | 0.875rem | 1.5 |
| `body` | 1rem | 1.6 |
| `lead` | 1.125rem | 1.6 |
| `h3` | 1.25rem | 1.35 |
| `h2` | 1.5rem | 1.25 |
| `h1` | 2rem | 1.14 |
| `display` | 2.5rem | 1.1 |

Headline tracking `-0.025em`, max 17ch. Prose max 46–62ch. Numbers use `tabular-nums`. Arbitrary sizes (`text-[1.75rem]`) are a defect — use the tokens.

## 4. Space, radius, elevation

- **Spacing**: 4px base. Sections 56–64px vertical (was 96–128 — v1's emptiness read as filler).
- **Radius**: `sm 6` · `md 10` (buttons, panels) · `lg 14` (instrument panels) · `xl 20` (the instrument shell).
- **Elevation**: flat + hairlines everywhere, except the instrument, which carries `--shadow-instrument` (a deep, soft drop) and a 1px top-edge light gradient so it reads as a physical object on the page.

## 5. Iconography

Lucide, 1.75px stroke, 14–22px, `currentColor`. Always paired with text, except the remove-image control (which has an `aria-label`). No emoji.

## 5b. Routes and the route change

Two route-level destinations: `/` (**Analyze**) and `/about` (**About Arcus**). There is no `/model` route — model detail lives inside About.

**There is no page transition, and that is deliberate.** A route change crossfades `<main>` in **180ms** (`page-enter`, opacity only) and nothing else happens. Content is never covered and never delayed.

This replaced a "Title Settle" curtain that wiped a panel over the page and held the destination's name for 200ms before revealing it — ~640ms of page-load choreography in front of a user who came to upload an image. The motion rule for product UI is 150–250ms transitions and **no page-load choreography**; a transition that makes someone wait to see content they already asked for is worse than no transition. Do not reintroduce one.

`components/transition/RouteTransition.tsx` therefore exists for accessibility, not decoration: it updates the document title, announces the route through a polite live region, and moves focus to the destination `<h1>` (only after a real navigation — never on cold load, which would just paint a focus ring for nothing). Under `prefers-reduced-motion` there is no animation and no delay.

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

The homepage is **only** the instrument and a short message. It carries no trust chips, no explainer sections, and no filler band above the footer — everything else lives on `/about`.

```text
≥1280px                              1024–1279px / <1024px
┌──────────────────────────────┐     ┌──────────────────┐
│ sticky header (64px)         │     │ sticky header    │
├───────────────┬──────────────┤     ├──────────────────┤
│ h1            │ INSTRUMENT   │     │ compact message  │
│ one line      │  scan arc |  │     ├──────────────────┤
│ model name    │  preview  |  │     │ INSTRUMENT       │
│ About link    │  report      │     │ (full width,     │
└───────────────┴──────────────┘     │  panels side-by- │
  Footer (hairline)                  │  side ≥1024,     │
                                     │  stacked <1024)  │
                                     └──────────────────┘
```

The content block is vertically centered in the viewport (`content-center` on a `flex-1` grid), so a short page ends at the footer instead of leaving a dead band above it.

The footer is a **hairline**, not a slab: a top rule, the wordmark, the project name, and one safety line — on the page background. It carries no navigation; the header owns that, and a second About link is a duplicated action. (It was a full dark housing block, which put a second dark mass on the page competing with the instrument.)

The upload control is visible without scrolling at 1440, 1280, and 1024×768; on mobile it sits directly under the message.

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

## 10. Responsible-language rules

- Result heading is always "AI classification result".
- The result is never **described as** a diagnosis, and never *detected*, *confirmed*, or *identified*. Stating that it **is not** a diagnosis is required and is the one place the word may appear.
- **The disclaimer is one sentence, said once per surface, and matches the backend contract verbatim:**

  > Arcus provides an AI classification result and is not a substitute for professional medical advice, diagnosis, or treatment.

  It appears under every result and in the footer. It is not repeated twice on the same surface — the report drawer says only "This result is not a diagnosis." above the report, with the full sentence once in its notices.
- **"Educational" is not product language.** The old "Educational and research use only" framing was retired from the UI, the API, and the docs; do not reintroduce it.
- Mock results are always visibly labeled; production cannot serve them.
