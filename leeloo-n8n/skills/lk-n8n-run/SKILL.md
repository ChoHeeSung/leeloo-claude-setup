---
name: lk-n8n-run
description: |
  n8n 워크플로우 실행 및 실행 기록(executions) 조회·관리.
  워크플로우 실행, 실행 기록, 실행 로그, 테스트 실행, n8n run, n8n execution, workflow run, test workflow
user_invocable: true
argument-hint: "[test|list|get|delete] [args]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-n8n-run — Workflow Execution and Run History

Run workflows and inspect/manage execution history.

## Subcommands

```
/lk-n8n-run test <id>            — Run workflow (trigger type auto-detected)
/lk-n8n-run list [workflow-id]   — List execution history
/lk-n8n-run get <execution-id>   — Execution detail
/lk-n8n-run delete <execution-id> — Delete an execution
```

## Procedure

### MCP pre-check

1. Call `mcp__n8n-mcp__n8n_health_check`.
   - On failure, instruct: "n8n MCP server is not configured. Run `/n8n-setup install` first." Then stop.

### Argument parsing

- `test <id>` → **test** action
- No args or `list` → **list** action
- `get <execution-id>` → **get** action
- `delete <execution-id>` → **delete** action

---

### test action

1. Call `mcp__n8n-mcp__n8n_test_workflow` with `workflowId`.
   - Trigger type is auto-detected.
   - For webhook trigger, ask for payload via AskUserQuestion.
   - For chat trigger, ask for the message via AskUserQuestion.
2. Display the result:
   ```
   Workflow execution result

   | Field | Value |
   |-------|-------|
   | Workflow | {name} (ID: {id}) |
   | Status | Success / Failure |
   | Duration | {duration} |
   ```
3. On failure, display error details.
4. Footer: "History: `/lk-n8n-run list {id}` | Validation: `/n8n-validate check {id}`"

---

### list action

1. Call `mcp__n8n-mcp__n8n_executions` with `action: "list"`.
   - When workflow-id is given, apply `workflowId` filter.
2. Display the execution history as a table:
   ```
   | Execution ID | Workflow | Status | Date |
   |--------------|----------|--------|------|
   ```

---

### get action

1. Call `mcp__n8n-mcp__n8n_executions` with `action: "get"`, `id`, `mode: "summary"`.
2. Display execution details:
   - Per-node input/output summary
   - Highlight error nodes
3. If errors exist, recall with `mode: "error"` to display error debugging info.

---

### delete action

1. AskUserQuestion — "Delete execution {id}? (Delete/Cancel)"
2. On "Delete", call `mcp__n8n-mcp__n8n_executions` with `action: "delete"`, `id`.
3. Print delete confirmation.
