# CLAUDE.md — leeloo-n8n

## Overview

`leeloo-n8n` is a Claude Code plugin that wraps the 17 tools of the n8n MCP server into 8 skills.
All n8n features are accessible via `/n8n-*` autocomplete.

## Prerequisites

- The n8n MCP server must be configured. Run `/lk-n8n-setup install` for the install guide.

## Skills (n8n- prefix)

| Skill | Subcommands | MCP tools |
|-------|-------------|-----------|
| `lk-n8n-setup` | status, install | health_check |
| `lk-n8n-workflow` | create, get, list, update, delete | create/get/list/update_full/update_partial/delete_workflow |
| `lk-n8n-run` | test, list, get, delete | test_workflow, executions |
| `lk-n8n-validate` | check, fix, lint | validate_workflow, autofix_workflow, validate(JSON) |
| `lk-n8n-node` | search, info, check | search_nodes, get_node, validate_node |
| `lk-n8n-template` | search, get, deploy | search/get/deploy_template |
| `lk-n8n-version` | list, get, rollback, prune | workflow_versions |
| `lk-n8n-docs` | (overview), topic | tools_documentation |

## Architecture

- Pure skill plugin — no hooks, agents, or scripts
- Each skill follows the pattern: MCP precheck → parse args → MCP call → format result
- When MCP is missing, users are guided to `/lk-n8n-setup install`
