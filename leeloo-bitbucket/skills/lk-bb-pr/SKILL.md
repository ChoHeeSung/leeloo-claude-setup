---
name: lk-bb-pr
description: |
  Bitbucket Pull Request 관리 — 목록·조회·생성·머지·댓글.
  PR, 풀리퀘스트, 풀리퀘, 머지, 코드리뷰, 풀리퀘 올려, pull request, merge, code review, bitbucket
user_invocable: true
argument-hint: "[list|get|create|merge|comment] <repo_slug> [pr_id]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-bb-pr — Pull Request Management

Manage pull requests in a Bitbucket repository.

## Subcommands

```
/lk-bb-pr list <repo_slug>                    — PR list (OPEN state)
/lk-bb-pr list <repo_slug> --all              — PR list (all states)
/lk-bb-pr get <repo_slug> <pr_id>             — PR detail + comments
/lk-bb-pr create <repo_slug>                  — Create PR (interactive)
/lk-bb-pr merge <repo_slug> <pr_id>           — Merge PR
/lk-bb-pr comment <repo_slug> <pr_id> <text>  — Add a comment to a PR
```

## Procedure

### Pre-check

Use the Read tool to load `~/.claude/leeloo-bitbucket.local.md`.
- If the file is missing or the token is empty, instruct: "Bitbucket connection is not configured. Run `/lk-bb-setup install` for initial setup." Then stop.
- Parse `bitbucket_user_email`, `bitbucket_api_token`, `bitbucket_workspace` from the YAML frontmatter.
- Use `-u "{email}:{token}"` for subsequent curl calls.
- For `bb-fetch-all.sh` calls, pass via env vars: `BITBUCKET_USER_EMAIL="{email}" BITBUCKET_API_TOKEN="{token}" "${CLAUDE_PLUGIN_ROOT}/scripts/bb-fetch-all.sh" ...`

### Argument parsing

- `list <repo_slug> [--all]` → **list** action
- `get <repo_slug> <pr_id>` → **get** action
- `create <repo_slug>` → **create** action
- `merge <repo_slug> <pr_id>` → **merge** action
- `comment <repo_slug> <pr_id> <text>` → **comment** action

---

### list action (Haiku Task)

PRs may be numerous, so use `bb-fetch-all.sh` for parallel pagination. Delegate JSON → markdown table formatting to a Haiku sub-agent.

Run via Bash:
```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/bb-fetch-all.sh" "/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/pullrequests" \
  --query "state=OPEN" \
  --jq-filter '{id: .id, title: .title, author: .author.display_name, source: .source.branch.name, dest: .destination.branch.name, state: .state, created: .created_on, updated: .updated_on}'
```
- With `--all` flag, omit `--query` (all states).

**Agent tool invocation (format bb-fetch-all.sh output):**
- `subagent_type`: `task`
- `task_model`: `haiku`
- `prompt`:

```
Convert the Bitbucket PR list JSON below into a markdown table.

## Input
### Repository
{repo_slug}

### JSON array
{json_result}

## Output format
```
PR list: {repo_slug} — total {N}

| # | ID | Title | Author | Source → Dest | State | Created |
|---|-----|-------|--------|---------------|-------|---------|
| 1 | 42 | Fix login | user | feat → main | OPEN | 2026-03-20 |
```

## Rules
- Include every item in the JSON array; do not omit any.
- Format the created date as YYYY-MM-DD.
- Truncate titles longer than 60 chars with an ellipsis.
- Mark fields not present in input as "-".
```

**Result verification (main session):**
- [ ] Table row count = JSON array length
- [ ] IDs/titles match the source
- [ ] No hallucinated PRs not in the input

**Fallback on quality failure:** main session generates the table directly.

---

### get action

Fetch PR detail and comments **in parallel**:

```bash
# PR detail (Bash call 1)
curl -s -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/pullrequests/{pr_id}" | jq '{id: .id, title: .title, description: .description, author: .author.display_name, source: .source.branch.name, dest: .destination.branch.name, state: .state, reviewers: [.reviewers[].display_name], created: .created_on, updated: .updated_on, close_source: .close_source_branch, merge_commit: .merge_commit}'
```
```bash
# PR comments (Bash call 2, run concurrently) — use bb-fetch-all.sh when comments exceed 100
"${CLAUDE_PLUGIN_ROOT}/scripts/bb-fetch-all.sh" "/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/pullrequests/{pr_id}/comments" \
  --jq-filter '{id: .id, user: .user.display_name, content: .content.raw, created: .created_on, inline: .inline}'
```

**Result formatting (Haiku Task):**

Delegate the integration of PR detail JSON + comments JSON into a unified markdown to a Haiku sub-agent.

**Agent tool invocation:**
- `subagent_type`: `task`
- `task_model`: `haiku`
- `prompt`:

```
Render the Bitbucket PR detail and comments JSON below as a unified markdown view.

## Input
### PR detail
{pr_detail_json}

### Comments list
{comments_json}

## Output format
```
PR #{pr_id}: {title}

| Field | Value |
|-------|-------|
| Author | {author} |
| Source → Dest | {source} → {dest} |
| State | {state} |
| Reviewers | {reviewers} |
| Created | {created} |

### Description
{description}

### Comments ({N})
- **{user}** ({date}): {content}
```

## Rules
- Display every comment in ascending creation order.
- Use "-" or omit the section for missing fields.
- Do not summarize or alter the body content.
```

**Result verification (main session):**
- [ ] All PR meta fields are included
- [ ] Comment count matches the input
- [ ] Description/comment bodies match the source

---

### create action

1. AskUserQuestion:
   - Header: "Source branch"
   - Question: "Enter the PR source branch:"
   - Options: free input

2. AskUserQuestion:
   - Header: "Destination branch"
   - Question: "Enter the PR destination branch:"
   - Options: "main (default)", "develop", free input

3. AskUserQuestion:
   - Header: "PR title"
   - Question: "Enter the PR title:"
   - Options: free input

4. AskUserQuestion:
   - Header: "PR description"
   - Question: "Enter a PR description (optional):"
   - Options: "Skip", free input

5. Run via Bash:
   ```bash
   curl -s -X POST -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" -H "Content-Type: application/json" \
     "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/pullrequests" \
     -d '{
       "title": "{title}",
       "description": "{description}",
       "source": {"branch": {"name": "{source_branch}"}},
       "destination": {"branch": {"name": "{dest_branch}"}},
       "close_source_branch": true
     }'
   ```

6. Display the result:
   ```
   PR created

   | Field | Value |
   |-------|-------|
   | PR ID | #{id} |
   | Title | {title} |
   | Source → Dest | {source} → {dest} |
   | URL | {html_url} |
   ```

---

### merge action

1. AskUserQuestion:
   - Header: "Merge PR"
   - Question: "Merge PR #{pr_id}. Choose merge strategy:"
   - Options:
     - "merge commit (default)"
     - "squash"

2. Run via Bash:
   ```bash
   curl -s -X POST -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" -H "Content-Type: application/json" \
     "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/pullrequests/{pr_id}/merge" \
     -d '{"type": "pullrequest", "merge_strategy": "{merge_commit|squash}", "close_source_branch": true}'
   ```

3. Display the result:
   - Success: "PR #{pr_id} merged. Source branch deleted."
   - Failure: display the error (conflict, missing approvals, etc.)

---

### comment action

1. Run via Bash:
   ```bash
   curl -s -X POST -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" -H "Content-Type: application/json" \
     "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/pullrequests/{pr_id}/comments" \
     -d '{"content": {"raw": "{text}"}}'
   ```

2. Display the result: "Comment added to PR #{pr_id}."
