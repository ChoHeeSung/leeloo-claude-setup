# Plan: ECC Hooks & Skill-Creator 통합

> 작성일: 2026-04-09 | 작성자: Claude + ChoHeesung
> 검증일: 2026-04-09 | Claude Code Hook 이벤트 24종 확인, ECC 실제 코드 분석 반영

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | ecc-hooks-skill-creator |
| 목적 | everything-claude-code의 고급 Hook 패턴 + Skill-Creator를 leeloo-kit에 통합 |
| 복잡도 | Medium |
| 참조 레포 | https://github.com/affaan-m/everything-claude-code |

## 1. 배경 및 목적

### 문제 정의
leeloo-kit v3.0.0은 기본 Failure Memory Loop를 갖추었으나:
- 다언어 자동 품질체크가 TS/JS에 편중 (Python, Erlang은 감지만, Java/Go/Rust/HTML 미지원)
- Skill 생성이 수동 작업 (SKILL.md 직접 작성)
- PostToolUseFailure, PreCompact, SessionEnd 이벤트 미사용 (24종 중 4종만 활용)
- 편집 시마다 품질체크 실행 → per-edit 오버헤드 (배치 처리가 효율적)
- 세션 간 컨텍스트 연속성 없음 (세션 종료 시 학습 소실)

### 목표
ECC에서 검증된 패턴만 발췌·한국어화하여:
1. **배치 품질체크**: 편집 시 경로 수집 → Stop/SessionEnd에서 일괄 실행 (ECC 패턴)
2. **다언어 지원 확장**: Java, Go, Rust, HTML 추가
3. **세션 라이프사이클 자동화**: SessionEnd에서 세션 요약 영속화 → SessionStart에서 복원
4. **전략적 컨텍스트 압축**: PreCompact에서 핵심 정보 보존 마커
5. **MCP 헬스체크**: PostToolUseFailure에서 MCP 서버 복원력 확보
6. **Skill-Creator**: `/lk-skill-create` — git history 분석 → SKILL.md 자동 생성

## 2. 의도 발견 로그

| 질문 | 답변 |
|------|------|
| 핵심 목적 | ECC hooks + Skill-Creator 양쪽 도입, 우선순위 Plan에서 결정 |
| 대상 사용자 | 내부 팀 전체 (설치 후 별도 조작 없이 자동 적용) |
| 성공 기준 | 다언어 품질체크 (erlang/java/go/python/html/rust 등), lk-skill-create 작동, PostToolUseFailure 작동, 세션 라이프사이클 자동화, 전략적 컨텍스트 압축 |
| 제약 조건 | PostToolUse 빈 stdout 한계 유지, 기존 코드 호환, Erlang/Elixir 필수, ECC 코드 필요 부분 직접 가져오기 |

## 3. 탐색한 대안

| 접근법 | 장점 | 단점 | 선택 |
|--------|------|------|------|
| A — ECC 직접 포팅 | 검증된 패턴 그대로 | ECC 스크립트 의존성, 37+ hooks 과다 | |
| B — 안전 확장 | 확실히 작동, 기존 호환 | 신규 이벤트 미활용 | |
| **C — 하이브리드** | 기존 구조 + ECC 핵심 패턴 선택 도입 | 구현 범위 넓음 | ✓ |

**선택**: C — ECC의 **핵심 아키텍처 패턴**을 채택하되, leeloo 기존 구조 위에 구축.
- 배치 처리 패턴 (post-edit-accumulator → stop-format-typecheck)
- 외부 메모리 영속화 (SessionEnd → 디스크, SessionStart → 복원)
- MCP 헬스체크 (PostToolUseFailure)
- 경량 컨텍스트 마커 (PreCompact)

## 4. YAGNI 리뷰

제거된 항목:
- **Skill Health Monitoring** — 현재 8개 스킬 규모에서 과도한 복잡도
- **Provenance 시스템** — curated/learned/imported 분류, 효과 낮음
- **Hook Profile 시스템** — ECC_HOOK_PROFILE (minimal/standard/strict), 추후 필요 시 도입
- **SQLite State Store** — 파일 기반으로 충분
- **Desktop Notification** — 불필요

포함된 범위:
- HTML 품질체크 (htmlhint/tidy)
- Erlang/Elixir (rebar3/dialyzer/mix/credo)
- Java/Go/Rust 품질체크
- 배치 처리 패턴
- 세션 요약 영속화

## 5. 구현 범위

### 포함

#### A. 배치 품질체크 (ECC의 핵심 설계)
현재: Write/Edit 시마다 lint/typecheck 즉시 실행 (per-edit 오버헤드)
변경: **ECC 패턴** — 경로 수집 → Stop에서 일괄 실행

- `post-edit-accumulator.js` (신규): PostToolUse(Write|Edit)에서 편집된 파일 경로를 `.leeloo/edited-files.tmp`에 축적
- `stop-quality-check.js` (신규): Stop에서 축적된 파일을 언어별로 분류 → 일괄 lint/typecheck
- `tool-failure-post.js` (수정): 품질체크 로직 제거, Write/Edit/MCP 실패 감지만 유지

#### B. 다언어 품질체크 확장
현재 지원: TS/JS, Python, Erlang/Elixir
추가:

| 언어 | 확장자 | 감지 파일 | 도구 |
|------|--------|-----------|------|
| Java | .java | pom.xml / build.gradle | mvn compile / gradle compileJava |
| Go | .go | go.mod | go vet / golangci-lint |
| Rust | .rs | Cargo.toml | cargo check / cargo clippy |
| HTML | .html/.htm | (없음) | htmlhint |

#### C. MCP 헬스체크 (PostToolUseFailure)
ECC의 `mcp-health-check.js` 패턴 채택:
- MCP 도구 호출 실패 시 서버 건강 상태 추적
- TTL 기반 캐싱 (건강 상태 2분 유지)
- 지수 백오프 재시도 (30초 → 최대 10분)
- "Fail-open" — 헬스체크 자체가 불안정하면 차단하지 않음

#### D. 세션 라이프사이클 자동화

**SessionEnd** (ECC의 핵심 메모리 영속화 메커니즘):
- 세션 종료 시 `.leeloo/sessions/{date}-session.md`에 요약 기록
  - 마지막 10개 사용자 요청
  - 사용한 도구 목록
  - 수정된 파일 (최대 30개)
  - 세션 메타데이터 (branch, cwd, 시작/종료 시간)
- HTML 주석 마커 (`<!-- LEELOO:SUMMARY:START -->`) — 멱등성 보장
- 기존 unified-stop.js의 Failure Memory Loop 로직을 SessionEnd로 이동

**SessionStart** (기존 수정):
- `.leeloo/sessions/` 최신 세션 요약 로드 → postContext로 주입
- "이전 세션 요약: {파일 N개 수정, 실패 M건}" 형태

**PreCompact** (경량):
- ECC 패턴: compaction 시점만 기록 (`.leeloo/compaction-log.txt`)
- 핵심 정보 postContext: Failure Memory 최근 3건 + 현재 작업 상태

#### E. lk-skill-create 스킬
- `/lk-skill-create <name>` 실행
- Phase 1: `git log --oneline -50` → 반복 패턴 추출
- Phase 2: AskUserQuestion — 스킬 목적, 트리거 조건, 대상 언어
- Phase 3: 기존 SKILL.md 구조 참조 → 초안 생성
- Phase 4: Write → `skills/{name}/SKILL.md` 저장
- ECC의 `skill-create-output.js` 터미널 포매터 참조 (ANSI 색상, 신뢰도 바)

### 제외
- Skill Health Monitoring
- Provenance 시스템
- Hook Profile (minimal/standard/strict)
- SQLite State Store
- Desktop Notification

## 6. 기술 설계 요약

### 아키텍처 (ECC 검증 패턴 반영)

```
hooks.json (v3.1.0)
├── SessionStart      → session-start.js (수정: 이전 세션 요약 로드 + 다언어 lint 감지 확장)
├── PreToolUse
│   └── Bash          → bash-pre.js (기존 유지)
├── PostToolUse
│   ├── Write|Edit    → post-edit-accumulator.js (신규: 경로 수집만, 품질체크 X)
│   ├── mcp_          → tool-failure-post.js (수정: 실패 감지만)
│   └── Skill         → skill-post.js (기존 유지)
├── PostToolUseFailure
│   └── mcp_          → mcp-health-check.js (신규: MCP 서버 복원력)
├── PreCompact        → pre-compact.js (신규: 경량 마커 + 핵심 정보 주입)
├── Stop              → stop-quality-check.js (신규: 배치 품질체크 실행)
└── SessionEnd        → session-end.js (신규: 세션 요약 영속화 + Failure Memory Loop)

skills/lk-skill-create/ (신규)
└── SKILL.md

scripts/ 변경 맵
├── post-edit-accumulator.js  (신규) ← ECC post-edit-accumulator.js 참조
├── stop-quality-check.js     (신규) ← ECC stop-format-typecheck.js 참조
├── mcp-health-check.js       (신규) ← ECC mcp-health-check.js 참조
├── pre-compact.js            (신규) ← ECC pre-compact.js 참조
├── session-end.js            (신규) ← ECC session-end.js 참조
├── session-start.js          (수정) — 이전 세션 로드 + 다언어 감지 확장
├── tool-failure-post.js      (수정) — 품질체크 로직 제거, 실패 감지만
├── unified-stop.js           (삭제) — 로직이 session-end.js + stop-quality-check.js로 분리
└── lib/
    ├── failure-log.js        (기존 유지)
    └── edit-accumulator.js   (신규) — 편집 파일 경로 수집/읽기 유틸
```

### 배치 처리 흐름 (ECC 핵심 패턴)

```
Write/Edit 발생 (PostToolUse)
  └── post-edit-accumulator.js
      └── .leeloo/edited-files.tmp에 파일 경로 append (중복 제거)
      └── respond({}) — 침묵 (back-pressure)

... (편집 반복) ...

Stop 발생
  └── stop-quality-check.js
      ├── .leeloo/edited-files.tmp 읽기
      ├── 파일별 언어 분류 (확장자 기반)
      ├── 언어별 일괄 실행:
      │   ├── JS/TS: eslint --fix + tsc --noEmit
      │   ├── Python: ruff check + mypy
      │   ├── Erlang: rebar3 compile
      │   ├── Java: mvn compile / gradle compileJava
      │   ├── Go: go vet + golangci-lint
      │   ├── Rust: cargo check + cargo clippy
      │   └── HTML: htmlhint
      ├── 실패 건수 보고 (0건이면 침묵)
      └── .leeloo/edited-files.tmp 초기화
```

### 세션 라이프사이클 흐름 (ECC 메모리 전략)

```
[세션 시작]
SessionStart → session-start.js
  ├── .leeloo/sessions/ 최신 요약 로드
  ├── postContext("이전 세션: {요약}")
  ├── Failure Memory 통계 표시
  ├── 다언어 lint 미설치 감지 (Java/Go/Rust/HTML 추가)
  └── TODO 진행률 표시

[작업 중]
PostToolUse → 경로 수집 (침묵)
PostToolUseFailure(mcp_) → MCP 헬스체크

[컨텍스트 압축 시]
PreCompact → pre-compact.js
  ├── .leeloo/compaction-log.txt에 타임스탬프 기록
  └── postContext("보존 정보: Failure Memory 최근 3건 + 현재 작업 파일")

[세션 종료]
Stop → stop-quality-check.js
  └── 배치 품질체크 실행

SessionEnd → session-end.js
  ├── 세션 요약 → .leeloo/sessions/{date}-session.md
  │   ├── 사용자 요청 목록
  │   ├── 수정 파일 목록
  │   └── 세션 메타데이터
  ├── Failure Memory Loop (기존 unified-stop.js 로직)
  │   ├── 반복 실패 → .leeloo/failure-memory/{type}.md
  │   ├── CLAUDE.md ## Failure Memory 업데이트
  │   └── failure-log.json 아카이브
  └── .leeloo/edited-files.tmp 정리
```

### MCP 헬스체크 흐름

```
MCP 도구 호출 실패 (PostToolUseFailure)
  └── mcp-health-check.js
      ├── 실패한 MCP 서버 식별
      ├── .leeloo/mcp-health.json에 상태 기록
      │   ├── lastFailure, failureCount, nextRetryAfter
      │   └── TTL: 건강 상태 2분 캐시
      ├── failureCount >= 3: "⚠ {서버명} MCP 서버 연결 불안정" 경고
      └── postContext("MCP 서버 {name} 상태: unhealthy, {N}회 실패")
```

## 7. 구현 단계

| Step | 내용 | 파일 | 의존성 | ECC 참조 |
|------|------|------|--------|---------|
| 1 | 편집 경로 수집 유틸 | lib/edit-accumulator.js | - | ECC post-edit-accumulator.js |
| 2 | PostToolUse → 경로 수집으로 전환 | post-edit-accumulator.js, tool-failure-post.js | Step 1 | ECC post-edit-accumulator.js |
| 3 | Stop → 배치 품질체크 | stop-quality-check.js | Step 1 | ECC stop-format-typecheck.js |
| 4 | session-start.js 확장 | session-start.js | - | ECC session-start.js |
| 5 | MCP 헬스체크 | mcp-health-check.js | - | ECC mcp-health-check.js |
| 6 | PreCompact 경량 마커 | pre-compact.js | - | ECC pre-compact.js |
| 7 | SessionEnd 세션 영속화 | session-end.js | - | ECC session-end.js |
| 8 | unified-stop.js 로직 분리 → session-end + stop-quality-check | unified-stop.js 삭제 | Step 3, 7 | - |
| 9 | hooks.json 전면 업데이트 | hooks.json | Step 1~8 | ECC hooks.json |
| 10 | lk-skill-create 스킬 | skills/lk-skill-create/SKILL.md | - | ECC skill-create-output.js |
| 11 | resources/CLAUDE.md 업데이트 | resources/CLAUDE.md | Step 1~10 | - |
| 12 | plugin.json v3.1.0 + 캐시 동기화 | plugin.json | 전체 | - |

## 8. 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| 배치 처리 시 Stop 미호출 (강제 종료) | 중 | 중간 | SessionEnd에서도 edited-files.tmp 정리. 미실행 파일은 다음 세션 SessionStart에서 감지 |
| MCP 헬스체크 오탐 (일시적 네트워크) | 중 | 낮음 | TTL 캐시 + 지수 백오프로 과민 반응 방지. fail-open 정책 |
| Go/Java/Rust 도구 미설치 | 높음 | 낮음 | session-start.js에서 미설치 감지 → 안내. 도구 없으면 해당 언어 체크 skip |
| SessionEnd에서 transcript 파싱 실패 | 낮음 | 중간 | 실패 시 최소 메타데이터만 기록 (branch, date, cwd) |
| edited-files.tmp 비대화 (대량 편집) | 낮음 | 낮음 | 파일 경로 중복 제거 + 100개 상한 (FIFO) |

## 9. 검증 기준

### 배치 품질체크
- [ ] Write/Edit 시 `.leeloo/edited-files.tmp`에 경로 축적 (즉시 실행 없음)
- [ ] Stop 시 축적된 파일 일괄 lint/typecheck 실행
- [ ] 실패 건수 0이면 침묵, N건이면 보고

### 다언어 지원
- [ ] `.java` 파일 편집 → Stop 시 mvn/gradle 체크
- [ ] `.go` 파일 편집 → Stop 시 go vet 체크
- [ ] `.rs` 파일 편집 → Stop 시 cargo check
- [ ] `.html` 파일 편집 → Stop 시 htmlhint 체크
- [ ] Java/Go/Rust/HTML 미설치 시 session-start에서 안내

### 세션 라이프사이클
- [ ] SessionEnd에서 `.leeloo/sessions/{date}-session.md` 생성
- [ ] 세션 요약에 사용자 요청, 수정 파일, 메타데이터 포함
- [ ] 다음 SessionStart에서 이전 세션 요약 로드 + postContext 주입
- [ ] HTML 주석 마커로 멱등성 보장 (재실행 시 덮어쓰기 안전)

### MCP 헬스체크
- [ ] PostToolUseFailure(mcp_)에서 헬스 상태 기록
- [ ] 3회 이상 실패 시 경고 메시지 출력
- [ ] TTL 만료 후 재시도 허용

### 컨텍스트 압축
- [ ] PreCompact에서 compaction-log.txt 기록
- [ ] Failure Memory 최근 3건 postContext로 보존

### Skill-Creator
- [ ] `/lk-skill-create` 실행 시 git log 분석 → 패턴 추출
- [ ] AskUserQuestion으로 스킬 메타데이터 수집
- [ ] SKILL.md 자동 생성 및 저장

### 호환성
- [ ] 기존 lk-plan, lk-commit, lk-code-review 정상 작동
- [ ] Failure Memory Loop 정상 작동 (SessionEnd에서)
- [ ] bash-pre.js 위험 명령 차단 유지
