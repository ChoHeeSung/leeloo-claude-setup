---
name: lk-n8n-template
description: |
  n8n.io 워크플로우 템플릿 검색·조회·자체 인스턴스로 배포.
  n8n 템플릿, 템플릿 검색, 템플릿 배포, 워크플로우 템플릿, n8n template, deploy template, workflow template
user_invocable: true
argument-hint: "[search|get|deploy] <query|id>"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-n8n-template — Template Management

Search, inspect, and deploy n8n.io workflow templates to your instance.

## Subcommands

```
/lk-n8n-template search <keyword>   — Keyword search for templates
/lk-n8n-template get <id>           — Template detail
/lk-n8n-template deploy <id>        — Deploy template to the n8n instance
```

## Procedure

### MCP pre-check

1. Call `mcp__n8n-mcp__n8n_health_check`.
   - On failure, instruct: "n8n MCP server is not configured. Run `/n8n-setup install` first." Then stop.

### Argument parsing

- No args → print usage and stop
- `search <keyword>` → **search** action
- `get <id>` → **get** action
- `deploy <id>` → **deploy** action

---

### search action

1. Call `mcp__n8n-mcp__search_templates` with `query`, `searchMode: "keyword"`.
2. Display the result as a table:
   ```
   Template search result: "{keyword}"

   | ID | Name | Description | Views |
   |----|------|-------------|-------|
   ```
3. Footer: "Detail: `/lk-n8n-template get <id>` | Deploy: `/lk-n8n-template deploy <id>`"

---

### get action

1. Call `mcp__n8n-mcp__get_template` with `templateId`, `mode: "structure"`.
2. Display template info:
   - Basic info (name, author, description)
   - Node list and connection structure
   - Required credentials list
3. Footer: "Deploy this template: `/lk-n8n-template deploy <id>`"

---

### deploy action

1. Look up template info via `mcp__n8n-mcp__get_template` to confirm the name.
2. AskUserQuestion — "Deploy template '{name}' to the n8n instance? (Deploy/Cancel)"
   - Allow free input for a custom name.
3. On "Deploy", call `mcp__n8n-mcp__n8n_deploy_template` with `templateId`.
   - Defaults: `autoFix: true`, `autoUpgradeVersions: true`, `stripCredentials: true`.
4. Display the deployment result:
   ```
   Template deployed

   | Field | Value |
   |-------|-------|
   | Workflow ID | {id} |
   | Name | {name} |
   | Auto-fixes | {applied fixes} |
   | Required credentials | {list} |

   Configure credentials in the n8n UI, then activate.
   ```
5. Footer: "Validate: `/n8n-validate check {id}` | Run: `/n8n-run test {id}`"
