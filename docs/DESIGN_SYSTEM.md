---
title: Design System
date: 2026-07-13
tags:
  - design
  - frontend
---

# Design System — Oral Disease AI Classifier

## 1. Product personality

**A quiet diagnostic instrument, not a SaaS product.** The page behaves like a well-lit examination room: calm, orderly, unhurried. One element is allowed to be bold — the classifier itself, styled as a **clinical viewing lightbox (negatoscope)**: a dark instrument housing with a luminous viewing surface where the uploaded image is examined. Everything around it stays porcelain-quiet.

Brand attributes: **precise · calm · candid · instrument-grade · educational**. Never: playful, salesy, gradient-heavy, glassmorphic, dashboard-like.

Voice: plain verbs, sentence case, no marketing filler. Results are described as "AI classification result", never a diagnosis. Errors say what happened and what to do next.

## 2. Color

Derived from the clinical world: porcelain and enamel surfaces, petrol ink of chart annotations, scrub teal, mucosal rose used as a marking color.

| Token | Hex | Role |
|---|---|---|
| `--color-porcelain` | `#F6F4F0` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, inputs |
| `--color-ink` | `#1C2B33` | Primary text (dark petrol) |
| `--color-ink-soft` | `#51616B` | Secondary text |
| `--color-line` | `#DCD7CE` | Hairlines, borders |
| `--color-teal` | `#2A7D6F` | Primary accent: actions, focus, links, bars |
| `--color-teal-deep` | `#1F5F55` | Hover/active |
| `--color-rose` | `#B65C6B` | Marking color: predicted-class tick, small highlights only |
| `--color-housing` | `#182A30` | Lightbox housing, footer background |
| `--color-housing-2` | `#213840` | Raised surfaces inside the housing |
| `--color-glow` | `#F4F8F7` | Lightbox viewing surface ("lit film") |
| `--color-warn` | `#B97E24` | Low-confidence and caution notices |
| `--color-error` | `#A03B2E` | Errors, invalid states |

Rules: rose never exceeds ~2% of any viewport; teal is the only interactive color; the housing palette appears **only** inside the classifier instrument and footer. Contrast ≥ 4.5:1 for all text (ink on porcelain = 12.5:1, glow on housing ≥ 12:1).

## 3. Typography

| Role | Face | Usage |
|---|---|---|
| Display | **Newsreader** (500, optical sizing) | Headlines, section titles — scientific-journal register |
| Body / UI | **Public Sans** (400/500/600) | Paragraphs, controls, forms — institutional clarity |
| Data | **Spline Sans Mono** (400/500) | Eyebrows, percentages, class labels, chart annotations — tabular numerals |

Scale (rem): `display 3.4/clamp` · `h2 2.0` · `h3 1.25` · `body 1.0/1.6lh` · `small 0.875` · `caption 0.8125 mono`. Eyebrows: mono, uppercase, `letter-spacing 0.14em`, ink-soft. Headline tracking `-0.01em`. Line length ≤ 68ch.

## 4. Spacing, radius, elevation

- **Spacing**: 4px base — `4 8 12 16 24 32 48 64 96 128`. Sections separated by 96–128px desktop, 64px mobile.
- **Radius**: `--r-sm 6px` (inputs, chips) · `--r-md 10px` (cards, buttons) · `--r-lg 16px` (lightbox housing, hero media). No pills except status chips.
- **Elevation**: mostly flat + hairlines. `--shadow-1: 0 1px 2px rgb(28 43 51 / 0.06)` (cards) · `--shadow-2: 0 12px 32px -12px rgb(28 43 51 / 0.25)` (the lightbox only). The lightbox viewing surface gets an inner glow (`inset 0 0 48px rgb(244 248 247 / 0.45)`), which is its "light".

## 5. Iconography

Lucide, 1.5px stroke, 20px default, `currentColor`. Icons always paired with text labels — never icon-only controls except the remove-image button (which gets an `aria-label`).

## 6. Motion principles

Motion explains state changes; it never decorates. Framer Motion only where state actually changes:

1. **Lightbox power-on** — when an image is accepted, the viewing surface fades from housing-dark to glow (400ms ease-out).
2. **Analysis sweep** — during classification, a single thin light band sweeps the image vertically (1.6s loop). This *is* the loading indicator.
3. **Result settle** — probability bars grow from 0 with 40ms stagger (500ms ease-out); no count-up numbers.

Everything else uses CSS transitions ≤ 200ms. All three sequences collapse to instant opacity swaps under `prefers-reduced-motion: reduce` (the loading state then shows a static "Analyzing…" mono label with an opacity pulse).

## 7. Accessibility rules

- Full keyboard path: dropzone is a real `<button>`; Enter/Space opens the file picker; visible 2px teal `outline-offset: 2px` focus rings on porcelain, glow-colored rings inside the housing.
- All states announced: results region `aria-live="polite"`, errors `role="alert"`.
- Probability bars are a described list (`role="list"`, text values in mono) — the bar is decorative.
- Semantic landmarks: `header/main/section/footer`, one `h1`.
- Touch targets ≥ 44px; contrast per §2; reduced motion per §6.

## 8. Layout

Max content width 1120px, 24px gutters (16px mobile). 12-col grid on desktop only where needed.

```text
DESKTOP                             MOBILE
┌──────────────────────────────┐    ┌──────────────┐
│ header: name ······ nav     │    │ header       │
│                              │    │              │
│ HERO  eyebrow                │    │ HERO         │
│ Newsreader thesis (2 lines)  │    │ headline     │
│ subline + CTA → instrument   │    │ CTA          │
│                              │    │              │
│ ┌──────────────────────────┐ │    │ ┌──────────┐ │
│ │  LIGHTBOX (housing)      │ │    │ │ LIGHTBOX │ │
│ │ ┌──────────┐ ┌─────────┐ │ │    │ │ viewing  │ │
│ │ │ viewing  │ │ chart / │ │ │    │ │ surface  │ │
│ │ │ surface  │ │ result  │ │ │    │ ├──────────┤ │
│ │ └──────────┘ └─────────┘ │ │    │ │ result   │ │
│ └──────────────────────────┘ │    │ └──────────┘ │
│                              │    │              │
│ HOW IT WORKS (numbered 1–5,  │    │ stacked      │
│  a real sequence)            │    │ sections     │
│ MODEL INFO (from API)        │    │              │
│ LIMITATIONS · PRIVACY        │    │              │
│ footer (housing dark):       │    │ footer       │
│  disclaimer                  │    │              │
└──────────────────────────────┘    └──────────────┘
```

Breakpoints: `<640` stacked · `640–1024` lightbox stacks viewing surface over result · `≥1024` side-by-side instrument.

Numbered markers are used **only** in How-it-works because it is a genuine sequence (upload → validate → preprocess → classify → review).

## 9. Component states (the instrument's modes)

| State | Viewing surface | Right panel |
|---|---|---|
| **Empty** | Unlit (housing-2), dashed hairline, "Drop an oral image here" + browse button + accepted formats/size in mono caption | Quiet explainer of what will appear |
| **Preview** | Power-on glow, image fit `contain`, filename + size in mono, Remove control | Analyze button (primary teal), enabled once |
| **Loading** | Image dimmed 60%, analysis sweep | Analyze disabled, "Analyzing image…" |
| **Result** | Image stays lit | "AI classification result" + predicted class (Newsreader) with rose tick, confidence in mono, probability bars, model name/version chip, mock banner if `mock`, low-confidence caution if below threshold, "Analyze another image" |
| **Invalid file** | Unlit, error hairline | `role="alert"`: what was wrong + what is accepted |
| **Missing model (503)** | Unlit | "The classification model isn't available yet" + explanation, retry |
| **Backend down** | Unlit | "Can't reach the analysis service" + retry |
| **Error (500)** | Unlit | Generic safe message + retry |

Mock banner (whenever API returns `mock: true`): warn-amber hairline chip pinned atop the result — "Development mock — not a real classification result."

## 10. Responsible-language rules

- Result heading is always "AI classification result".
- The words *diagnosis*, *detected*, *confirmed* never appear in UI copy.
- Educational disclaimer is permanently visible in the footer and echoed under every result: "Educational and research use only. Not a substitute for professional medical advice, diagnosis, or treatment."
