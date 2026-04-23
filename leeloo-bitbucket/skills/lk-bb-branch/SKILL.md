---
name: lk-bb-branch
description: "Bitbucket 브랜치 관리(목록/생성/삭제)"
user_invocable: true
argument-hint: "[list|create|delete] <repo_slug> [branch_name]"
---

# /lk-bb-branch — 브랜치 관리

Bitbucket 저장소의 브랜치를 관리합니다.

## 서브커맨드

```
/lk-bb-branch list <repo_slug>                          — 브랜치 목록
/lk-bb-branch create <repo_slug> <branch_name>          — 브랜치 생성 (기본: main에서)
/lk-bb-branch create <repo_slug> <branch_name> <source> — 소스 브랜치 지정하여 생성
/lk-bb-branch delete <repo_slug> <branch_name>          — 브랜치 삭제
```

## Procedure

### 사전 체크

Read 도구로 `~/.claude/leeloo-bitbucket.local.md` 읽기.
- 파일이 없거나 토큰이 비어있으면: "Bitbucket 연결이 설정되지 않았습니다. `/lk-bb-setup install`로 초기 설정을 진행하세요." 안내 후 중단.
- YAML frontmatter에서 `bitbucket_user_email`, `bitbucket_api_token`, `bitbucket_workspace`를 파싱.
- 이후 curl 호출 시 `-u "{이메일}:{토큰}"` 형식으로 사용.
- `bb-fetch-all.sh` 호출 시 환경변수로 전달: `BITBUCKET_USER_EMAIL="{이메일}" BITBUCKET_API_TOKEN="{토큰}" "${CLAUDE_PLUGIN_ROOT}/scripts/bb-fetch-all.sh" ...`

### 인자 파싱

- `list <repo_slug>` → **list** 동작
- `create <repo_slug> <branch_name> [source]` → **create** 동작
- `delete <repo_slug> <branch_name>` → **delete** 동작
- repo_slug 누락 시: AskUserQuestion으로 입력 요청.

---

### list 동작

브랜치가 많을 수 있으므로 `bb-fetch-all.sh` 스크립트로 병렬 페이지네이션 처리합니다.

Bash로 실행:
```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/bb-fetch-all.sh" "/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/refs/branches" \
  --jq-filter '{name: .name, hash: .target.hash[0:7], date: .target.date, author: .target.author.raw}'
```

결과 표시:

```
브랜치 목록: {repo_slug} — 총 {N}개

| # | 브랜치 | 최신 커밋 | 작성자 | 날짜 |
|---|--------|----------|--------|------|
| 1 | main | abc1234 | user | 2026-03-20 |
| ... | | | | |
```

---

### create 동작

1. 소스 브랜치가 미지정이면 기본값 `main` 사용.

2. Bash로 실행:
   ```bash
   curl -s -X POST -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" -H "Content-Type: application/json" \
     "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/refs/branches" \
     -d '{"name": "{branch_name}", "target": {"hash": "{source}"}}'
   ```
   - source가 브랜치 이름인 경우, 먼저 해당 브랜치의 최신 커밋 해시를 조회:
     ```bash
     curl -s -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/refs/branches/{source}" | jq -r '.target.hash'
     ```

3. 결과 표시:
   ```
   브랜치 생성 완료

   | 항목 | 값 |
   |------|-----|
   | 저장소 | {repo_slug} |
   | 브랜치 | {branch_name} |
   | 소스 | {source} |
   ```

---

### delete 동작

1. AskUserQuestion:
   - Header: "⚠️ 브랜치 삭제"
   - Question: "`{repo_slug}/{branch_name}` 브랜치를 삭제합니다. 계속할까요?"
   - Options: "삭제", "취소"
   - "취소" 선택 시 중단.

2. Bash로 실행:
   ```bash
   curl -s -w "\nHTTP_STATUS:%{http_code}" -X DELETE -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" \
     "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}/refs/branches/{branch_name}"
   ```

3. HTTP 204 → "브랜치 `{branch_name}` 삭제 완료."
   기타 → 에러 메시지 표시.
