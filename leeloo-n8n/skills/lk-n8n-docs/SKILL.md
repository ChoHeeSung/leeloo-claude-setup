---
name: lk-n8n-docs
description: |
  n8n MCP 도구 사용법·문서 조회.
  n8n 문서, n8n 사용법, MCP 도구, n8n 도움말, n8n docs, n8n help, n8n mcp tools
user_invocable: true
argument-hint: "[topic]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-n8n-docs — n8n MCP Tools Documentation

Look up documentation and usage for n8n MCP tools.

## Subcommands

```
/lk-n8n-docs                  — Tool overview + quickstart guide
/lk-n8n-docs <topic>          — Detailed documentation for a tool (e.g., n8n_create_workflow)
```

## Procedure

### MCP pre-check

1. Call `mcp__n8n-mcp__n8n_health_check`.
   - On failure, instruct: "n8n MCP server is not configured. Run `/n8n-setup install` first." Then stop.

### Argument parsing

- No args → **overview** action
- `<topic>` → **topic** action

---

### overview action

1. Call `mcp__n8n-mcp__tools_documentation` without parameters (quickstart guide).
2. Additionally display the leeloo-n8n skill mapping table:
   ```
   leeloo-n8n skill guide

   | Skill | Purpose | Example |
   |-------|---------|---------|
   | /n8n-setup | MCP connection management | /n8n-setup status |
   | /n8n-workflow | Workflow CRUD | /n8n-workflow list |
   | /n8n-run | Run and history | /n8n-run test 123 |
   | /n8n-validate | Validation and fixes | /n8n-validate check 123 |
   | /n8n-node | Node search/info | /n8n-node search slack |
   | /n8n-template | Template management | /n8n-template search chatbot |
   | /n8n-version | Version management | /n8n-version list 123 |
   | /lk-n8n-docs | Documentation lookup | /lk-n8n-docs |
   ```

---

### topic action

1. Call `mcp__n8n-mcp__tools_documentation` with `topic`, `depth: "full"`.
2. Display the detailed documentation for the tool.
