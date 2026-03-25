---
name: lk-bb-commit
description: "Bitbucket 커밋 이력 및 diff 조회. /lk-bb-commit [list|diff] <repo_slug>"
user_invocable: true
argument-hint: "[list|diff] <repo_slug> [branch|commit_hash]"
---

# /lk-bb-commit — 커밋 이력 및 Diff

Bitbucket 저장소의 커밋 이력과 diff를 조회합니다.

## 서브커맨드

```
/lk-bb-commit list <repo_slug>                 — 최근 커밋 목록 (기본 브랜치, 최대 30개)
/lk-bb-commit list <repo_slug> <branch>        — 특정 브랜치 커밋 목록
/lk-bb-commit diff <repo_slug> <commit_hash>   — 특정 커밋의 diff
/lk-bb-commit diff <repo_slug> <src>..<dst>    — 두 커밋/브랜치 간 diff
```

## Procedure

### 사전 체크

Read 도구로 `~/.claude/leeloo-bitbucket.local.md` 읽기.
- 파일이 없거나 토큰이 비어있으면: "Bitbucket 연결이 설정되지 않았습니다. `/lk-bb-setup install`로 초기 설정을 진행하세요." 안내 후 중단.
- YAML frontmatter에서 `bitbucket_user_email`, `bitbucket_api_token`, `bitbucket_workspace`를 파싱.
- 이후 curl 호출 시 `-u "{이메일}:{토큰}"` 형식으로 사용.

### 인자 파싱

- `list <repo_slug> [branch]` → **list** 동작
- `diff <repo_slug> <commit_hash>` → **diff** 동작
- `diff <repo_slug> <src>..<dst>` → **compare** 동작

---

### list 동작

Bash로 실행:
```bash
curl -s -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/commits/{branch}?pagelen=30" | jq '[.values[] | {hash: .hash[0:7], full_hash: .hash, message: (.message | split("\n")[0]), author: .author.raw, date: .date}]'
```
- branch 미지정 시 URL에서 `/{branch}` 부분 생략 (기본 브랜치 사용).

결과 표시:
```
커밋 이력: {repo_slug} ({branch})

| # | 해시 | 메시지 | 작성자 | 날짜 |
|---|------|--------|--------|------|
| 1 | abc1234 | Fix login bug | user | 2026-03-20 |
| ... | | | | |
```

---

### diff 동작 (단일 커밋)

Bash로 실행:
```bash
curl -s -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/diff/{commit_hash}"
```

결과 표시:
```
커밋 diff: {commit_hash}

{diff 내용}
```

- diff가 너무 길면 (500줄 초과) 요약 후 "전체 diff를 보시겠습니까?" AskUserQuestion.

---

### compare 동작 (두 커밋/브랜치 비교)

`<src>..<dst>` 형식을 파싱하여 src, dst를 분리합니다.

Bash로 실행:
```bash
curl -s -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/diff/{dst}..{src}"
```

결과 표시:
```
브랜치 비교: {src} → {dst}

{diff 내용}
```
