# CLAUDE.md — leeloo-bitbucket

## Overview

`leeloo-bitbucket` is a Claude Code plugin that calls Bitbucket Cloud REST API 2.0 directly.
It provides repository management via curl, with no MCP server required.

## Prerequisites

- Bitbucket Cloud API Token + workspace configuration required. Run `/lk-bb-setup install` for initial setup.
- Config file: `~/.claude/leeloo-bitbucket.local.md` (auth info stored in YAML frontmatter)
- Fields: `bitbucket_user_email`, `bitbucket_api_token`, `bitbucket_workspace`

## Skills (lk-bb- prefix)

| Skill | Subcommands | Function |
|-------|-------------|----------|
| `lk-bb-setup` | status, install | Verify connection, interactive initial setup |
| `lk-bb-repo` | list, get, create, delete | Repository CRUD |
| `lk-bb-branch` | list, create, delete | Branch management |
| `lk-bb-pr` | list, get, create, merge, comment | PR management |
| `lk-bb-commit` | list, diff | Commit history, diff lookup |

## Scripts

- `scripts/bb-fetch-all.sh` — Parallel pagination utility. Supports concurrent request limit (`--max-parallel`, default 5).
  ```bash
  bb-fetch-all.sh <endpoint> [--pagelen 100] [--max-parallel 5] [--jq-filter '{name, slug}'] [--query "state=OPEN"]
  ```

## Architecture

- Pure skill plugin — no hooks, no agents. Scripts contain only the parallel pagination utility.
- Each skill follows the pattern: read config file → parse args → curl call → format result.
- When config is missing, users are guided to `/lk-bb-setup install`.
- API endpoint: `https://api.bitbucket.org/2.0/`
- Auth: Basic Auth (`-u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN"`)
