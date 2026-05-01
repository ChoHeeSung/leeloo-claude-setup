---
name: lk-n8n-setup
description: |
  n8n MCP 서버 연결 상태 확인 및 설치 가이드.
  n8n 설정, n8n 설치, MCP 서버, 연결 확인, n8n setup, n8n install, mcp server, health check
user_invocable: true
argument-hint: "[status|install]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-n8n-setup — n8n MCP Connection Management

Verify the n8n MCP server connection, and guide installation when missing.

## Subcommands

```
/lk-n8n-setup           — Check MCP connection status (default = status)
/lk-n8n-setup status    — Show MCP connection status + n8n instance info
/lk-n8n-setup install   — Show n8n MCP server install guide
```

## Procedure

### Argument parsing

Parse the subcommand from user input:
- No args or `status` → **status** action
- `install` → **install** action

---

### status action

1. **Verify MCP connection**: call `mcp__n8n-mcp__n8n_health_check` with `mode: "diagnostic"`.

2. **Display result**:
   - Success:
     ```
     n8n MCP connection status

     | Field | Status |
     |-------|--------|
     | MCP server | Connected |
     | n8n instance | {URL} |
     | API version | {version} |

     n8n MCP is operating normally.
     Try /n8n-workflow list to view workflows.
     ```
   - Failure:
     ```
     n8n MCP connection status

     | Field | Status |
     |-------|--------|
     | MCP server | Connection failed |

     Run /lk-n8n-setup install for the install guide.
     ```

---

### install action

1. **Enter n8n connection info**: ask two AskUserQuestion items at once:
   - "Enter the n8n API URL (e.g., http://localhost:5678):" — Header: "API URL"
     - Options: "http://localhost:5678 (default)", free input
   - "Enter the n8n API Key:" — Header: "API Key"
     - Options: "Set later", free input

2. **Choose install scope**: AskUserQuestion — "Where should the MCP server be configured?"
   - Header: "Install scope"
   - Options:
     - "Global (recommended)" — Description: "Adds to ~/.claude.json. Available across all projects"
     - "Project" — Description: "Adds to the current project's .mcp.json. Shared with the team (excluding API Key)"

3. **Apply settings**:

   **For Global**: run via Bash:
   ```bash
   claude mcp add n8n-mcp --scope user -e MCP_MODE=stdio -e N8N_API_URL={entered_URL} -e N8N_API_KEY={entered_KEY} -- npx n8n-mcp
   ```

   **For Project**: run via Bash:
   ```bash
   claude mcp add n8n-mcp --scope project -e MCP_MODE=stdio -e N8N_API_URL={entered_URL} -e N8N_API_KEY={entered_KEY} -- npx n8n-mcp
   ```

   - When API Key is "Set later": omit `-e N8N_API_KEY=` and include manual setup instructions in the guidance.

4. **Result summary**:
   ```
   n8n MCP server setup complete

   | Field | Value |
   |-------|-------|
   | Scope | Global / Project |
   | API URL | {URL} |
   | API Key | Set / Not set |

   Restart Claude Code, then run /lk-n8n-setup status to verify the connection.

   Issue API Key: n8n web UI → Settings → API → Create API Key
   ```
