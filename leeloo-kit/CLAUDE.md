# leeloo-kit

사내 표준 AI 개발 키트. 하네스 엔지니어링 기반 자동화 + 다중 검증.

## Harness Engineering

플러그인 설치만으로 자동 적용. 스킬 호출 불필요.

1. **Failure Memory Loop**: 모든 도구 실패(Bash/Write/Edit/MCP) 자동 감지 + 사용자 거부 시 자기 기록(judgment) → 유형별 `.leeloo/failure-memory/{type}.md`에 기록 → CLAUDE.md에 최근 3건 요약 → 다음 세션에서 자동 방지
2. **Back-Pressure + Auto Quality Check**: 성공은 침묵, 실패만 장황하게 출력. 소스 파일 저장 시 lint/typecheck 자동 실행
3. **Control Flow**: PreToolUse로 위험 명령 차단 (rm -rf, git push --force)
4. **Session Persistence**: `.leeloo/` 디렉토리에 실패 로그, 활성 컨텍스트 유지

## Architecture

- `hooks/hooks.json` — 4 hook events: SessionStart, PreToolUse(Bash), PostToolUse(Bash, Write|Edit, mcp_, Skill), Stop
- `scripts/` — Hook runtime (Node.js v18+ CommonJS):
  - `session-start.js` — Failure Memory 요약, TODO 진행률
  - `bash-pre.js` — 위험 명령 차단
  - `bash-post.js` — Bash 실패 감지 (exit_code 기반)
  - `tool-failure-post.js` — Write/Edit/MCP 실패 감지 + 소스 저장 시 자동 품질 검사 (lint/typecheck)
  - `skill-post.js` — 스킬 완료 후 다음 단계 안내
  - `unified-stop.js` — Failure Memory Loop: 반복 실패 → 유형별 파일 + CLAUDE.md 기록
  - `lib/` — io.js, config.js, paths.js, context.js, failure-log.js
- `leeloo.config.json` — 하네스 설정 (failure memory, back-pressure, cross-validation)
- `skills/` — 8 skills (lk- prefix)
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

## Failure Memory 구조

```
.leeloo/failure-log.json        — 세션 내 임시 수집
.leeloo/failure-memory/{type}.md — 유형별 상세 (build/test/lint/git/dependency/file-io/mcp/judgment/general)
.leeloo/failure-archive/         — 세션별 아카이브
CLAUDE.md ## Failure Memory      — 최근 3건 요약 (자동 주입)
```

## Testing

1. SessionStart에서 `leeloo-kit v3.0.0` 메시지 확인
2. Bash 실패 2회 반복 시 경고 메시지 출력 확인
3. Stop에서 반복 실패가 `.leeloo/failure-memory/`에 기록되는지 확인
4. CLAUDE.md `## Failure Memory` 섹션에 요약 기록 확인
