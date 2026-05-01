---
name: lk-plan
description: |
  인터랙티브 브레인스토밍으로 기능 목적·제약을 정리하여 구조화된 Plan 문서 작성 + Gemini 교차검증.
  플랜, Plan 작성, 기획, 브레인스토밍, 설계 문서, 기능 계획, plan, brainstorm, design doc, planning
user_invocable: true
argument-hint: "<feature> [--quick]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-plan — Brainstorming-based Plan Authoring

Through interactive brainstorming, clarify the feature's purpose and constraints, then author a structured Plan document.

## Subcommands

```
/lk-plan <feature>           — full 5-phase process (with brainstorming)
/lk-plan <feature> --quick   — skip Phase 2 (intent discovery), start at Phase 3
```

## Output File

- `docs/plan/{feature}.plan.md` (based on templates/plan.template.md)

## HARD-GATE

**No code writing/implementation until the Plan document is approved.**

## Procedure

### Argument Parsing

Parse from user input:
- `<feature>`: name of the feature/work to plan (required)
- `--quick`: quick mode flag (optional)

If `<feature>` is missing:
```
사용법: /lk-plan <feature> [--quick]
예: /lk-plan user-auth
예: /lk-plan api-refactoring --quick
```
Print and abort.

---

### Phase 1: Context Discovery (automatic)

1. **Read CLAUDE.md**: Read the project root's `CLAUDE.md` (skip if missing).
2. **Check git history**: run `git log --oneline -10` via Bash for recent activity.
3. **Check existing docs**: Glob `docs/**/*.md` to find related documents.
Show the discovery summary to the user:
```
## 컨텍스트 탐색 완료

- 프로젝트 유형: {discovered}
- 관련 문서: {list if any, otherwise "없음"}
- 최근 커밋 흐름: {summary of main pattern}
```

---

### Phase 2: Intent Discovery (interactive, skip on `--quick`)

AskUserQuestion one at a time (incorporate prior answers into the next question):

1. **Core purpose**: "이 기능의 핵심 목적은 무엇인가요? 어떤 문제를 해결하나요?"
2. **Target users**: "누가 이 기능을 사용하나요? 주요 사용 시나리오는?"
3. **Success criteria**: "이 기능이 성공했다고 볼 수 있는 기준은 무엇인가요? (측정 가능한 형태로)"
4. **Constraints**: "기술적/비즈니스 제약이 있나요? (마감일, 사용 금지 기술, 예산 등)"

---

### Phase 3: Alternative Exploration

Analyze 2–3 approaches based on collected context and intent.

Display in this format:

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

### Phase 4: YAGNI Review

Analyze the selected approach's scope and present a list of potentially unnecessary features.

AskUserQuestion (multiSelect) — "지금 당장 필요하지 않은 항목을 선택하세요 (기준: '정말 지금 필요한가?'):"
- For each presented feature, the user picks whether to drop it
- Selected items are removed from Plan scope

---

### Phase 5: Plan Document Generation

1. **Read template**: Read `${CLAUDE_PLUGIN_ROOT}/templates/plan.template.md`.
2. **Ensure docs/plan directory**: run `mkdir -p docs/plan` via Bash.
3. **Create Plan file**: Write to `docs/plan/{feature}.plan.md`.

Plan content (template-based + extra sections):

```markdown
# {feature} Plan

> 작성일: {date} | 작성자: Claude + {user}

## Executive Summary

{1–3 sentences summarizing core purpose, approach, and expected outcome}

## 의도 발견 로그 (omit on `--quick`)

| 질문 | 답변 |
|------|------|
| 핵심 목적 | {answer} |
| 대상 사용자 | {answer} |
| 성공 기준 | {answer} |
| 제약 조건 | {answer} |

## 탐색한 대안

{full table from Phase 3}

**선택**: {chosen approach} — {reason}

## YAGNI 결과

제거된 항목:
- {dropped feature 1} — {reason}
- {dropped feature 2} — {reason}

포함된 범위:
- {included feature 1}
- {included feature 2}

## 구현 계획

{step-by-step implementation plan based on chosen approach}

## 리스크

| 리스크 | 영향 | 대응 방안 |
|--------|------|----------|
| ... | 높음/중간/낮음 | ... |
```

4. **Completion message**:
   ```
   Plan 작성 완료

   파일: docs/plan/{feature}.plan.md

   다음 단계:
   - /lk-plan-cross-review docs/plan/{feature}.plan.md  — Gemini 교차검증
   - /lk-todo create                                    — Plan을 TODO 리스트로 변환
   ```

5. **Cross-review proposal**: AskUserQuestion — "Gemini로 이 Plan을 교차검증할까요? (검증/나중에)"
   - On "검증": run the `/lk-plan-cross-review docs/plan/{feature}.plan.md` logic
