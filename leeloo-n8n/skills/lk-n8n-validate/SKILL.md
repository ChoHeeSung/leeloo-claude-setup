---
name: lk-n8n-validate
description: |
  n8n 워크플로우 구조·연결·표현식 검증 및 자동 수정(autofix).
  워크플로우 검증, 자동수정, 린트, 워크플로우 점검, n8n validate, autofix, lint workflow, validate workflow
user_invocable: true
argument-hint: "[check|fix|lint] <workflow-id>"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-n8n-validate — Workflow Validation and Auto-fix

Validate workflow structure, connections, and expressions, and apply auto-fixes.

## Subcommands

```
/lk-n8n-validate check <id>    — Validate workflow (by ID)
/lk-n8n-validate fix <id>      — Auto-fix preview + apply
/lk-n8n-validate lint           — Validate by directly entering workflow JSON
```

## Procedure

### MCP pre-check

1. Call `mcp__n8n-mcp__n8n_health_check`.
   - On failure, instruct: "n8n MCP server is not configured. Run `/n8n-setup install` first." Then stop.

### Argument parsing

- No args → print usage and stop
- `check <id>` → **check** action
- `fix <id>` → **fix** action
- `lint` → **lint** action

---

### check action

1. Call `mcp__n8n-mcp__n8n_validate_workflow` with `id`, `options: { profile: "ai-friendly" }`.
2. Categorize and display the result:
   ```
   Workflow validation result (ID: {id})

   Errors ({n})
   - {error}

   Warnings ({n})
   - {warning}

   Suggestions ({n})
   - {suggestion}
   ```
3. If errors exist: "Auto-fix: `/lk-n8n-validate fix {id}`"

---

### fix action

1. Call `mcp__n8n-mcp__n8n_autofix_workflow` with `id`, `applyFixes: false` (preview).
2. Display fixable items:
   ```
   Auto-fix preview (ID: {id})

   | # | Fix type | Detail | Confidence |
   |---|----------|--------|------------|
   ```
3. AskUserQuestion — "Apply the fixes? (Apply/Cancel)"
4. On "Apply", recall with `applyFixes: true`.
5. Display the application result.
6. Footer: "Re-validate: `/lk-n8n-validate check {id}`"

---

### lint action

1. AskUserQuestion — "Enter the workflow JSON to validate:"
2. Parse the entered JSON.
3. Call `mcp__n8n-mcp__validate_workflow` with the `workflow` parameter (direct JSON validation).
4. Display the result in the same format as the check action.
