# leeloo-kit

하네스 엔지니어링 코어 + 환경/도구. 모든 프로젝트에 자동 적용되는 자동화 엔진.

## Harness Engineering

플러그인 설치만으로 자동 적용. 스킬 호출 불필요.

1. **Failure Memory Loop**: Claude가 모든 실패를 직접 `.leeloo/failure-memory/{type}.md`에 기록 → CLAUDE.md에 최근 3건 요약 → 다음 세션에서 자동 방지. CLAUDE.md Failure Memory 규칙에 따라 동작.
2. **배치 품질체크**: Write/Edit 시 경로만 수집 → Stop에서 일괄 lint/typecheck (ECC 패턴). 지원 언어: JS/TS, Python, Erlang/Elixir, Java, Go, Rust, HTML.
3. **세션 라이프사이클**: SessionEnd에서 세션 요약을 디스크에 영속화 → 다음 SessionStart에서 복원. PreCompact에서 핵심 정보 보존. Context Checkpoint로 작업 맥락/결정 이력 생존.
4. **Control Flow**: PreToolUse로 위험 명령 차단 (rm -rf, git push --force)

## Architecture

- `hooks/hooks.json` — 6 hook events: SessionStart, PreToolUse(Bash), PostToolUse(Write|Edit, mcp_, Skill), PreCompact, Stop, SessionEnd
- `scripts/` — Hook runtime (Node.js v18+ CommonJS):
  - `session-start.js` — 이전 세션 복원, Failure Memory 요약, 다언어 lint 감지, TODO 진행률
  - `bash-pre.js` — 위험 명령 차단
  - `post-edit-accumulator.js` — Write/Edit 파일 경로 수집 (배치 처리용)
  - `tool-failure-post.js` — Write/Edit/MCP 실패 감지 + failure-log 기록
  - `skill-post.js` — 스킬 완료 후 다음 단계 안내
  - `stop-quality-check.js` — 축적된 편집 파일 일괄 lint/typecheck (배치)
  - `pre-compact.js` — 컨텍스트 압축 전 핵심 정보 보존 (Context Checkpoint 포함)
  - `session-end.js` — 세션 요약 영속화 + Failure Memory Loop
  - `lib/` — io.js, config.js, paths.js, context.js, failure-log.js, edit-accumulator.js
- `leeloo.config.json` — 하네스 설정 (failure memory, back-pressure, cross-validation)
- `skills/` — 2 skills: lk-setup (환경 강화), lk-skill-create (스킬 자동 생성)
- `agents/` — code-analyzer
- `output-styles/` — lk-dual-verify, lk-mentor, lk-ops

## Context Checkpoint

컨텍스트 압축(PreCompact) 시 작업 맥락이 소실되지 않도록, 핵심 결정과 발견을 디스크에 기록한다.

### 규칙
- **기록 파일**: `.leeloo/context-summary.md`
- **기록 시점**: 주요 결정, 방향 전환, 핵심 발견이 있을 때 (매 턴마다 X)
- **형식**: 한 줄에 하나, `- [결정|발견|변경] 내용` (100자 이내)
- **상한**: 최대 20줄. 초과 시 오래된 항목부터 삭제
- **자동 처리**: PreCompact 시 postContext로 주입 → SessionEnd 시 세션 파일로 병합 후 초기화

### 기록 예시
```
- [결정] ORM 대신 raw SQL 사용 — 성능 요구사항 우선
- [발견] user 테이블에 deleted_at 인덱스 누락 — 소프트삭제 쿼리 느림
- [변경] API 응답 형식 snake_case → camelCase — 프론트엔드 요청
```

### 기록하지 않는 것
- 코드에서 바로 알 수 있는 사실 (어떤 파일을 수정했는지 등)
- 이미 커밋 메시지나 TODO에 기록된 내용
- 단순한 진행 상황 (이건 TODO가 담당)

## Failure Memory 구조

```
.leeloo/context-summary.md       — Context Checkpoint (작업 맥락/결정 이력, 최대 20줄)
.leeloo/failure-log.json         — 세션 내 임시 수집
.leeloo/failure-memory/{type}.md — 유형별 상세 (build/test/lint/git/dependency/file-io/mcp/judgment/general)
.leeloo/failure-archive/          — 세션별 아카이브
.leeloo/sessions/                 — 세션 요약 영속화
.leeloo/compaction-log.txt       — 컨텍스트 압축 기록
.leeloo/edited-files.tmp         — 배치 품질체크용 편집 파일 축적
CLAUDE.md ## Failure Memory       — 최근 3건 요약 (자동 주입)
```

## 모델 선택 가이드라인 (Skill 위임 전략)

Skill 내부 작업을 SubAgent에 위임할 때 모델 선택 기준. `lk-commit`이 레퍼런스 구현 (Task tool + `task_model`).

### 판단 기준

| 유형 | 모델 | 판단 기준 | 대표 예시 |
|------|------|-----------|----------|
| **단순 변환/포맷팅** | `haiku` | 입력→출력 매핑이 결정적, 추론 1단계 이내. 템플릿 채우기, API 결과 테이블화, YAML→SQL 변환 | lk-commit(메시지 생성), lk-its-ddl(DDL 프리뷰), lk-its-code(INSERT 프리뷰), lk-doc-parse, lk-n8n-node 조회, lk-bb-pr 조회 |
| **중간 복잡도 분석** | `sonnet` | 2~3단계 추론, 비교/요약/분해, 도메인 지식 중간 | lk-code-review(단독), lk-todo(create 분해), lk-doc-compare, lk-plan(Phase 3·4), lk-skill-create(Phase 3) |
| **복잡한 다단계 추론** | `opus` (메인 세션 유지) | 브레인스토밍, 리스크 분석, 오케스트레이션, Vision 통합, 창의적 판단 | lk-plan(Phase 2·5), lk-plan-cross-review, lk-doc-pdf-extract, lk-commit 메인 제어 |

### 위임 패턴 (Task tool)

위임이 적합하다고 판단되면 SKILL.md의 해당 Step을 다음 구조로 작성한다.

```markdown
### Step N. {작업명} ({Haiku|Sonnet} Task)

메인 세션은 프롬프트 구성 + 결과 검증만 수행. 실제 작업은 SubAgent에 위임.

**Agent tool 호출:**
- `subagent_type`: `task` (또는 `general-purpose`)
- `task_model`: `haiku` 또는 `sonnet`
- `prompt`: 자기 완결 프롬프트 — 컨텍스트/입력 데이터/기대 출력 형식 명시

**결과 검증 (메인 세션):**
- [ ] 출력 포맷 준수
- [ ] 입력 데이터 외 hallucination 없음
- [ ] {Skill별 고유 체크 항목}

**품질 미달 시 폴백:** 메인 세션(Opus)에서 직접 재생성.
```

### 주의사항

- 메인 세션의 대화형 AskUserQuestion, 최종 확인, DB/파일 실행, 사용자 피드백 반영은 **위임하지 않는다** (Opus 유지).
- SubAgent 프롬프트는 자기 완결적이어야 한다 — 메인 세션의 대화 내역을 가정하지 말 것.
- 위임 실패/품질 미달 시 메인 세션 폴백 경로를 항상 명시한다.

## Testing

1. SessionStart에서 `leeloo-kit v3.1.0` 메시지 확인
2. Write/Edit 시 `.leeloo/edited-files.tmp`에 경로 축적 확인
3. Stop에서 배치 품질체크 일괄 실행 확인
4. SessionEnd에서 `.leeloo/sessions/` 세션 요약 생성 확인
5. PreCompact에서 Failure Memory + Context Checkpoint 보존 메시지 확인
6. Failure Memory Loop: 반복 실패 → `.leeloo/failure-memory/` 기록 확인
