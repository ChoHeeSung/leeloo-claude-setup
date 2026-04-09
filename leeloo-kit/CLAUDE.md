# leeloo-kit

사내 표준 AI 개발 키트. 하네스 엔지니어링 기반 자동화 + 다중 검증.

## Harness Engineering

플러그인 설치만으로 자동 적용. 스킬 호출 불필요.

1. **Failure Memory Loop**: Claude가 모든 실패를 직접 `.leeloo/failure-memory/{type}.md`에 기록 → CLAUDE.md에 최근 3건 요약 → 다음 세션에서 자동 방지. CLAUDE.md Failure Memory 규칙에 따라 동작.
2. **배치 품질체크**: Write/Edit 시 경로만 수집 → Stop에서 일괄 lint/typecheck (ECC 패턴). 지원 언어: JS/TS, Python, Erlang/Elixir, Java, Go, Rust, HTML.
3. **세션 라이프사이클**: SessionEnd에서 세션 요약을 디스크에 영속화 → 다음 SessionStart에서 복원. PreCompact에서 핵심 정보 보존.
4. **MCP 헬스체크**: PostToolUseFailure에서 MCP 서버 건강 상태 추적. TTL 캐시 + 지수 백오프.
5. **Control Flow**: PreToolUse로 위험 명령 차단 (rm -rf, git push --force)

## Architecture

- `hooks/hooks.json` — 7 hook events: SessionStart, PreToolUse(Bash), PostToolUse(Write|Edit, mcp_, Skill), PostToolUseFailure(mcp_), PreCompact, Stop, SessionEnd
- `scripts/` — Hook runtime (Node.js v18+ CommonJS):
  - `session-start.js` — 이전 세션 복원, Failure Memory 요약, 다언어 lint 감지, TODO 진행률
  - `bash-pre.js` — 위험 명령 차단
  - `post-edit-accumulator.js` — Write/Edit 파일 경로 수집 (배치 처리용)
  - `tool-failure-post.js` — Write/Edit/MCP 실패 감지 + failure-log 기록
  - `skill-post.js` — 스킬 완료 후 다음 단계 안내
  - `stop-quality-check.js` — 축적된 편집 파일 일괄 lint/typecheck (배치)
  - `mcp-health-check.js` — MCP 서버 헬스체크 (PostToolUseFailure)
  - `pre-compact.js` — 컨텍스트 압축 전 핵심 정보 보존
  - `session-end.js` — 세션 요약 영속화 + Failure Memory Loop
  - `lib/` — io.js, config.js, paths.js, context.js, failure-log.js, edit-accumulator.js
- `leeloo.config.json` — 하네스 설정 (failure memory, back-pressure, cross-validation)
- `skills/` — 9 skills (lk- prefix)
- `agents/` — code-analyzer (lk-code-review용)
- `output-styles/` — lk-dual-verify, lk-mentor, lk-ops

## Skills

| Skill | Purpose |
|-------|---------|
| lk-plan | 브레인스토밍 기반 Plan 작성 + Gemini 교차검증 |
| lk-code-review | 코드 리뷰 (Claude 단독 또는 --dual Gemini 이중) |
| lk-plan-cross-review | Plan/Design Gemini 독립 검증 |
| lk-commit | Conventional Commits + 한국어 커밋 |
| lk-todo | Plan → TODO 리스트 변환/관리 |
| lk-agent | Sub Agent 생성/관리 |
| lk-team | Agent Team 구성/관리 |
| lk-setup | 환경 강화 (statusline, CLAUDE.md, gemini) |
| lk-skill-create | Git 히스토리 분석 → SKILL.md 자동 생성 |

## Failure Memory 구조

```
.leeloo/failure-log.json         — 세션 내 임시 수집
.leeloo/failure-memory/{type}.md — 유형별 상세 (build/test/lint/git/dependency/file-io/mcp/judgment/general)
.leeloo/failure-archive/          — 세션별 아카이브
.leeloo/sessions/                 — 세션 요약 영속화
.leeloo/mcp-health.json          — MCP 서버 건강 상태
.leeloo/compaction-log.txt       — 컨텍스트 압축 기록
.leeloo/edited-files.tmp         — 배치 품질체크용 편집 파일 축적
CLAUDE.md ## Failure Memory       — 최근 3건 요약 (자동 주입)
```

## Testing

1. SessionStart에서 `leeloo-kit v3.1.0` 메시지 확인
2. Write/Edit 시 `.leeloo/edited-files.tmp`에 경로 축적 확인
3. Stop에서 배치 품질체크 일괄 실행 확인
4. SessionEnd에서 `.leeloo/sessions/` 세션 요약 생성 확인
5. PreCompact에서 Failure Memory 보존 메시지 확인
6. MCP 도구 실패 시 mcp-health-check 작동 확인
7. Failure Memory Loop: 반복 실패 → `.leeloo/failure-memory/` 기록 확인
