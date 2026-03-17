# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`leeloo-claude-setup` is a Claude Code plugin for Leeloo(이루기술) that provides company-standard Claude Code environment settings, skills, and hooks. Users run `/leeloo-setup` to install the environment.

## Architecture

- `.claude-plugin/plugin.json` — Plugin manifest (name, description, author).
- `hooks/hooks.json` — Hook definitions. `PermissionRequest(ExitPlanMode)` saves plan to `.claude/plans/` and suggests cross-validation and TODO generation.
- `.claude-plugin/marketplace.json` — Marketplace manifest for plugin discovery and installation.
- `setup-claude-code.sh` — Idempotent setup script. Backs up existing files to `~/.claude/.leeloo-backup/`, then checks marker file (`~/.claude/.leeloo-setup-done`); if absent, merges settings and installs resources, then creates the marker. Requires `jq` for JSON deep merge.
- `uninstall-claude-code.sh` — Uninstall script. Restores files from backup, removes files created by setup, deletes marker file and backup directory. Idempotent.
- `resources/` — Template files deployed to `~/.claude/` during setup:
  - `settings-template.json` — Merged into existing `settings.json` (uses `__HOME__` placeholder, resolved at runtime). Contains hooks, statusLine, enabledPlugins, extraKnownMarketplaces.
  - `settings.local.json` — Local permissions (created only if absent).
  - `statusline-leeloo.sh` — Custom Powerline-style statusline (model, context usage, cost, git info).
  - `CLAUDE.md` — Company-standard global CLAUDE.md template (deployed to `~/.claude/CLAUDE.md`).
- `skills/` — Plugin skills:
  - `leeloo-setup/SKILL.md` — Environment setup install/uninstall/status via `/leeloo-setup`.
  - `leeloo-agent/SKILL.md` — Interactive Sub Agent creation/management with 5 presets.
  - `leeloo-commit/SKILL.md` — Conventional Commits + Korean-style commit messages.
  - `leeloo-cross-validate/SKILL.md` — Gemini-based plan cross-validation.
  - `leeloo-team/SKILL.md` — Interactive Agent Team composition/management with 4 presets.
  - `leeloo-todo/SKILL.md` — Plan-to-TODO conversion and task tracking.

## Key Design Decisions

- **Merge, not overwrite**: `settings.json` is deep-merged with `jq -s '.[0] * .[1]'` to preserve user's existing settings.
- **Idempotent via marker file**: The setup runs once per machine. Delete `~/.claude/.leeloo-setup-done` to force re-run.
- **`settings.local.json` and `CLAUDE.md` are non-destructive**: Only created if they don't already exist.
- **Backup before setup**: Existing files are backed up to `~/.claude/.leeloo-backup/` before modification, enabling clean uninstall.
- **Skill-based setup**: `/leeloo-setup` skill handles installation instead of SessionStart hook, ensuring cross-platform compatibility.
- **Uninstallable**: `uninstall-claude-code.sh` restores pre-installation state. System packages (Node.js, gemini-cli) are not removed.
- **TODO workflow**: Plan mode exit suggests converting the plan to a trackable TODO list via `/leeloo-todo`.

## Testing Changes

To test the setup script locally:
```bash
# Remove marker to force re-run
rm -f ~/.claude/.leeloo-setup-done
# Run directly
bash setup-claude-code.sh
```

To test uninstall:
```bash
bash uninstall-claude-code.sh
```
