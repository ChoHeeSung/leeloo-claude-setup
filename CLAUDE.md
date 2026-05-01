# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`leeloo-claude-setup` is the Leeloo (이루기술) internal Claude Code plugin marketplace repository.
A single repo ships 8 independent plugins, declared in the `plugins` array of `.claude-plugin/marketplace.json`.

## Plugins

| Plugin | Version | Role | Skills | Details |
|---|---|---|---|---|
| leeloo-kit | 3.7.0 | Environment & tooling (harness-engineering core) | 5 | `leeloo-kit/CLAUDE.md` |
| leeloo-workflow | 1.0.1 | Workflow (Plan / review / TODO) | 4 | `leeloo-workflow/CLAUDE.md` |
| leeloo-git | 1.0.1 | Git automation | 2 | `leeloo-git/CLAUDE.md` |
| leeloo-agent | 1.0.1 | Sub-agent & team management | 2 | `leeloo-agent/CLAUDE.md` |
| leeloo-doc | 1.2.0 | Documents & drawings (HWP/PDF conversion & extraction) | 5 | `leeloo-doc/CLAUDE.md` |
| leeloo-bitbucket | 1.0.1 | Bitbucket REST API | 5 | `leeloo-bitbucket/CLAUDE.md` |
| leeloo-n8n | 1.0.1 | n8n MCP wrapper | 8 | `leeloo-n8n/CLAUDE.md` |
| leeloo-its | 1.0.1 | ITS Oracle DB management | 3 | `leeloo-its/CLAUDE.md` |

Namespacing: prefixes `lk-` / `lk-doc-` / `lk-bb-` / `lk-n8n-` / `lk-its-` prevent collisions. Each plugin can be enabled independently.

## Output Language Policy

Internal instructions in this repository (CLAUDE.md, SKILL.md bodies, agents, output styles, resources) are written in English to reduce token cost. **All user-facing output — skill-generated reports, converted documents, chat replies, command results — MUST be in Korean.** The English instructions govern Claude's behavior; they do not change the language Claude speaks to the user.

## Coding Principles

Follow Mandatory Principle 7 (Anti-Spaghetti Code Gate) in `~/.claude/CLAUDE.md`.
On every code write/edit, check: SRP · max nesting depth 3 · function length 50–80 lines · cyclomatic complexity < 10 · DRY & KISS.

## Testing Changes

1. Register this repo as a marketplace.
2. Verify all 8 plugins appear in the plugin list.
3. Verify each plugin's skills show up in `/` autocomplete.

## Failure Memory

Failure-record summaries live in the project-local `CLAUDE.local.md` (gitignored, auto-loaded by Claude Code). For full records see `.leeloo/failure-memory/` and `/lk-harness failure-memory`.
