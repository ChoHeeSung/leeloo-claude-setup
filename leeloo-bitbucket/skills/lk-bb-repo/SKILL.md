---
name: lk-bb-repo
description: "Bitbucket 저장소 관리 (목록/조회/생성/삭제). /lk-bb-repo [list|get|create|delete]"
user_invocable: true
argument-hint: "[list|get|create|delete] [repo_slug]"
---

# /lk-bb-repo — 저장소 관리

Bitbucket Cloud 워크스페이스의 저장소를 관리합니다.

## 서브커맨드

```
/lk-bb-repo list                — 저장소 목록 (전체, 병렬 페이지네이션)
/lk-bb-repo list <keyword>     — 저장소 검색 (이름 필터)
/lk-bb-repo get <repo_slug>    — 저장소 상세 정보
/lk-bb-repo create <repo_slug> — 저장소 생성
/lk-bb-repo delete <repo_slug> — 저장소 삭제 (확인 필요)
```

## Procedure

### 사전 체크

Bash로 환경변수 확인:
```bash
echo "TOKEN=${BITBUCKET_API_TOKEN:+SET}" && echo "WORKSPACE=${BITBUCKET_WORKSPACE:-NOT_SET}"
```
- 미설정 시: "Bitbucket 연결이 설정되지 않았습니다. `/lk-bb-setup install`로 초기 설정을 진행하세요." 안내 후 중단.

### 인자 파싱

사용자 입력에서 서브커맨드를 파싱합니다:
- 인자 없음 또는 `list` → **list** 동작
- `list <keyword>` → **list** 동작 (키워드 필터)
- `get <repo_slug>` → **get** 동작
- `create <repo_slug>` → **create** 동작
- `delete <repo_slug>` → **delete** 동작

---

### list 동작

저장소가 많으므로 `bb-fetch-all.sh` 스크립트로 병렬 페이지네이션 처리합니다.

Bash로 실행:
```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/bb-fetch-all.sh" "/repositories/$BITBUCKET_WORKSPACE" \
  --jq-filter '{name: .name, slug: .slug, project: .project.key, updated: .updated_on, is_private: .is_private}'
```

키워드가 있으면 결과 JSON에서 name/slug에 키워드가 포함된 항목만 필터링합니다.

결과를 테이블로 표시:

```
Bitbucket 저장소 목록 ({워크스페이스}) — 총 {N}개

| # | 프로젝트 | 저장소 | 슬러그 | 공개 | 최종 업데이트 |
|---|---------|--------|--------|------|-------------|
| 1 | PROJ | My Repo | my-repo | ✅/🔒 | 2026-03-20 |
| ... | | | | | |
```

---

### get 동작

Bash로 실행:
```bash
curl -s -H "Authorization: Bearer $BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}" | jq '{name: .name, slug: .slug, project: .project.key, description: .description, language: .language, is_private: .is_private, created: .created_on, updated: .updated_on, size: .size, mainbranch: .mainbranch.name, clone_ssh: (.links.clone[] | select(.name=="ssh") | .href), clone_https: (.links.clone[] | select(.name=="https") | .href)}'
```

결과 표시:
```
저장소 상세: {repo_slug}

| 항목 | 값 |
|------|-----|
| 이름 | {name} |
| 프로젝트 | {project} |
| 설명 | {description} |
| 언어 | {language} |
| 메인 브랜치 | {mainbranch} |
| 공개 여부 | ✅ 공개 / 🔒 비공개 |
| 생성일 | {created} |
| 최종 업데이트 | {updated} |
| Clone (SSH) | {ssh_url} |
| Clone (HTTPS) | {https_url} |
```

---

### create 동작

1. AskUserQuestion:
   - Header: "저장소 생성"
   - Question: "저장소를 생성합니다. 다음 정보를 확인하세요."
   - Options:
     - "비공개 (기본)" — is_private: true
     - "공개" — is_private: false

2. AskUserQuestion:
   - Header: "프로젝트"
   - Question: "어떤 프로젝트에 생성할까요? (프로젝트 key 입력, 예: PROJ)"
   - Options: 직접 입력, "기본 프로젝트"

3. Bash로 실행:
   ```bash
   curl -s -X POST -H "Authorization: Bearer $BITBUCKET_API_TOKEN" -H "Content-Type: application/json" \
     "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}" \
     -d '{"scm": "git", "is_private": {true/false}, "project": {"key": "{프로젝트key}"}}'
   ```

4. 결과 표시:
   ```
   저장소 생성 완료: {repo_slug}

   | 항목 | 값 |
   |------|-----|
   | 슬러그 | {repo_slug} |
   | 프로젝트 | {project_key} |
   | 공개 여부 | 비공개/공개 |
   | Clone | git clone {ssh_url} |
   ```

---

### delete 동작

1. AskUserQuestion:
   - Header: "⚠️ 저장소 삭제"
   - Question: "`{repo_slug}` 저장소를 삭제합니다. 이 작업은 되돌릴 수 없습니다. 계속할까요?"
   - Options: "삭제", "취소"
   - "취소" 선택 시 중단.

2. Bash로 실행:
   ```bash
   curl -s -w "\nHTTP_STATUS:%{http_code}" -X DELETE -H "Authorization: Bearer $BITBUCKET_API_TOKEN" \
     "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE/{repo_slug}"
   ```

3. HTTP 204 → "저장소 `{repo_slug}` 삭제 완료."
   기타 → 에러 메시지 표시.
