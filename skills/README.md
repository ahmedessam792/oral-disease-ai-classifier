---
title: Skills & Claude Code Resources
tags:
  - claude-code
  - skills
---

# Skills & Claude Code Resources

This project uses two kinds of Claude Code resources:

1. **Project skills** — live in [`.claude/skills/`](../.claude/skills/) where Claude Code auto-discovers them. Small, project-specific, and enforce this repo's actual rules:

| Skill | Purpose |
|---|---|
| `healthcare-ui-review` | Responsible medical language, disclaimers, mock labeling, visual identity rules |
| `upload-prediction-ux` | The classifier state machine's phases, error routing, and invariants |
| `api-contract-review` | Keeps backend schemas ↔ frontend types ↔ docs in sync |
| `pre-release-check` | The full verification ladder (pytest, vitest, lint, build, e2e, docker) |

2. **User-level plugins** — already installed on the developer machine (not duplicated into this repo). Inventory, licenses, and rationale: [SOURCES.md](SOURCES.md).

## Distinctions used in this project

- **Skill**: instructions loaded on demand (`SKILL.md`); project skills live in `.claude/skills/`.
- **Slash command**: user-typed shortcut (`/code-review`) — skills can back them.
- **Agent**: autonomous worker with its own tools (e.g. Explore, Plan).
- **Plugin**: installable bundle of skills/agents/MCP servers (e.g. `superpowers`).
- **MCP server**: external tool provider over the Model Context Protocol (e.g. Playwright MCP) — configured as an integration, never copied into `skills/` as files.
- **Reference repository**: read for ideas; not installed.
