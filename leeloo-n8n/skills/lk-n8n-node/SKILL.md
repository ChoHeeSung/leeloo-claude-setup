---
name: lk-n8n-node
description: |
  n8n 노드 검색·상세 조회·설정 검증.
  n8n 노드, 노드 검색, 노드 정보, 노드 검증, n8n node, node search, node info, validate node
user_invocable: true
argument-hint: "[search|info|check] <query|nodeType>"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-n8n-node — Node Search and Info

Search n8n nodes, look up details, and validate configurations.

## Subcommands

```
/lk-n8n-node search <keyword>       — Keyword search
/lk-n8n-node info <nodeType>        — Node details + documentation
/lk-n8n-node check <nodeType>       — Validate node configuration
```

## Procedure

### MCP pre-check

1. Call `mcp__n8n-mcp__n8n_health_check`.
   - On failure, instruct: "n8n MCP server is not configured. Run `/n8n-setup install` first." Then stop.

### Argument parsing

- No args → print usage and stop
- `search <keyword>` → **search** action
- `info <nodeType>` → **info** action
- `check <nodeType>` → **check** action

---

### search action (Haiku Task)

1. Call `mcp__n8n-mcp__search_nodes` with `query`, `includeExamples: true`.
2. Delegate MCP-response table formatting to a Haiku sub-agent.

**Agent tool invocation:**
- `subagent_type`: `task`
- `task_model`: `haiku`
- `prompt`:

```
Format the n8n node search result below as a markdown table.

## Input
### Query
{keyword}

### MCP response (search_nodes result)
{mcp_response_json}

## Output format
```
Node search result: "{keyword}"

| Node type | Name | Description | Source |
|-----------|------|-------------|--------|
| {nodeType} | {name} | {description} | {source} |

Detail: `/lk-n8n-node info <nodeType>`
```

## Rules
- Include every node from the MCP response; do not omit any.
- Mark fields not present in MCP response as "-".
- Truncate descriptions over 80 chars with an ellipsis.
```

**Result verification (main session):**
- [ ] MCP response node count = table row count
- [ ] No nodes hallucinated beyond the input

**Fallback on quality failure:** main session formats directly.

---

### info action (Haiku Task)

1. Call `mcp__n8n-mcp__get_node` with `nodeType`, `mode: "docs"`, `detail: "standard"`.
2. Delegate node-doc section structuring to a Haiku sub-agent.

**Agent tool invocation:**
- `subagent_type`: `task`
- `task_model`: `haiku`
- `prompt`:

```
Structure the n8n node documentation below for display.

## Input (get_node response)
{mcp_response_json}

## Output format
### Basic info
- Name: ...
- Type: ...
- Category: ...

### Main parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|

### Usage example
```json
{...}
```

Footer: "Validate config: `/lk-n8n-node check <nodeType>` | Template usage: `/n8n-template search`"

## Rules
- Use only information present in the MCP response.
- Skip missing sections (do not output empty sections).
```

**Result verification (main session):**
- [ ] Major fields (name, type, category) are not missing
- [ ] Examples match the response source

**Fallback on quality failure:** main session displays directly.

---

### check action

1. AskUserQuestion — "Enter the node config (JSON) to validate. Example: `{\"resource\": \"channel\", \"operation\": \"create\"}`"
2. Call `mcp__n8n-mcp__validate_node` with `nodeType`, `config`, `mode: "full"`.
3. Display validation result:
   ```
   Node config validation: {nodeType}

   Errors: {content}
   Warnings: {content}
   Suggestions: {content}
   ```
