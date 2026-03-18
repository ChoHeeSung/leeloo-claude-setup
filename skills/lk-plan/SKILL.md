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
4. **PDCA 상태 확인**: Read 도구로 `.leeloo/pdca-status.json` 읽기 (없으면 생략). feature와 관련된 기존 항목 파악.

탐색 결과 요약을 사용자에게 표시:
```
## 컨텍스트 탐색 완료

- 프로젝트 유형: {파악된 내용}
- 관련 문서: {있으면 목록, 없으면 "없음"}
- 기존 PDCA 항목: {있으면 목록, 없으면 "없음"}
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

### Phase 3: 대안 탐색

수집된 컨텍스트와 의도를 기반으로 2~3가지 접근법을 분석합니다.

다음 형식으로 표시:

```
## 접근법 비교

| 구분 | 접근법 A | 접근법 B | 접근법 C |
|------|---------|---------|---------|
| 요약 | ... | ... | ... |
| 장점 | ... | ... | ... |
| 단점 | ... | ... | ... |
| 복잡도 | 낮음/중간/높음 | ... | ... |
| 권장 | | ✓ | |
```

AskUserQuestion — "어떤 접근법을 선택하시겠습니까? (A/B/C 또는 직접 입력)"

---

### Phase 4: YAGNI 리뷰

선택된 접근법의 범위를 분석하여 잠재적으로 불필요한 기능 목록을 제시합니다.

AskUserQuestion (multiSelect) — "지금 당장 필요하지 않은 항목을 선택하세요 (기준: '정말 지금 필요한가?'):"
- 제시된 각 기능에 대해 사용자가 제거 여부 선택
- 선택된 항목은 Plan 범위에서 제외

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

4. **PDCA 상태 갱신**: `.leeloo/pdca-status.json`에 feature 항목 추가/갱신:
   ```json
   {
     "feature": "{feature}",
     "plan": "docs/plan/{feature}.plan.md",
     "planDate": "{날짜}",
     "stage": "plan"
   }
   ```
   - 파일이 없으면 `mkdir -p .leeloo` 후 새로 생성.

5. **완료 안내**:
   ```
   Plan 작성 완료

   파일: docs/plan/{feature}.plan.md

   다음 단계:
   - /lk-cross-validate docs/plan/{feature}.plan.md  — Gemini 교차검증
   - /lk-pdca design {feature}                       — 설계 문서 작성
   ```

6. **교차검증 제안**: AskUserQuestion — "Gemini로 이 Plan을 교차검증할까요? (검증/나중에)"
   - "검증" 선택 시: `/lk-cross-validate docs/plan/{feature}.plan.md` 로직 실행
