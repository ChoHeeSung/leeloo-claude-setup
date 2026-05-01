---
name: lk-bb-commit
description: |
  Bitbucket 저장소의 커밋 이력과 diff 조회.
  커밋 이력, 커밋 로그, diff, 변경사항, 비트버킷, commit history, commit log, diff, bitbucket
user_invocable: true
argument-hint: "[list|diff] <repo_slug> [branch|commit_hash]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-bb-commit — Commit History and Diff

Look up commit history and diffs for a Bitbucket repository.

## Subcommands

```
/lk-bb-commit list <repo_slug>                 — Recent commits (default branch, up to 30)
/lk-bb-commit list <repo_slug> <branch>        — Commits for a specific branch
/lk-bb-commit diff <repo_slug> <commit_hash>   — Diff for a specific commit
/lk-bb-commit diff <repo_slug> <src>..<dst>    — Diff between two commits/branches
```

## Procedure

### Pre-check

Use the Read tool to load `~/.claude/leeloo-bitbucket.local.md`.
- If the file is missing or the token is empty, instruct: "Bitbucket connection is not configured. Run `/lk-bb-setup install` for initial setup." Then stop.
- Parse `bitbucket_user_email`, `bitbucket_api_token`, `bitbucket_workspace` from the YAML frontmatter.
- Use `-u "{email}:{token}"` for subsequent curl calls.

### Argument parsing

- `list <repo_slug> [branch]` → **list** action
- `diff <repo_slug> <commit_hash>` → **diff** action
- `diff <repo_slug> <src>..<dst>` → **compare** action

---

### list action

Run via Bash:
```bash
curl -s -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/commits/{branch}?pagelen=30" | jq '[.values[] | {hash: .hash[0:7], full_hash: .hash, message: (.message | split("\n")[0]), author: .author.raw, date: .date}]'
```
- If branch is unspecified, omit the `/{branch}` segment from the URL (default branch is used).

Display the result:
```
Commit history: {repo_slug} ({branch})

| # | Hash | Message | Author | Date |
|---|------|---------|--------|------|
| 1 | abc1234 | Fix login bug | user | 2026-03-20 |
| ... | | | | |
```

---

### diff action (single commit)

Run via Bash:
```bash
curl -s -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/diff/{commit_hash}"
```

Display the result:
```
Commit diff: {commit_hash}

{diff content}
```

- If the diff is too long (over 500 lines), summarize it and ask via AskUserQuestion: "Show the full diff?"

---

### compare action (compare two commits/branches)

Parse the `<src>..<dst>` form to split src and dst.

Run via Bash:
```bash
curl -s -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/diff/{dst}..{src}"
```

Display the result:
```
Branch comparison: {src} → {dst}

{diff content}
```
