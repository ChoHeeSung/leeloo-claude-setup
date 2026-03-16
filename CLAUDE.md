# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`leeloo-claude-setup` is a Claude Code plugin for Leeloo(이루기술) that automatically applies company-standard Claude Code environment settings upon installation. It uses a `SessionStart` hook to trigger an idempotent setup script on the first session after plugin install.

## Architecture

- `plugin.json` — Plugin manifest. Defines a `SessionStart` hook that runs `setup-claude-code.sh` via `${CLAUDE_PLUGIN_ROOT}`.
- `setup-claude-code.sh` — Idempotent setup script. Checks marker file (`~/.claude/.leeloo-setup-done`); if absent, merges settings and installs resources, then creates the marker. Requires `jq` for JSON deep merge.
- `resources/` — Template files deployed to `~/.claude/` during setup:
  - `settings-template.json` — Merged into existing `settings.json` (uses `__HOME__` placeholder, resolved at runtime). Contains hooks, statusLine, enabledPlugins, extraKnownMarketplaces.
  - `settings.local.json` — Local permissions (created only if absent).
  - `statusline-leeloo.sh` — Custom Powerline-style statusline (model, context usage, cost, git info).
  - `CLAUDE.md` — Company-standard global CLAUDE.md template (deployed to `~/.claude/CLAUDE.md`).

## Key Design Decisions

- **Merge, not overwrite**: `settings.json` is deep-merged with `jq -s '.[0] * .[1]'` to preserve user's existing settings.
- **Idempotent via marker file**: The setup runs once per machine. Delete `~/.claude/.leeloo-setup-done` to force re-run.
- **`settings.local.json` and `CLAUDE.md` are non-destructive**: Only created if they don't already exist.

## Testing Changes

To test the setup script locally:
```bash
# Remove marker to force re-run
rm -f ~/.claude/.leeloo-setup-done
# Run directly
bash setup-claude-code.sh
```
