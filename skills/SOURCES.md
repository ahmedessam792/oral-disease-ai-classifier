---
title: Skills Sources & Inventory
date: 2026-07-13
tags:
  - claude-code
  - skills
---

# Skills Sources & Inventory

Verified inventory as of 2026-07-13. "Installed" means present at user level on the development machine (`~/.claude/plugins`), available to this project without copying files into the repo.

## Installed and used in this project

| Resource | Type | Source | License | Use here |
|---|---|---|---|---|
| `frontend-design` | plugin (skill) | claude-plugins-official | Anthropic | Drove the design-system direction (docs/DESIGN_SYSTEM.md) |
| `superpowers` | plugin (skills) | claude-plugins-official (v6.1.1) | MIT | Process discipline: verification-before-completion, systematic debugging |
| `playwright` | plugin (MCP server) | claude-plugins-official | Apache-2.0 (Playwright) | Live browser verification of the UI during development; committed e2e suite uses `@playwright/test` directly |
| `ui-ux-pro-max` | plugin (skill) | ui-ux-pro-max-skill marketplace (v2.5.0) | see upstream repo | Available for UI review passes; design direction came from frontend-design to keep one voice |
| `context7` | plugin (MCP) | claude-plugins-official | MIT | Up-to-date library docs lookup |
| `github` | plugin (MCP) | claude-plugins-official | GitHub | For future PR workflows once the repo is on GitHub |
| `skill-creator` | plugin (skill) | claude-plugins-official | Anthropic | Used as reference for authoring the four project skills |

Also installed, not used by this project: `vercel`, `supabase`, `figma`, `obsidian` plugins.

## Wishlist items evaluated and NOT installed

| Resource | Decision |
|---|---|
| `gstack` (github.com/garrytan/gstack) | Not installed — full-stack scaffolding kit; this repo's stack was already scaffolded deliberately. No gap it would fill. |
| `everything-claude-code` / `awesome-claude-code` / `karpathy-skills` | Reference lists, not installable tools; nothing cloned to avoid vendoring large unrelated repos. |
| `Impeccable-UI`, `taste-skill`, `theme-factory`, `Brand Guideline`, Emil Kowalski interaction guidance | Overlap with the already-installed frontend-design + ui-ux-pro-max; adding them would create conflicting design voices. Interaction-feel principles (motion explains state, ≤200ms transitions, reduced-motion) are encoded in docs/DESIGN_SYSTEM.md §6 instead. |

Rule applied throughout: verify official source and license before installing, never run unverified install scripts, prefer few focused skills over many overlapping ones.
