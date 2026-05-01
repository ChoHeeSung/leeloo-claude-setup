---
name: lk-coding-guard
description: "코드 작성/리뷰/리팩터링 시 자동 호출되는 코딩 행동 게이트 — 가정 명시·단순성·외과적 변경·검증 가능한 성공 기준 + 정량 게이트(SRP·중첩3·함수50-80·CC10). Use when writing, reviewing, or refactoring code."
user_invocable: true
argument-hint: "[check|review|kpi]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-coding-guard — Coding Behavior Gate

Blocks the four traps LLMs fall into when writing code (silent assumption, over-engineering, drive-by refactor, weak success criteria) and re-injects the global Mandatory Principle 7 (Anti-Spaghetti Code Gate) quantitative gates immediately before any code is written.

> **Tradeoff:** Prioritizes care over speed. For trivial typos or one-off work, scale the rigor down as needed.

## Trigger Conditions

- *Just before* writing, modifying, reviewing, or refactoring code
- Manual invocation of `/lk-coding-guard` (re-inject the checklist)
- `/lk-coding-guard kpi` — review self-check KPIs

---

## 1. Think Before Coding

**Surface assumptions, interpretation branches, and tradeoffs. Stop when ambiguous.**

- State assumptions upfront. If uncertain, ask — do not guess.
- If more than one interpretation exists, present *all* of them. Do not silently pick one.
- If a simpler approach exists, say so. Push back on user requirements when needed.
- For unclear points, stop, name *what* is ambiguous, then ask.

## 2. Simplicity First + Quantitative Gates

**Minimum code to solve the problem. No speculative work.**

- Do not add features that were not requested.
- Do not abstract single-use code.
- Do not introduce unrequested "flexibility" or "configurability."
- Do not add error handling for impossible scenarios.
- If something written in 200 lines can be written in 50, rewrite it.

**Quantitative gates (per function/per file — integrating global Mandatory Principle 7):**

| Item | Threshold |
|---|---|
| Single Responsibility (SRP) | One function/class = one role. ≥2 reasons to change → split |
| Nesting depth | Max 3 levels. Decompose immediately at level 4 (flatten via Early Return) |
| Function length | 50–80 lines |
| Complexity | ≥10 branches (CC ≥ 10) → decompose immediately |
| DRY | Extract on the 3rd repetition. If abstraction harms simplicity, accept duplication |
| Naming | Names describe the role. Do not paper over ambiguous names with comments |
| Coupling | No global state, hidden dependencies, or circular references. I/O via explicit arguments/returns |

> **Self-question**: "Would a senior engineer call this overengineered?" If yes, simplify.

## 3. Surgical Changes

**Touch only what is needed. Clean up only the mess you made.**

When modifying existing code:

- Do not "improve" adjacent code, comments, or formatting.
- Do not refactor what is not broken.
- Follow existing style — even when it differs from your taste.
- For dead code **outside the requested scope**, *report only* — no unauthorized deletion.

For orphans caused by your changes:

- Remove only the imports/variables/functions your change made unused.
- Pre-existing dead code MUST NOT be removed without user approval.

> **Test**: Does *every* changed line trace directly back to the user's request?

**Scope policy (aligned with global Mandatory Principle 5):**

- *Within current scope*: fix immediately.
- *Outside scope*: report separately and fix only after user approval.
- No unauthorized cleanups, no drive-by refactors.

## 4. Goal-Driven Execution

**Define success criteria, then loop until verified.**

Imperative → declarative conversion:

| Instead of… | Use this |
|---|---|
| "Add validation" | "Write a test for invalid input first, then make it pass" |
| "Fix the bug" | "Write a test that reproduces the bug, then make it pass" |
| "Refactor X" | "Verify pre/post tests both pass" |

For multi-step work, state a brief plan + verify:

```
1. [step] → verify: [check method]
2. [step] → verify: [check method]
3. [step] → verify: [check method]
```

Strong success criteria let the LLM loop *independently*. Weak criteria ("make it work") force endless clarification.

## 5. KPI Self-Check

The gate is working when these four indicators improve:

- **Unnecessary diff↓** — no unrequested changes in PRs
- **Rewrites↓** — fewer rewrites caused by overreach
- **Pre-implementation questions↑** — clarification *before* implementation, not *after* mistakes
- **Mini PRs** — no drive-by refactors, no "improvements"

`/lk-coding-guard kpi` shows recent N PRs' diff line count and rewrite rate (optional).

---

## Relationship to Global Principles

| Global Principle | Section in this skill |
|---|---|
| Principle 1 No code without instruction | (pre-skill stage — verify explicit user instruction) |
| Principle 5 Don't defer | §3 Scope policy (fix immediately within scope) |
| Principle 6 Re-explore on user pushback | §1 Think Before Coding (preventive block) |
| Principle 7 Anti-Spaghetti quantitative gates | §2 Simplicity First (absorbs the quantitative gates) |
| Principle 8 Plan First | §4 Goal-Driven Execution (verify pattern) |

> The global md is the *baseline enforcer*; this skill is the *attention re-injection on entering coding mode*. Two channels, divided responsibility.

## References

- Source: Andrej Karpathy, [LLM coding pitfalls](https://x.com/karpathy/status/2015883857489522876)
- Composite: Karpathy's 4 principles + global Principle 7 quantitative gates + our Principle 5 scope policy
