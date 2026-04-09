# ECC Hooks & Skill-Creator 통합 — leeloo-kit v3.1.0

## 지시 요약
everything-claude-code 레포지토리에서 hooks와 skill-creator 패턴을 발췌하여 leeloo-kit에 통합.

## 핵심 변경

### 배치 품질체크 (ECC 패턴)
기존: Write/Edit 시마다 즉시 lint/typecheck 실행 (per-edit 오버헤드)
변경: 편집 파일 경로만 수집 → Stop 시 일괄 실행

**비유**: 기존 방식은 편지를 쓸 때마다 우체국에 가는 것. 새 방식은 편지를 모아뒀다가 퇴근길에 한꺼번에 부치는 것. 한 번의 방문으로 전체를 처리.

### 세션 라이프사이클 자동화
- **SessionEnd**: 세션 종료 시 `.leeloo/sessions/`에 세션 요약 영속화 (수정 파일, 메타데이터)
- **SessionStart**: 다음 세션에서 이전 요약 자동 로드
- **PreCompact**: 컨텍스트 압축 전 Failure Memory + TODO 상태 보존

**비유**: 퇴근 시 책상 위에 메모를 남기고 가는 것. 다음 날 출근하면 어제 어디까지 했는지 바로 파악 가능.

### MCP 헬스체크 (PostToolUseFailure)
MCP 서버 실패 시 건강 상태를 추적. TTL 캐시 + 지수 백오프로 과민 반응 방지.

### lk-skill-create 스킬
Git 히스토리 + 프로젝트 구조 분석으로 SKILL.md 자동 생성.

## 파일 변경 목록

### 신규 (8개)
- `scripts/post-edit-accumulator.js` — 편집 경로 수집
- `scripts/stop-quality-check.js` — 배치 품질체크 (8개 언어)
- `scripts/mcp-health-check.js` — MCP 헬스체크
- `scripts/pre-compact.js` — 컨텍스트 압축 마커
- `scripts/session-end.js` — 세션 영속화 + Failure Memory Loop
- `scripts/lib/edit-accumulator.js` — 경로 수집 유틸리티
- `skills/lk-skill-create/SKILL.md` — Skill 자동 생성기
- `docs/plan/ecc-hooks-skill-creator.plan.md` — 구현 Plan

### 삭제 (1개)
- `scripts/unified-stop.js` → session-end.js + stop-quality-check.js로 분리

### 수정 (10개)
- `hooks.json` — 4개 → 7개 이벤트
- `tool-failure-post.js` — 품질체크 제거, 실패 감지만
- `session-start.js` — 이전 세션 로드 + Java/Go/Rust/HTML 감지
- `plugin.json` — v3.1.0
- `leeloo.config.json` — 신규 경로 추가
- `lib/paths.js` — ensureSessionsDir 추가
- `lib/config.js` — 새 기본값
- `CLAUDE.md` (루트, leeloo-kit, resources) — v3.1.0 반영

## 지원 언어 (배치 품질체크)
JS/TS, Python, Erlang/Elixir, Java (mvn/gradle), Go (vet/golangci-lint), Rust (cargo check/clippy), HTML (htmlhint)

## 참조 레포
- https://github.com/affaan-m/everything-claude-code
