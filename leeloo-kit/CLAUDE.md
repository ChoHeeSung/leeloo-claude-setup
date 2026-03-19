# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`leeloo-kit` is a Claude Code plugin for Leeloo(이루기술) — the company-standard AI development kit featuring PDCA workflow, dual verification (Gemini + Claude), and agent automation. Pure plugin architecture with no shell script dependencies.

## Architecture

- `plugin.json` — Plugin manifest (name: "leeloo-kit", version: "2.0.0").
- `.claude-plugin/marketplace.json` — Marketplace manifest for plugin discovery.
- `hooks/hooks.json` — 5 hook events: SessionStart, PreToolUse(Bash), PostToolUse(Write|Edit, Skill), Stop.
- `scripts/` — Runtime hook scripts (Node.js v18+ CommonJS):
  - `session-start.js` — Session init, dependency checks, PDCA status display.
  - `bash-pre.js` — Dangerous command blocking (rm -rf, git push --force, etc).
  - `write-post.js` — PDCA document format validation.
  - `skill-post.js` — Post-skill orchestration (next step suggestions).
  - `unified-stop.js` — Stop dispatcher for agent/skill completion handling.
  - `lib/` — Shared utilities: io.js, config.js, paths.js, pdca-status.js, context.js.
- `leeloo.config.json` — Central config (PDCA paths, thresholds, cross-validation settings).
- `skills/` — 9 skills (lk- prefix):
  - `lk-plan/` — Brainstorming-based Plan creation with Gemini cross-validation.
  - `lk-pdca/` — PDCA lifecycle management (design/do/analyze/report/status).
  - `lk-code-review/` — Code review (Claude solo or Gemini+Claude dual with --dual flag).
  - `lk-plan-cross-review/` — Plan review (Gemini independent validation of Plan/Design docs).
  - `lk-agent/` — Sub Agent creation/management with 7 presets.
  - `lk-team/` — Agent Team composition/management with 5 presets.
  - `lk-todo/` — Plan-to-TODO with design doc references and progress suggestions.
  - `lk-commit/` — Conventional Commits + Korean style + TODO integration.
  - `lk-setup/` — Optional environment enhancement (statusline, CLAUDE.md, gemini).
- `agents/` — 4 PDCA agents: gap-detector, pdca-iterator, code-analyzer, report-generator.
- `templates/` — 5 PDCA document templates: plan, design, analysis, report, do.
- `output-styles/` — 3 output styles: lk-dual-verify, lk-mentor, lk-ops.
- `resources/` — Optional resources: statusline-leeloo.sh, gemini-review-prompt.md, CLAUDE.md template.

## Key Design Decisions

- **Pure plugin**: No shell scripts. Plugin install = marketplace install or `enabledPlugins` path. Hooks, skills, agents auto-discovered.
- **PDCA workflow**: Plan → Design → Do → Check(Analyze) → Act(Iterate) → Report. Each phase produces a document in `docs/{phase}/`.
- **Dual verification**: Gemini cross-validation + Claude analysis for quality assurance.
- **Hook-driven orchestration**: skill-post.js and unified-stop.js auto-suggest next PDCA steps.
- **State in `.leeloo/`**: pdca-status.json, active-context.json, metrics.json for runtime state.
- **lk- prefix**: All skills use `lk-` prefix for discoverability and namespace separation.
- **Design doc references in TODO**: Each TODO item links to its source section in the design document.

## PDCA Document Paths

- Plan: `docs/plan/{feature}.plan.md`
- Design: `docs/design/{feature}.design.md`
- Analysis: `docs/analysis/{feature}.analysis.md`
- Report: `docs/report/{feature}.report.md`

## Testing Changes

Plugin is tested by enabling it and verifying:
1. SessionStart hook runs (check `.leeloo/` creation)
2. Skills appear in `/` autocomplete (lk-plan, lk-pdca, etc.)
3. Agents appear in Agent tool (gap-detector, etc.)
4. Full PDCA cycle: `/lk-plan` → `/lk-plan-cross-review` → `/lk-pdca design` → `/lk-pdca analyze` → `/lk-pdca report`
