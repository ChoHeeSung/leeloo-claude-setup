# leeloo-kit v3.0.0 — PDCA → 하네스 엔지니어링 전환

## 지시 요약
하네스 엔지니어링 핵심 원칙(Failure Memory Loop)을 leeloo-kit에 적용. 플러그인 설치만으로 자동 동작하도록 전환. lk-pdca 스킬 삭제.

## 작업 내용

### 1. PDCA 제거 (11파일 삭제)
- `lk-pdca/` 스킬, 3개 PDCA 에이전트(gap-detector, pdca-iterator, report-generator)
- 4개 PDCA 템플릿(analysis, design, do, report)
- `write-post.js` (PDCA 문서 포맷 검증), `pdca-status.js`

### 2. Failure Memory Loop 구현 (2파일 신규)
- `bash-post.js` — PostToolUse(Bash) 실패 감지. exit_code 기반. 반복 실패(2회+) 시 경고
- `tool-failure-post.js` — PostToolUse(Write|Edit, MCP) 실패 감지 + **소스 저장 시 자동 품질 검사** (lint/typecheck)
- `lib/failure-log.js` — 유형 분류(build/test/lint/git/dependency/file-io/mcp/judgment/general), CRUD, CLAUDE.md 요약

### 3. 2계층 + 유형별 분리 구조
```
프로젝트 CLAUDE.md ## Failure Memory  ← 최근 3건 요약만 (Context Rot 방지)
.leeloo/failure-memory/{type}.md      ← 유형별 상세 (max 10건/유형)
.leeloo/failure-log.json              ← 세션 내 임시 수집
.leeloo/failure-archive/              ← 세션별 아카이브
```

### 4. 자동 품질 검사 (Back-Pressure)
- Write|Edit로 소스 파일(.js/.ts/.py/.erl/.ex 등) 저장 시 자동 실행
- 프로젝트 린터 자동 탐지: package.json → eslint/biome/tsc, pyproject.toml → ruff/mypy, rebar.config → rebar3/dialyzer, mix.exs → credo/dialyxir
- 성공: 침묵, 실패: 에러만 에이전트에 피드백

### 5. judgment 유형 (자기 기록)
- Hook으로 감지 불가능한 사용자 거부/수정을 CLAUDE.md 지시로 자기 기록
- `resources/CLAUDE.md`에 Failure Memory 규칙 섹션 추가

### 6. Hook 시스템 리팩토링
| Hook | 변경 전 | 변경 후 |
|------|---------|---------|
| SessionStart | PDCA 상태 표시 | Failure Memory 통계 |
| PostToolUse(Write\|Edit) | PDCA 문서 포맷 검증 | 실패 감지 + 품질 검사 |
| PostToolUse(Bash) | (없음) | Bash 실패 감지 |
| PostToolUse(mcp_) | (없음) | MCP 실패 감지 |
| Stop | PDCA 에이전트 핸들링 | Failure Memory Loop |

## 현실 비유
하네스 엔지니어링은 **자동차 블랙박스**와 같다. 사고(실패)가 나면 자동으로 기록하고, 같은 교차로(패턴)에서 반복 사고가 발생하면 "이 교차로 주의!" 경고를 띄운다. 다음에 그 교차로를 지날 때 운전자(Claude)는 이미 경고를 알고 있어 같은 실수를 피할 수 있다.

## 결과
- leeloo-kit v2.0.0 (PDCA 중심) → v3.0.0 (하네스 엔지니어링 중심)
- 삭제 11파일, 신규 3파일, 수정 10파일
- 스킬 9개 → 8개 (lk-pdca 제거)
- 에이전트 4개 → 1개 (code-analyzer만 유지)
