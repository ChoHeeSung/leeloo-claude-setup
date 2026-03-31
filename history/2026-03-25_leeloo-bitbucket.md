# 2026-03-25 — leeloo-bitbucket 인증 개선

## leeloo-bitbucket 인증 개선 — Basic Auth + 설정 파일 분리

**지시 요약**: Bearer → Basic Auth 수정, .zshrc 대신 플러그인 전용 설정 파일(`~/.claude/leeloo-bitbucket.local.md`)에 인증 정보 저장, 병렬 페이지네이션 스크립트(`bb-fetch-all.sh`) 추가.

**작업 내용**:
- Atlassian API Token은 Bearer가 아닌 Basic Auth (`email:token`) 방식으로 수정
- `bb-fetch-all.sh` 스크립트 추가: `--max-parallel` 옵션으로 동시 요청 수 제한 (기본 5)
- 모든 스킬의 사전 체크를 환경변수 → 설정 파일 읽기 방식으로 변경
- `lk-bb-setup install` 대화형 흐름을 설정 파일 저장으로 전환

**핵심 변경**:
```yaml
# ~/.claude/leeloo-bitbucket.local.md
---
bitbucket_user_email: "user@example.com"
bitbucket_api_token: "ATATT3x..."
bitbucket_workspace: "myworkspace"
---
```

**비유**: 집 열쇠를 현관 매트 아래(.zshrc)에 두는 대신, 개인 금고(전용 설정 파일)에 넣는 것. 금고는 주인만 열 수 있고, 다른 사람이 현관을 드나들어도 열쇠가 노출되지 않는다.

**결과**: 커밋 `697cb9e`, `3365ca6`, `9b9196f` → push 완료.

---

## leeloo-bitbucket 플러그인 v1.0.0 신규 생성

**지시 요약**: bitbucket-mcp-server 분석 결과를 바탕으로, MCP 서버 없이 REST API 직접 호출 방식의 Bitbucket 저장소 관리 플러그인을 신규 생성. API Token(Bearer) 인증, 대화형 setup, 병렬 페이지네이션 적용.

**작업 내용**:
- `leeloo-bitbucket/` 디렉토리 생성 (plugin.json, CLAUDE.md)
- 5개 스킬 작성: lk-bb-setup, lk-bb-repo, lk-bb-branch, lk-bb-pr, lk-bb-commit
- marketplace.json에 3번째 플러그인 등록
- 프로젝트 CLAUDE.md 업데이트 (구조도, 플러그인 목록, 네임스페이스)

**핵심 설계**:
```
# 인증: Bearer Token (App Password 아님)
curl -s -H "Authorization: Bearer $BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/..."

# 환경변수 3개
BITBUCKET_USER_EMAIL, BITBUCKET_API_TOKEN, BITBUCKET_WORKSPACE

# 병렬 페이지네이션: 대량 저장소/PR 조회 시 여러 Bash 도구를 동시 호출
```

**비유**: n8n 플러그인이 "통역사(MCP)를 고용해서 n8n과 대화"하는 방식이었다면, Bitbucket 플러그인은 "영어를 직접 배워서(curl) Bitbucket과 직접 대화"하는 방식이다.

**결과**: 커밋 후 push 완료.

---

## bitbucket-mcp-server (hongjunland) 분석

**지시 요약**: GitHub 레포 `hongjunland/bitbucket-mcp-server` 종합 분석 — MCP 도구 목록, 기술 스택, 설치 방법, 지원 API, 대상 플랫폼, 코드 품질 평가

**결과**:
1. **MCP 도구 6종**: list_repositories, get_repository, list_branches, get_commits, create_branch, create_pull_request
2. **기술 스택**: TypeScript + @modelcontextprotocol/sdk ^1.20.1 + axios ^1.12.2 (단일 파일 구조)
3. **설치**: npm install → npm run build → Claude Desktop config에 env 주입 방식
4. **코드 품질**: 초기 단계, 디버그 로그 잔존, 테스트 없음, 에러 핸들링 최소
