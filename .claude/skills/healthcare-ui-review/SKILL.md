---
name: healthcare-ui-review
description: Review UI changes in this project for clinically responsible language, mandatory disclaimers, mock-result labeling, and the design system's clinical-instrument identity. Use after adding or editing any user-facing copy, result display, or state view in apps/web.
---

# Healthcare UI Review

Check every user-facing change against these rules (sources: docs/DESIGN_SYSTEM.md §1, §9–10; CLAUDE.md hard rules).

## Language rules

- Results are titled "AI classification result" — never "diagnosis", "detected", "confirmed", or "identified".
- No invented medical content anywhere: class names come only from the API (`model/labels.json` upstream); never hardcode disease names in UI code or tests.
- The disclaimer ("Educational and research use only…") must remain in the footer AND under every rendered result. Removing either is a defect.
- Errors say what happened and what to do next; they never apologize or blame the user.
- Tone: calm, plain verbs, sentence case. No marketing language ("powerful AI", "instant results").

## Mock-result rules

- Any response with `mock: true` must render the amber MockBanner ("Development mock — not a real classification result").
- Never present mock output without that banner, including in screenshots or docs.

## Visual identity rules

- Housing palette (dark) appears only inside the classifier instrument and footer.
- Rose is a marking color: predicted-class tick and predicted bar only.
- Teal is the only interactive color. No gradients, no glassmorphism.
- New states must match the state table in docs/DESIGN_SYSTEM.md §9.

## Checklist

1. Grep changed files for forbidden words: `diagnos`, `detected`, `confirmed` (in UI strings).
2. Confirm disclaimer presence in ResultPanel and Footer.
3. Confirm MockBanner renders for `mock: true` (unit test exists — keep it passing).
4. Check new copy reads calmly at a 375px viewport (no truncation).
