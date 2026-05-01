---
name: lk-n8n-workflow
description: |
  n8n 워크플로우 CRUD 관리 — 생성·조회·목록·수정·삭제.
  워크플로우, 워크플로우 생성, 워크플로우 수정, 워크플로우 삭제, 자동화, n8n workflow, create workflow, automation, crud
user_invocable: true
argument-hint: "[create|get|list|update|delete] [args]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-n8n-workflow — Workflow Management

Create, inspect, modify, and delete n8n workflows.

## Subcommands

```
/lk-n8n-workflow list                    — List workflows
/lk-n8n-workflow get <id>                — Workflow detail
/lk-n8n-workflow create <name>           — Create a new workflow
/lk-n8n-workflow update <id>             — Modify workflow (interactive)
/lk-n8n-workflow delete <id>             — Delete workflow
```

## Procedure

### MCP pre-check

1. Call `mcp__n8n-mcp__n8n_health_check`.
   - On failure, instruct: "n8n MCP server is not configured. Run `/n8n-setup install` first." Then stop.

### Argument parsing

Parse the subcommand from user input:
- No args or `list` → **list** action
- `get <id>` → **get** action
- `create <name>` → **create** action
- `update <id>` → **update** action
- `delete <id>` → **delete** action

---

### list action

1. Call `mcp__n8n-mcp__n8n_list_workflows`.
2. Display the result as a table:
   ```
   | ID | Name | Active | Tags | Updated |
   |----|------|--------|------|---------|
   ```
3. Footer: "Detail: `/lk-n8n-workflow get <id>`"

---

### get action

1. Call `mcp__n8n-mcp__n8n_get_workflow` with `id`, `mode: "details"`.
2. Display structured workflow info:
   - Basic info (name, ID, active state, created/updated)
   - Node list (name, type)
   - Connection structure summary
3. Footer: "Run: `/n8n-run test <id>` | Validate: `/n8n-validate check <id>`"

---

### create action

1. Build a default workflow structure using the user-provided name.
2. AskUserQuestion — "Choose the workflow trigger type:"
   - Manual Trigger (default)
   - Webhook Trigger
   - Schedule Trigger
   - Chat Trigger
3. Call `mcp__n8n-mcp__n8n_create_workflow` with the start node matching the chosen trigger.
4. Display the created workflow ID and info.
5. Footer: "Add nodes: `/lk-n8n-workflow update <id>` | Search nodes: `/n8n-node search <keyword>`"

---

### update action

1. Look up the current workflow via `mcp__n8n-mcp__n8n_get_workflow`.
2. Display the current structure to the user.
3. AskUserQuestion — "What change do you want to make?"
   - Add node
   - Remove node
   - Change node settings
   - Rename workflow
   - Toggle active/inactive
4. Call `mcp__n8n-mcp__n8n_update_partial_workflow` based on the choice.
5. Display the modification result.

---

### delete action

1. Look up the workflow info via `mcp__n8n-mcp__n8n_get_workflow` to confirm the name.
2. AskUserQuestion — "Delete workflow '{name}' (ID: {id})? This cannot be undone. (Delete/Cancel)"
3. On "Delete", call `mcp__n8n-mcp__n8n_delete_workflow`.
4. Print delete confirmation.
