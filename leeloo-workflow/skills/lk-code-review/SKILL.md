---
name: lk-code-review
description: |
  코드 리뷰 — Claude 단독 또는 `--dual` 옵션으로 Gemini 이중 검증.
  코드 리뷰, 리뷰, 코드 검토, 이중 리뷰, 제미나이 리뷰, code review, dual review, gemini review, peer review
user_invocable: true
argument-hint: "[--dual] [path]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-code-review — Code Review

Claude reviews code. The `--dual` option enables a Gemini double review.
For document (Plan/Design) verification, use `/lk-plan-cross-review`.

## Usage

```
/lk-code-review                — Claude-only code review (git diff based)
/lk-code-review <path>         — review the specified file
/lk-code-review --dual         — Gemini + Claude double review
/lk-code-review --dual <path>  — double review of the specified file
```

## Output

**Claude-only mode:**
- Code quality, security, performance analysis
- Score Card + recommended actions

**Dual mode (--dual):**
- Claude perspective summary
- Gemini perspective summary
- Combined Score Card (code quality, security, performance)
- Agreed items / disagreed items

## Procedure

### Argument Parsing

Parse from user input:
- `--dual` → enable Gemini double review
- Remaining text → file path (if absent, fall back to git diff)

---

### gemini-cli Check (only when `--dual`)

Only when `--dual` is set, run `command -v gemini` via Bash to verify installation.

If missing:
```
gemini-cli가 설치되어 있지 않습니다.
설치 방법: npm install -g @google/gemini-cli
이중 리뷰는 gemini-cli가 필요합니다.
```
Abort. (To switch to single mode, run `/lk-code-review` without `--dual`.)

---

### Code Mode

#### Step 1: Acquire Review Target

- **If a file path is given**: Read the file via the Read tool.
- **If no file path**: run `git diff HEAD` via Bash to collect changes.
  - If empty, try `git diff --staged`.
  - Still empty: "리뷰할 코드 변경사항이 없습니다." then abort.

#### Step 2: Claude Review (Sonnet Task — single mode default)

In single mode, delegate review analysis to a Sonnet sub-agent. In dual mode (`--dual`), the Claude perspective analysis is also delegated to Sonnet.

**Agent tool invocation:**
- `subagent_type`: `task`
- `task_model`: `sonnet`
- `prompt`:

```
당신은 시니어 코드 리뷰어입니다. 다음 코드를 리뷰하세요. **한국어로 응답하세요.**

## Review criteria

### Code quality
- Logical correctness, edge cases
- Naming, structure, readability

### Security (OWASP Top 10)
- Injection vulnerabilities
- AuthN / AuthZ issues
- Sensitive data exposure

### Performance
- Unnecessary loops, memory leaks
- Inefficient algorithms

## Code under review
{code_or_diff}

## Project context (if any)
{claude_md_snippets}

## Output format (Korean — keep these headers verbatim)
### Score Card
| 항목 | 점수 (1-10) | 근거 요약 |
|------|-----------|----------|
| 코드 품질 | X | ... |
| 보안 | X | ... |
| 성능 | X | ... |
| 종합 | X | ... |

### 발견 사항
- [심각도 CRITICAL/HIGH/MEDIUM/LOW] 항목명: 설명 + 해당 라인

### 권장 조치
1. (우선순위 순서)
2.
```

**Result verification (main session):**
- [ ] Score Card includes all 4 items (quality/security/performance/overall)
- [ ] Findings carry severity tags
- [ ] Recommended actions trace back to findings (no new hallucinations)

**Fallback on quality failure:** redo review in the main session (Opus).

Save the analysis to an internal variable (output in Step 4).

#### Step 3: Gemini Review (only on `--dual`; otherwise skip to Step 4)

Run gemini-cli via Bash:

Set the Bash tool's `timeout` parameter to 120000ms (macOS lacks a `timeout` command):

```bash
gemini -p "$(cat <<'PROMPT_EOF'
당신은 시니어 코드 리뷰어입니다. 다음 코드 변경사항을 리뷰하세요. **한국어로 응답하세요.**

Review criteria:
1. Code quality (correctness, readability, structure)
2. Security vulnerabilities (OWASP Top 10)
3. Performance issues
4. Improvement suggestions

Output format (Korean — keep these headers verbatim):

## 발견 사항
- [심각도] 항목명: 설명

## Score Card
| 항목 | 점수 (1-10) |
|------|-----------|
| 코드 품질 | X |
| 보안 | X |
| 성능 | X |
| 종합 | X |

## 총평
(2-3문장)

---

# Code under review

{code content}
PROMPT_EOF
)" -o text
```

#### Step 4: Output

**Single mode (default):**

```
## 코드 리뷰 결과

### Score Card

| 항목 | 점수 (1-10) |
|------|-----------|
| 코드 품질 | X |
| 보안 | X |
| 성능 | X |
| 종합 | X |

### 발견 사항
- [심각도] 항목명: 설명

### 권장 조치
1. {most important fix}
2. {second most important fix}
```

**Dual mode (`--dual`):**

```
## 이중 코드 리뷰 결과

### Claude 관점
{Claude analysis}

---

### Gemini 관점
{Gemini response content}

---

### 통합 Score Card

| 항목 | Claude | Gemini | 합의 |
|------|--------|--------|------|
| 코드 품질 | X/10 | X/10 | X/10 |
| 보안 | X/10 | X/10 | X/10 |
| 성능 | X/10 | X/10 | X/10 |
| 종합 | X/10 | X/10 | X/10 |

### 합의 항목 (양쪽 모두 발견)
- {item 1}

### 불일치 항목 (한쪽만 발견)
| 항목 | Claude | Gemini | Conflict Resolution |
|------|--------|--------|---------------------|
| ... | 발견 | 미발견 | {recommended action} |

### 권장 조치 우선순위
1. {most important fix}
2. {second most important fix}
```

---

### Notes

- For document (Plan/Design) verification, use `/lk-plan-cross-review`.
- After review, you can commit fixes via `/lk-commit`.
