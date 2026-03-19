---
name: lk-plan-cross-review
description: "플랜 리뷰 — Gemini가 Plan/Design을 독립 검증. /lk-plan-cross-review [file-path]"
user_invocable: true
argument-hint: "[file-path]"
---

# /lk-plan-cross-review — Plan 리뷰 (Gemini 독립 문서 검증)

Claude가 작성한 Plan/Design 문서를 Gemini가 독립적으로 검증합니다.
Score Card를 파싱하여 메트릭을 저장하고, 반복 검증 시 이전 점수와 비교합니다.
코드 리뷰는 `/lk-code-review`를 사용하세요.

## Plan 저장 경로

Plan 파일은 프로젝트 루트의 `.claude/plans/` 또는 `docs/plan/` 디렉토리에 저장됩니다.
- 파일명 규칙: `{YYYY-MM-DD}-{요약-kebab-case}.md` 또는 `{feature}.plan.md`

## Procedure

### Step 1: 인자 파싱

사용자가 파일 경로를 인자로 제공했는지 확인하세요.
- 인자가 있으면 해당 경로를 검증 파일로 사용합니다. → Step 3로 이동.
- 인자가 없으면 Step 2로 진행합니다.

### Step 2: 파일 선택 (인자 없을 때)

인자가 없는 경우, 현재 대화 컨텍스트에 plan 내용이 있는지 확인합니다.

**A. 현재 컨텍스트에 plan이 있는 경우** (plan mode 직후 호출 등):
1. Bash로 `mkdir -p .claude/plans/` 실행
2. plan 내용을 Write 도구로 `.claude/plans/{YYYY-MM-DD}-{plan-요약-kebab-case}.md`에 저장
3. 저장된 파일을 검증 파일로 사용 → Step 3로 이동

**B. 현재 컨텍스트에 plan이 없는 경우**:
1. Glob 도구로 다음 경로를 순서대로 검색 (`.review.md`로 끝나는 파일 제외):
   - `{프로젝트루트}/docs/plan/*.plan.md`
   - `{프로젝트루트}/.claude/plans/*.md`
2. 파일이 없으면:
   ```
   검증할 파일을 찾을 수 없습니다.
   Plan을 먼저 작성하거나 파일 경로를 직접 지정하세요.
   Usage: /lk-plan-cross-review [file-path]
   ```
   중단.
3. 파일이 1개면 해당 파일을 사용
4. 파일이 여러 개면 AskUserQuestion으로 어떤 파일을 검증할지 확인

### Step 3: gemini-cli 존재 확인

Bash 도구로 `command -v gemini`를 실행하여 gemini-cli가 설치되어 있는지 확인하세요.

설치되어 있지 않으면:
```
gemini-cli가 설치되어 있지 않습니다.
설치 방법: npm install -g @google/gemini-cli 또는 https://github.com/google-gemini/gemini-cli 참고
```
중단.

### Step 4: 이전 검증 이력 확인

Read 도구로 `.leeloo/metrics.json` 읽기 (없으면 생략).

해당 파일에 대한 이전 검증 결과가 있으면 iteration 카운터를 증가:
- 이전 기록 없음: `iteration = 1`
- 이전 기록 있음: `iteration = 이전 iteration + 1`

이전 점수가 있으면 사용자에게 표시:
```
이전 검증 기록 발견 (iteration {N-1}):
- 종합 점수: {이전점수}/10
- 검증일: {이전날짜}
```

### Step 5: Plan 내용 읽기

Read 도구로 선택된 파일 내용을 읽으세요.

### Step 6: Gemini 실행

1. Read 도구로 `${CLAUDE_PLUGIN_ROOT}/resources/gemini-review-prompt.md` 파일을 읽어 리뷰 프롬프트 템플릿을 가져오세요.
2. 다음 Bash 명령으로 gemini-cli를 실행하세요:

```bash
timeout 120 gemini -p "$(cat <<'PROMPT_EOF'
{gemini-review-prompt.md 내용}

---

# 검증 대상 문서

{파일 내용}
PROMPT_EOF
)" -o text
```

**에러 처리:**
- timeout (종료코드 124) → "Gemini 응답 시간이 초과되었습니다 (120초). 네트워크 연결을 확인하세요."
- 빈 응답 → "Gemini가 빈 응답을 반환했습니다. API 키 설정을 확인하세요. (`gemini auth login`)"
- 기타 에러 → 에러 메시지를 그대로 표시

### Step 7: Score Card 파싱 및 메트릭 저장

Gemini 응답에서 Score Card를 파싱합니다.

파싱 대상 패턴 (숫자 추출):
- `완전성` 또는 `Completeness`: X/10
- `실현가능성` 또는 `Feasibility`: X/10
- `명확성` 또는 `Clarity`: X/10
- `종합` 또는 `Overall`: X/10
- `Verdict`: PASS / PASS WITH CONCERNS / NEEDS REVISION

파싱된 메트릭을 `.leeloo/metrics.json`에 저장:

```json
{
  "{파일경로}": [
    {
      "iteration": 1,
      "date": "{날짜}",
      "completeness": X,
      "feasibility": X,
      "clarity": X,
      "overall": X,
      "verdict": "PASS"
    }
  ]
}
```
- 파일이 없으면 `mkdir -p .leeloo` 후 새로 생성.
- 기존 파일에 해당 경로 항목이 있으면 배열에 추가.

### Step 8: 결과 표시

다음 형식으로 결과를 사용자에게 출력하세요:

```
## Gemini 교차검증 결과

- **검증 대상**: {파일 경로}
- **검증 시각**: {현재 날짜/시간}
- **Iteration**: {N}회차

---

{gemini 응답 내용}

---

## Score Card 요약

| 항목 | 이번 (iteration {N}) | 이전 (iteration {N-1}) | 변화 |
|------|---------------------|----------------------|------|
| 완전성 | {X}/10 | {이전값}/10 또는 - | ↑/↓/- |
| 실현가능성 | {X}/10 | {이전값}/10 또는 - | ↑/↓/- |
| 명확성 | {X}/10 | {이전값}/10 또는 - | ↑/↓/- |
| 종합 | {X}/10 | {이전값}/10 또는 - | ↑/↓/- |

**Verdict: {PASS / PASS WITH CONCERNS / NEEDS REVISION}**
```

### Step 9: 리뷰 파일 저장

gemini 응답을 파일과 같은 디렉토리에 저장하세요.

**리뷰 파일명 규칙**: `{파일명에서 .md 제거}.review.md`
- 예: `docs/plan/user-auth.plan.md` → `docs/plan/user-auth.plan.review.md`

Write 도구를 사용하여 다음 형식으로 저장:

```markdown
# Gemini 교차검증 리뷰

- **원본 파일**: {파일 경로}
- **검증 시각**: {현재 날짜/시간}
- **Iteration**: {N}

---

{gemini 응답 내용}
```

저장 완료 후 리뷰 파일 경로를 사용자에게 알려주세요.

### Step 10: Verdict 기반 다음 단계 제안

Verdict에 따라 AskUserQuestion으로 다음 단계를 제안합니다:

**PASS**:
- AskUserQuestion — "검증 통과! 다음 단계로 진행할까요? (Design 작성/나중에)"
- "Design 작성" 선택 시: `/lk-pdca design {feature}` 로직으로 안내

**PASS WITH CONCERNS**:
```
검증 통과 (우려사항 있음)

우려사항을 해결한 후 재검증을 권장합니다.
수정 후 다시 /lk-plan-cross-review {파일경로} 를 실행하세요.
```

**NEEDS REVISION**:
```
수정 필요

Plan을 수정하고 재검증하세요.
수정 후 다시 /lk-plan-cross-review {파일경로} 를 실행하세요.

이번이 {N}번째 검증입니다.
```
