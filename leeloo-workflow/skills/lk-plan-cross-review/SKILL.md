---
name: lk-plan-cross-review
description: |
  Claude가 작성한 Plan/Design 문서를 Gemini가 독립 검증 — Score Card 파싱·이전 점수 비교.
  플랜 검토, Plan 검증, 설계 리뷰, 제미나이 교차검증, 문서 리뷰, plan review, design review, gemini cross review
user_invocable: true
argument-hint: "[file-path]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-plan-cross-review — Plan Review (independent document validation by Gemini)

Gemini independently validates a Plan/Design document authored by Claude.
The Score Card is parsed and metrics are stored; on repeat reviews, scores are compared against prior runs.
For code reviews, use `/lk-code-review`.

## Plan Storage

Plan files are stored in the project root under `.claude/plans/` or `docs/plan/`.
- File name convention: `{YYYY-MM-DD}-{summary-kebab-case}.md` or `{feature}.plan.md`

## Procedure

### Step 1: Argument Parsing

Check whether the user provided a file path argument.
- If yes, treat that path as the validation target. → go to Step 3.
- If no, proceed to Step 2.

### Step 2: File Selection (no argument)

If no argument, check whether a plan exists in the current conversation context.

**A. Plan present in current context** (called right after plan mode):
1. Run `mkdir -p .claude/plans/` via Bash
2. Save the plan content to `.claude/plans/{YYYY-MM-DD}-{plan-summary-kebab-case}.md` via Write
3. Use the saved file as the validation target → go to Step 3

**B. No plan in current context**:
1. Use Glob to search the following paths in order (excluding files ending in `.review.md`):
   - `{project-root}/docs/plan/*.plan.md`
   - `{project-root}/.claude/plans/*.md`
2. If no files:
   ```
   검증할 파일을 찾을 수 없습니다.
   Plan을 먼저 작성하거나 파일 경로를 직접 지정하세요.
   Usage: /lk-plan-cross-review [file-path]
   ```
   Abort.
3. If exactly one file, use it.
4. If multiple files, AskUserQuestion to pick one.

### Step 3: Verify gemini-cli

Run `command -v gemini` via Bash to verify gemini-cli is installed.

If missing:
```
gemini-cli가 설치되어 있지 않습니다.
설치 방법: npm install -g @google/gemini-cli 또는 https://github.com/google-gemini/gemini-cli 참고
```
Abort.

### Step 4: Check Prior Validation History

Read `.leeloo/metrics.json` (skip if missing).

If a prior result exists for the file, increment the iteration counter:
- No prior record: `iteration = 1`
- Prior record present: `iteration = previous iteration + 1`

If a prior score exists, show it to the user:
```
이전 검증 기록 발견 (iteration {N-1}):
- 종합 점수: {previous score}/10
- 검증일: {previous date}
```

### Step 5: Read Plan Content

Read the selected file via the Read tool.

### Step 6: Run Gemini

1. Read the review prompt template via the Read tool from `${CLAUDE_PLUGIN_ROOT}/resources/gemini-review-prompt.md`.
2. Run gemini-cli with the following Bash command:

Set the Bash tool's `timeout` parameter to 120000ms (macOS lacks a `timeout` command):

```bash
gemini -p "$(cat <<'PROMPT_EOF'
{gemini-review-prompt.md content}

---

# 검증 대상 문서

{file content}
PROMPT_EOF
)" -o text
```

**Error handling:**
- timeout (exit code 124) → "Gemini 응답 시간이 초과되었습니다 (120초). 네트워크 연결을 확인하세요."
- empty response → "Gemini가 빈 응답을 반환했습니다. API 키 설정을 확인하세요. (`gemini auth login`)"
- other errors → display the error message verbatim

### Step 7: Parse Score Card and Save Metrics

Parse the Score Card from the Gemini response.

Patterns to parse (extract numeric values):
- `완전성` or `Completeness`: X/10
- `실현가능성` or `Feasibility`: X/10
- `명확성` or `Clarity`: X/10
- `종합` or `Overall`: X/10
- `Verdict`: PASS / PASS WITH CONCERNS / NEEDS REVISION

Save parsed metrics to `.leeloo/metrics.json`:

```json
{
  "{file path}": [
    {
      "iteration": 1,
      "date": "{date}",
      "completeness": X,
      "feasibility": X,
      "clarity": X,
      "overall": X,
      "verdict": "PASS"
    }
  ]
}
```
- If file missing, run `mkdir -p .leeloo` and create new.
- If file exists and the path entry exists, append to the array.

### Step 8: Display Results

Output to the user in this format:

```
## Gemini 교차검증 결과

- **검증 대상**: {file path}
- **검증 시각**: {current date/time}
- **Iteration**: {N}회차

---

{gemini response content}

---

## Score Card 요약

| 항목 | 이번 (iteration {N}) | 이전 (iteration {N-1}) | 변화 |
|------|---------------------|----------------------|------|
| 완전성 | {X}/10 | {prev}/10 또는 - | ↑/↓/- |
| 실현가능성 | {X}/10 | {prev}/10 또는 - | ↑/↓/- |
| 명확성 | {X}/10 | {prev}/10 또는 - | ↑/↓/- |
| 종합 | {X}/10 | {prev}/10 또는 - | ↑/↓/- |

**Verdict: {PASS / PASS WITH CONCERNS / NEEDS REVISION}**
```

### Step 9: Save Review File

Save the gemini response next to the original file.

**Review file naming**: `{file name without .md}.review.md`
- Example: `docs/plan/user-auth.plan.md` → `docs/plan/user-auth.plan.review.md`

Save via the Write tool in this format:

```markdown
# Gemini 교차검증 리뷰

- **원본 파일**: {file path}
- **검증 시각**: {current date/time}
- **Iteration**: {N}

---

{gemini response content}
```

After saving, tell the user the review file path.

### Step 10: Suggest Next Steps Based on Verdict

Use AskUserQuestion to propose next steps based on the verdict:

**PASS**:
- AskUserQuestion — "검증 통과! 다음 단계로 진행할까요? (Design 작성/나중에)"
- On "Design 작성": guide design document authoring

**PASS WITH CONCERNS**:
```
검증 통과 (우려사항 있음)

우려사항을 해결한 후 재검증을 권장합니다.
수정 후 다시 /lk-plan-cross-review {file path} 를 실행하세요.
```

**NEEDS REVISION**:
```
수정 필요

Plan을 수정하고 재검증하세요.
수정 후 다시 /lk-plan-cross-review {file path} 를 실행하세요.

이번이 {N}번째 검증입니다.
```
