---
name: lk-plan
description: "브레인스토밍 기반 Plan 작성 + Gemini 교차검증 연동. /lk-plan <feature> [--quick]"
user_invocable: true
argument-hint: "<feature> [--quick]"
---

# /lk-plan — 브레인스토밍 기반 Plan 작성

대화형 브레인스토밍을 통해 feature의 목적과 제약을 명확히 한 뒤, 구조화된 Plan 문서를 작성합니다.

## 서브커맨드

```
/lk-plan <feature>           — 전체 5단계 프로세스 (브레인스토밍 포함)
/lk-plan <feature> --quick   — Phase 2(의도 발견) 건너뛰고 Phase 3부터 시작
```

## 출력 파일

- `docs/plan/{feature}.plan.md` (templates/plan.template.md 기반)

## HARD-GATE

**Plan 문서 승인 전까지 코드 작성/구현 절대 금지.**

## Procedure

### 인자 파싱

사용자 입력에서 다음을 파싱합니다:
- `<feature>`: Plan을 작성할 기능/작업 이름 (필수)
- `--quick`: 빠른 모드 플래그 (선택)

feature 인자가 없으면:
```
사용법: /lk-plan <feature> [--quick]
예: /lk-plan user-auth
예: /lk-plan api-refactoring --quick
```
출력 후 중단.

---

### Phase 1: 컨텍스트 탐색 (자동)

1. **CLAUDE.md 읽기**: Read 도구로 프로젝트 루트의 `CLAUDE.md` 읽기 (없으면 생략).
2. **Git 히스토리 확인**: Bash로 `git log --oneline -10` 실행하여 최근 작업 파악.
3. **기존 docs 확인**: Glob으로 `docs/**/*.md` 패턴 검색, 관련 문서 확인.
탐색 결과 요약을 사용자에게 표시:
```
## 컨텍스트 탐색 완료

- 프로젝트 유형: {파악된 내용}
- 관련 문서: {있으면 목록, 없으면 "없음"}
- 최근 커밋 흐름: {주요 패턴 요약}
```

---

### Phase 2: 의도 발견 (대화형, `--quick` 시 건너뜀)

AskUserQuestion으로 하나씩 순차 질문합니다 (이전 답변을 다음 질문에 반영):

1. **핵심 목적**: "이 기능의 핵심 목적은 무엇인가요? 어떤 문제를 해결하나요?"
2. **대상 사용자**: "누가 이 기능을 사용하나요? 주요 사용 시나리오는?"
3. **성공 기준**: "이 기능이 성공했다고 볼 수 있는 기준은 무엇인가요? (측정 가능한 형태로)"
4. **제약 조건**: "기술적/비즈니스 제약이 있나요? (마감일, 사용 금지 기술, 예산 등)"

---

### Phase 3: 대안 탐색 (Sonnet Task)

수집된 컨텍스트와 의도를 기반으로 2~3가지 접근법 비교표를 생성하는 작업은 Sonnet 서브 에이전트에 위임한다. 메인 세션(Opus)은 프롬프트 구성 + 결과 검토 + 사용자 선택 처리를 담당.

**Agent tool 호출:**
- `subagent_type`: `task`
- `task_model`: `sonnet`
- `prompt`:

```
아래 컨텍스트/의도를 기반으로 feature의 구현 접근법 2~3가지를 비교하라.

## 입력
### Feature
{feature}

### Phase 1 컨텍스트 탐색 결과
{phase1_summary}

### Phase 2 의도 발견 로그
{phase2_qa}

## 출력 형식
```
## 접근법 비교

| 구분 | 접근법 A | 접근법 B | 접근법 C |
|------|---------|---------|---------|
| 요약 | ... | ... | ... |
| 장점 | ... | ... | ... |
| 단점 | ... | ... | ... |
| 복잡도 | 낮음/중간/높음 | ... | ... |
| 권장 | | ✓ | |

**권장 사유**: (2~3문장)
```

## 규칙
- 접근법은 실제로 구현 방식이 다른 것이어야 함 (단순 변형 금지).
- 권장은 정확히 1개만 ✓ 표시.
- 컨텍스트/의도에 없는 외부 라이브러리/프레임워크 가정 금지.
```

**결과 검증 (메인 세션):**
- [ ] 접근법이 2~3개 제시됨
- [ ] 각 접근법이 실제로 다른 접근임 (단순 변형 아님)
- [ ] 제약 조건(Phase 2)과 충돌 없음
- [ ] 권장 1개 선정 + 근거 제시

**품질 미달 시 폴백:** 메인 세션(Opus)에서 직접 대안 탐색.

결과를 사용자에게 표시 후 AskUserQuestion — "어떤 접근법을 선택하시겠습니까? (A/B/C 또는 직접 입력)"

---

### Phase 4: YAGNI 리뷰 (Sonnet Task)

선택된 접근법의 범위에서 "지금 당장 필요하지 않을 수 있는" 항목 목록 생성은 Sonnet 서브 에이전트에 위임한다.

**Agent tool 호출:**
- `subagent_type`: `task`
- `task_model`: `sonnet`
- `prompt`:

```
아래 접근법의 구현 범위에서 YAGNI(지금 당장 필요하지 않을 수 있는) 후보를 식별하라.

## 입력
### 선택된 접근법
{selected_approach_text}

### Phase 2 의도/제약
{phase2_qa}

## 작업
1. 이 접근법의 구현 범위를 3~8개 기능 항목으로 나열.
2. 각 항목에 대해 "정말 지금 필요한가?" 기준으로 YAGNI 의심 항목을 3~6개 선별.
3. AskUserQuestion multiSelect용 options로 변환 (label + description).

## 출력 형식 (JSON만)
```json
[
  {"label": "자동 회귀 테스트 스크립트", "description": "이유: ..."},
  {"label": "토큰 사용량 대시보드", "description": "이유: ..."}
]
```

## 규칙
- AskUserQuestion 제약: options는 최대 4개. 5개 이상이면 우선순위 높은 4개만.
- label은 5단어 이내, description은 한 문장.
- 명확히 필수인 항목은 포함하지 않음.
```

**결과 검증 (메인 세션):**
- [ ] JSON 배열이 파싱 가능
- [ ] options ≤ 4개
- [ ] 각 항목에 label, description 존재

**품질 미달 시 폴백:** 메인 세션(Opus)에서 직접 YAGNI 후보 식별.

검증 통과한 options로 AskUserQuestion (multiSelect) — "지금 당장 필요하지 않은 항목을 선택하세요 (기준: '정말 지금 필요한가?'):"

선택된 항목은 Plan 범위에서 제외.

---

### Phase 5: Plan 문서 생성

1. **템플릿 읽기**: Read 도구로 `${CLAUDE_PLUGIN_ROOT}/templates/plan.template.md` 읽기.
2. **docs/plan 디렉토리 확인**: Bash로 `mkdir -p docs/plan` 실행.
3. **Plan 파일 생성**: Write 도구로 `docs/plan/{feature}.plan.md` 생성.

Plan 문서 내용 (템플릿 기반 + 추가 섹션):

```markdown
# {feature} Plan

> 작성일: {날짜} | 작성자: Claude + {사용자}

## Executive Summary

{1~3문장으로 핵심 목적, 접근법, 기대 효과 요약}

## 의도 발견 로그 (`--quick` 모드면 생략)

| 질문 | 답변 |
|------|------|
| 핵심 목적 | {답변} |
| 대상 사용자 | {답변} |
| 성공 기준 | {답변} |
| 제약 조건 | {답변} |

## 탐색한 대안

{Phase 3에서 비교한 접근법 전체 테이블}

**선택**: {선택된 접근법} — {선택 이유}

## YAGNI 결과

제거된 항목:
- {제거된 기능 1} — {이유}
- {제거된 기능 2} — {이유}

포함된 범위:
- {포함된 기능 1}
- {포함된 기능 2}

## 구현 계획

{선택된 접근법 기반 단계별 구현 계획}

## 리스크

| 리스크 | 영향 | 대응 방안 |
|--------|------|----------|
| ... | 높음/중간/낮음 | ... |
```

4. **완료 안내**:
   ```
   Plan 작성 완료

   파일: docs/plan/{feature}.plan.md

   다음 단계:
   - /lk-plan-cross-review docs/plan/{feature}.plan.md  — Gemini 교차검증
   - /lk-todo create                                    — Plan을 TODO 리스트로 변환
   ```

5. **교차검증 제안**: AskUserQuestion — "Gemini로 이 Plan을 교차검증할까요? (검증/나중에)"
   - "검증" 선택 시: `/lk-plan-cross-review docs/plan/{feature}.plan.md` 로직 실행
