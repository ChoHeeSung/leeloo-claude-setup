---
name: lk-bb-branch
description: |
  Bitbucket 저장소 브랜치 관리 — 목록 조회·생성·삭제.
  브랜치, 브랜치 생성, 브랜치 삭제, 브랜치 목록, 비트버킷, branch, create branch, delete branch, bitbucket
user_invocable: true
argument-hint: "[list|create|delete] <repo_slug> [branch_name]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-bb-branch — Branch Management

Manages branches in Bitbucket repositories.

## Subcommands

```
/lk-bb-branch list <repo_slug>                          — List branches
/lk-bb-branch create <repo_slug> <branch_name>          — Create branch (default source: main)
/lk-bb-branch create <repo_slug> <branch_name> <source> — Create branch from a specified source
/lk-bb-branch delete <repo_slug> <branch_name>          — Delete branch
```

## Procedure

### Pre-check

Use the Read tool to load `~/.claude/leeloo-bitbucket.local.md`.
- If the file is missing or the token is empty, instruct: "Bitbucket connection is not configured. Run `/lk-bb-setup install` for initial setup." Then stop.
- Parse `bitbucket_user_email`, `bitbucket_api_token`, `bitbucket_workspace` from the YAML frontmatter.
- Use `-u "{email}:{token}"` for subsequent curl calls.
- For `bb-fetch-all.sh` calls, pass via env vars: `BITBUCKET_USER_EMAIL="{email}" BITBUCKET_API_TOKEN="{token}" "${CLAUDE_PLUGIN_ROOT}/scripts/bb-fetch-all.sh" ...`

### Argument parsing

- `list <repo_slug>` → **list** action
- `create <repo_slug> <branch_name> [source]` → **create** action
- `delete <repo_slug> <branch_name>` → **delete** action
- If repo_slug is missing, prompt for input via AskUserQuestion.

---

### list action

Branches may be numerous, so use `bb-fetch-all.sh` for parallel pagination.

Run via Bash:
```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/bb-fetch-all.sh" "/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/refs/branches" \
  --jq-filter '{name: .name, hash: .target.hash[0:7], date: .target.date, author: .target.author.raw}'
```

Display the result:

```
Branch list: {repo_slug} — total {N}

| # | Branch | Latest commit | Author | Date |
|---|--------|---------------|--------|------|
| 1 | main | abc1234 | user | 2026-03-20 |
| ... | | | | |
```

---

### create action

1. If source branch is unspecified, default to `main`.

2. Run via Bash:
   ```bash
   curl -s -X POST -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" -H "Content-Type: application/json" \
     "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/refs/branches" \
     -d '{"name": "{branch_name}", "target": {"hash": "{source}"}}'
   ```
   - If source is a branch name, first look up the latest commit hash of that branch:
     ```bash
     curl -s -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/refs/branches/{source}" | jq -r '.target.hash'
     ```

3. Display the result:
   ```
   Branch created

   | Field | Value |
   |-------|-------|
   | Repository | {repo_slug} |
   | Branch | {branch_name} |
   | Source | {source} |
   ```

---

### delete action

1. AskUserQuestion:
   - Header: "Delete branch"
   - Question: "Delete branch `{repo_slug}/{branch_name}`. Continue?"
   - Options: "Delete", "Cancel"
   - If "Cancel" is selected, stop.

2. Run via Bash:
   ```bash
   curl -s -w "\nHTTP_STATUS:%{http_code}" -X DELETE -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" \
     "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/refs/branches/{branch_name}"
   ```

3. HTTP 204 → "Branch `{branch_name}` deleted."
   Other → display the error message.
