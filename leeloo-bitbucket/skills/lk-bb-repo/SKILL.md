---
name: lk-bb-repo
description: |
  Bitbucket Cloud 워크스페이스 저장소 관리 — 목록·조회·생성·삭제.
  레포지토리, 저장소, 레포 생성, 레포 삭제, 워크스페이스, 비트버킷, repository, repo, workspace, bitbucket
user_invocable: true
argument-hint: "[list|get|create|delete] [repo_slug]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-bb-repo — Repository Management

Manage repositories in a Bitbucket Cloud workspace.

## Subcommands

```
/lk-bb-repo list                — Repository list (all, with parallel pagination)
/lk-bb-repo list <keyword>     — Repository search (filter by name)
/lk-bb-repo get <repo_slug>    — Repository detail
/lk-bb-repo create <repo_slug> — Create repository
/lk-bb-repo delete <repo_slug> — Delete repository (confirmation required)
```

## Procedure

### Pre-check

Use the Read tool to load `~/.claude/leeloo-bitbucket.local.md`.
- If the file is missing or the token is empty, instruct: "Bitbucket connection is not configured. Run `/lk-bb-setup install` for initial setup." Then stop.
- Parse `bitbucket_user_email`, `bitbucket_api_token`, `bitbucket_workspace` from the YAML frontmatter.
- Use `-u "{email}:{token}"` for subsequent curl calls.
- For `bb-fetch-all.sh` calls, pass via env vars: `BITBUCKET_USER_EMAIL="{email}" BITBUCKET_API_TOKEN="{token}" "${CLAUDE_PLUGIN_ROOT}/scripts/bb-fetch-all.sh" ...`

### Argument parsing

Parse the subcommand from user input:
- No args or `list` → **list** action
- `list <keyword>` → **list** action (with keyword filter)
- `get <repo_slug>` → **get** action
- `create <repo_slug>` → **create** action
- `delete <repo_slug>` → **delete** action

---

### list action

Repositories may be numerous, so use `bb-fetch-all.sh` for parallel pagination.

Run via Bash:
```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/bb-fetch-all.sh" "/repositories/$BITBUCKET_WORKSPACE" \
  --jq-filter '{name: .name, slug: .slug, project: .project.key, updated: .updated_on, is_private: .is_private}'
```

If a keyword is given, filter the result JSON to entries whose name/slug contain it.

Display the result as a table:

```
Bitbucket repository list ({workspace}) — total {N}

| # | Project | Repository | Slug | Public | Last updated |
|---|---------|------------|------|--------|--------------|
| 1 | PROJ | My Repo | my-repo | public/private | 2026-03-20 |
| ... | | | | | |
```

---

### get action

Run via Bash:
```bash
curl -s -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}" | jq '{name: .name, slug: .slug, project: .project.key, description: .description, language: .language, is_private: .is_private, created: .created_on, updated: .updated_on, size: .size, mainbranch: .mainbranch.name, clone_ssh: (.links.clone[] | select(.name=="ssh") | .href), clone_https: (.links.clone[] | select(.name=="https") | .href)}'
```

Display the result:
```
Repository detail: {repo_slug}

| Field | Value |
|-------|-------|
| Name | {name} |
| Project | {project} |
| Description | {description} |
| Language | {language} |
| Main branch | {mainbranch} |
| Visibility | public / private |
| Created | {created} |
| Last updated | {updated} |
| Clone (SSH) | {ssh_url} |
| Clone (HTTPS) | {https_url} |
```

---

### create action

1. AskUserQuestion:
   - Header: "Create repository"
   - Question: "Creating a repository. Confirm the following."
   - Options:
     - "Private (default)" — is_private: true
     - "Public" — is_private: false

2. AskUserQuestion:
   - Header: "Project"
   - Question: "Which project should it belong to? (enter project key, e.g., PROJ)"
   - Options: free input, "Default project"

3. Run via Bash:
   ```bash
   curl -s -X POST -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" -H "Content-Type: application/json" \
     "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}" \
     -d '{"scm": "git", "is_private": {true/false}, "project": {"key": "{project_key}"}}'
   ```

4. Display the result:
   ```
   Repository created: {repo_slug}

   | Field | Value |
   |-------|-------|
   | Slug | {repo_slug} |
   | Project | {project_key} |
   | Visibility | private/public |
   | Clone | git clone {ssh_url} |
   ```

---

### delete action

1. AskUserQuestion:
   - Header: "Delete repository"
   - Question: "Delete repository `{repo_slug}`. This cannot be undone. Continue?"
   - Options: "Delete", "Cancel"
   - If "Cancel" is selected, stop.

2. Run via Bash:
   ```bash
   curl -s -w "\nHTTP_STATUS:%{http_code}" -X DELETE -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" \
     "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}"
   ```

3. HTTP 204 → "Repository `{repo_slug}` deleted."
   Other → display the error message.
