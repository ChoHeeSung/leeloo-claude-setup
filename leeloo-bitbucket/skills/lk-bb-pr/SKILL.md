---
name: lk-bb-pr
description: "Bitbucket PR 관리 (목록/조회/생성/머지/댓글). /lk-bb-pr [list|get|create|merge|comment] <repo_slug>"
user_invocable: true
argument-hint: "[list|get|create|merge|comment] <repo_slug> [pr_id]"
---

# /lk-bb-pr — Pull Request 관리

Bitbucket 저장소의 Pull Request를 관리합니다.

## 서브커맨드

```
/lk-bb-pr list <repo_slug>                    — PR 목록 (OPEN 상태)
/lk-bb-pr list <repo_slug> --all              — PR 목록 (전체 상태)
/lk-bb-pr get <repo_slug> <pr_id>             — PR 상세 + 댓글
/lk-bb-pr create <repo_slug>                  — PR 생성 (대화형)
/lk-bb-pr merge <repo_slug> <pr_id>           — PR 머지
/lk-bb-pr comment <repo_slug> <pr_id> <text>  — PR에 댓글 추가
```

## Procedure

### 사전 체크

Read 도구로 `~/.claude/leeloo-bitbucket.local.md` 읽기.
- 파일이 없거나 토큰이 비어있으면: "Bitbucket 연결이 설정되지 않았습니다. `/lk-bb-setup install`로 초기 설정을 진행하세요." 안내 후 중단.
- YAML frontmatter에서 `bitbucket_user_email`, `bitbucket_api_token`, `bitbucket_workspace`를 파싱.
- 이후 curl 호출 시 `-u "{이메일}:{토큰}"` 형식으로 사용.
- `bb-fetch-all.sh` 호출 시 환경변수로 전달: `BITBUCKET_USER_EMAIL="{이메일}" BITBUCKET_API_TOKEN="{토큰}" "${CLAUDE_PLUGIN_ROOT}/scripts/bb-fetch-all.sh" ...`

### 인자 파싱

- `list <repo_slug> [--all]` → **list** 동작
- `get <repo_slug> <pr_id>` → **get** 동작
- `create <repo_slug>` → **create** 동작
- `merge <repo_slug> <pr_id>` → **merge** 동작
- `comment <repo_slug> <pr_id> <text>` → **comment** 동작

---

### list 동작

PR이 많을 수 있으므로 `bb-fetch-all.sh` 스크립트로 병렬 페이지네이션 처리합니다.

Bash로 실행:
```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/bb-fetch-all.sh" "/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/pullrequests" \
  --query "state=OPEN" \
  --jq-filter '{id: .id, title: .title, author: .author.display_name, source: .source.branch.name, dest: .destination.branch.name, state: .state, created: .created_on, updated: .updated_on}'
```
- `--all` 플래그 시 `--query` 생략 (전체 상태).

결과 표시:

```
PR 목록: {repo_slug} — 총 {N}개

| # | ID | 제목 | 작성자 | 소스 → 대상 | 상태 | 생성일 |
|---|-----|------|--------|------------|------|-------|
| 1 | 42 | Fix login | user | feat → main | OPEN | 2026-03-20 |
| ... | | | | | | |
```

---

### get 동작

PR 상세와 댓글을 **병렬로** 가져옵니다:

```bash
# PR 상세 (Bash 호출 1)
curl -s -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/pullrequests/{pr_id}" | jq '{id: .id, title: .title, description: .description, author: .author.display_name, source: .source.branch.name, dest: .destination.branch.name, state: .state, reviewers: [.reviewers[].display_name], created: .created_on, updated: .updated_on, close_source: .close_source_branch, merge_commit: .merge_commit}'
```
```bash
# PR 댓글 (Bash 호출 2, 동시 실행) — 댓글이 100개 초과 시 bb-fetch-all.sh 사용
"${CLAUDE_PLUGIN_ROOT}/scripts/bb-fetch-all.sh" "/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/pullrequests/{pr_id}/comments" \
  --jq-filter '{id: .id, user: .user.display_name, content: .content.raw, created: .created_on, inline: .inline}'
```

결과 표시:
```
PR #{pr_id}: {title}

| 항목 | 값 |
|------|-----|
| 작성자 | {author} |
| 소스 → 대상 | {source} → {dest} |
| 상태 | {state} |
| 리뷰어 | {reviewers} |
| 생성일 | {created} |

### 설명
{description}

### 댓글 ({N}개)
- **{user}** ({date}): {content}
- ...
```

---

### create 동작

1. AskUserQuestion:
   - Header: "소스 브랜치"
   - Question: "PR의 소스 브랜치를 입력하세요:"
   - Options: 직접 입력

2. AskUserQuestion:
   - Header: "대상 브랜치"
   - Question: "PR의 대상 브랜치를 입력하세요:"
   - Options: "main (기본)", "develop", 직접 입력

3. AskUserQuestion:
   - Header: "PR 제목"
   - Question: "PR 제목을 입력하세요:"
   - Options: 직접 입력

4. AskUserQuestion:
   - Header: "PR 설명"
   - Question: "PR 설명을 입력하세요 (선택):"
   - Options: "건너뛰기", 직접 입력

5. Bash로 실행:
   ```bash
   curl -s -X POST -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" -H "Content-Type: application/json" \
     "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/pullrequests" \
     -d '{
       "title": "{제목}",
       "description": "{설명}",
       "source": {"branch": {"name": "{소스브랜치}"}},
       "destination": {"branch": {"name": "{대상브랜치}"}},
       "close_source_branch": true
     }'
   ```

6. 결과 표시:
   ```
   PR 생성 완료

   | 항목 | 값 |
   |------|-----|
   | PR ID | #{id} |
   | 제목 | {title} |
   | 소스 → 대상 | {source} → {dest} |
   | URL | {html_url} |
   ```

---

### merge 동작

1. AskUserQuestion:
   - Header: "PR 머지"
   - Question: "PR #{pr_id}를 머지합니다. 머지 전략을 선택하세요:"
   - Options:
     - "merge commit (기본)"
     - "squash"

2. Bash로 실행:
   ```bash
   curl -s -X POST -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" -H "Content-Type: application/json" \
     "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/pullrequests/{pr_id}/merge" \
     -d '{"type": "pullrequest", "merge_strategy": "{merge_commit|squash}", "close_source_branch": true}'
   ```

3. 결과 표시:
   - 성공: "PR #{pr_id} 머지 완료. 소스 브랜치 삭제됨."
   - 실패: 에러 메시지 표시 (충돌, 리뷰 미승인 등)

---

### comment 동작

1. Bash로 실행:
   ```bash
   curl -s -X POST -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" -H "Content-Type: application/json" \
     "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/pullrequests/{pr_id}/comments" \
     -d '{"content": {"raw": "{text}"}}'
   ```

2. 결과 표시: "PR #{pr_id}에 댓글 추가 완료."
