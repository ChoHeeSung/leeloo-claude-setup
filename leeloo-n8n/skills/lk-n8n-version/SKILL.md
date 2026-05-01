---
name: lk-n8n-version
description: |
  n8n 워크플로우 버전 이력 조회·롤백·이전 버전 정리(prune).
  버전 관리, 롤백, 버전 정리, 이전 버전, 워크플로우 히스토리, version, rollback, prune, workflow version
user_invocable: true
argument-hint: "[list|get|rollback|prune] <workflow-id>"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-n8n-version — Workflow Version Management

Inspect a workflow's version history, roll back to a previous version, or prune old versions.

## Subcommands

```
/lk-n8n-version list <workflow-id>              — Inspect version history
/lk-n8n-version get <workflow-id> <version-id>  — Detail of a specific version
/lk-n8n-version rollback <workflow-id>          — Roll back to a previous version
/lk-n8n-version prune <workflow-id>             — Prune old versions
```

## Procedure

### MCP pre-check

1. Call `mcp__n8n-mcp__n8n_health_check`.
   - On failure, instruct: "n8n MCP server is not configured. Run `/n8n-setup install` first." Then stop.

### Argument parsing

- No args → print usage and stop
- `list <workflow-id>` → **list** action
- `get <workflow-id> <version-id>` → **get** action
- `rollback <workflow-id>` → **rollback** action
- `prune <workflow-id>` → **prune** action

---

### list action

1. Call `mcp__n8n-mcp__n8n_workflow_versions` with `mode: "list"`, `workflowId`.
2. Display version list as a table:
   ```
   Workflow version history (ID: {workflow-id})

   | Version ID | Created | Node count |
   |------------|---------|------------|
   ```

---

### get action

1. Call `mcp__n8n-mcp__n8n_workflow_versions` with `mode: "get"`, `workflowId`, `versionId`.
2. Display the details of that version.

---

### rollback action

1. First call with `mode: "list"` to fetch and display the version list.
2. AskUserQuestion — "Choose a version to roll back to (enter the version ID):"
3. Call `mcp__n8n-mcp__n8n_workflow_versions` with `mode: "rollback"`, `workflowId`, `versionId`.
   - Use `validateBefore: true` to validate before rollback.
4. Display the rollback result (including whether a backup was created).

---

### prune action

1. AskUserQuestion — "How many recent versions should be retained? (default: 10)"
2. Call `mcp__n8n-mcp__n8n_workflow_versions` with `mode: "prune"`, `workflowId`, `maxVersions`.
3. Display the prune result (number of versions removed).
