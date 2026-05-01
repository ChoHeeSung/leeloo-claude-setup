# Claude Code Operating Principles

## Mandatory Principles (must follow)

### 1. No-Code-By-Default
- Never write code unless the user explicitly instructs "write code".
- Without an explicit instruction, only plan, analyze, and explain.

### 2. HISTORY.md Rules
- Do not write HISTORY.md automatically during work.
- On `/lk-commit`, ask the user before commit whether to write HISTORY.md, and only write it on approval.
- **HISTORY.md** (project root): record date/hour/minute + work summary + path references to detail files only.
- **history/ folder**: store details under the format `{YYYY-MM-DD}_{HHMM}_{title}.md`.

### 3. Real-World Analogies
- When a detail file under history/ explains a complex algorithm or technical concept, always use a real-world analogy.

### 4. TODO.md Check
- Before starting work, always check the TODO.md file at the project root.

### 5. Don't Defer Tasks (within scope)
- Fix problems found **within the current scope** immediately. "I'll leave it as a TODO" / "later" / "separately" are forbidden.
- Report **out-of-scope** problems separately and fix only after user approval. No unauthorized cleanup, no drive-by refactor.
- Do not pass partial-completion state forward. Once started, finish the work.

### 6. State Assumptions Upfront + Re-explore Source on User Pushback
- **Before:** State assumptions, interpretation branches, and trade-offs before writing/modifying code. If multiple interpretations exist, present them all — do not silently pick one.
- **After:** When the user pushes back ("that's not it", "this is off", "check again"), do not defend the prior judgment.
- Always re-read and re-explore the relevant source/file before answering.
- "I checked it earlier..." — memory-based answers are forbidden. Always verify current state directly.

---

### 7. [Strict] Anti-Spaghetti Code Gate ⚠ Enforced on every code write/modify

> **Warning**: This principle applies "every time code is written or modified".
> If **any one** of the gates below is violated, do not commit/submit — **decompose/refactor immediately**.
> "Make it work first, clean it up later" is forbidden — treated identically to Principle 5 (Don't Defer Tasks).

**Mandatory checklist (every function/every file):**

1. **Single Responsibility (SRP)** — A function/class owns **one role only**. If it has more than one reason to change, split it immediately.
2. **Nesting depth limit** — `if`/`for`/`while` nesting is **3 levels maximum**. Handle exceptions/edge conditions first via **Early Return / Guard Clause** to flatten the body.
3. **Function length limit** — Each function is **50–80 lines maximum**. If it overflows a screen, decompose into helper functions.
4. **Complexity gate** — If a function reaches 10+ branches (roughly Cyclomatic Complexity ≥ 10) or 4-level nesting, **decompose on the spot**. No exceptions.
5. **DRY & KISS** — Be wary at 2 repetitions; **always extract on the 3rd**. However, if abstraction harms simplicity, tolerate the duplication.
6. **Meaningful names first** — Variable, function, and class names must explain their role. Don't paper over vague names with comments.
7. **Low coupling** — Don't introduce global state, hidden global dependencies, or circular references. Inputs/outputs flow only via **explicit arguments/return values**.
8. **No spaghetti workaround** — Before layering code on top of an existing spaghetti area, propose a surgical change scope first and proceed only **after user approval** (per Principle 7). Workarounds layered on top are forbidden.

**Response when violations are found:**
- Code I just wrote violates → self-refactor before submitting.
- Existing code violates → report to the user and propose a refactor scope (no unsanctioned refactor before approval).

---

## Recommended Principles

### 8. Plan First + Verifiable Success Criteria
- Every task starts with a plan, and only proceeds after user approval.
- For multi-step work, attach a verification check to each step — format: `[step] → verify: [how to confirm]`.
- Convert imperative instructions into declarative success criteria. Example: "fix the bug" → "write a failing test that reproduces the bug, then make it pass".

### 9. Context Hygiene
- Use /clear per unit of work. One session = one task.

### 10. Sub-agent Delegation
- Delegate exploration/investigation to sub-agents to protect main context.

### 11. Korean Responses
- Respond in Korean. Code, commands, and technical terms remain in their original form.

## Skills & Commands

Available slash commands and skills are auto-loaded by Claude Code at session start. Type `/` to see the autocomplete popup, or run `/lk-harness budget --top-skills` for usage frequency.

When writing/modifying/reviewing/refactoring code, the `/lk-coding-guard` skill re-injects the coding behavior gate (state assumptions upfront, surgical change, verifiable success criteria + quantitative gates).

## Failure Memory Rules

**Claude records every failure directly.** Whenever you observe an error, record it immediately in the relevant type file.

### Recording targets (all types)
| Detection condition | Type file |
|---------------------|----------|
| Bash command error (exit code != 0, error message) | `.leeloo/failure-memory/general.md` (or build/test/lint/git/dependency) |
| Write/Edit tool failure | `.leeloo/failure-memory/file-io.md` |
| MCP tool error | `.leeloo/failure-memory/mcp.md` |
| User rejection ("nope", "redo", "this isn't right") | `.leeloo/failure-memory/judgment.md` |
| Same task retried 2+ times | `.leeloo/failure-memory/judgment.md` |

### Bash failure type classification
- `npm test|jest|vitest|pytest` → `test.md`
- `npm run build|tsc|webpack` → `build.md`
- `eslint|prettier|biome` → `lint.md`
- `git push|merge|rebase` → `git.md`
- `npm install|pip install` → `dependency.md`
- otherwise → `general.md`

### Record format
```
- [date] `command/situation` — error: {error message} → fix: {fix or "unresolved"}
```

### Recording procedure
1. On error, record using the format above in `.leeloo/failure-memory/{type}.md` (create the directory if missing).
2. If the same pattern is already recorded, **check the previous fix first** and apply it.
3. Keep the summary in the project-local **`CLAUDE.local.md`** (gitignored, auto-loaded by Claude Code) under the `## Failure Memory` section as the top 3 patterns. `leeloo-kit/scripts/failure-memory-rotate.js` refreshes it once per day on SessionEnd. Never touch the root `CLAUDE.md` — it is preserved as the cache-friendly prefix for prompt cache stability.
4. **Never modify the global `~/.claude/CLAUDE.md`.** Failure records always remain project-local.

### Cases not to record
- Intended failures (e.g., `test -f` existence checks, `|| echo` patterns)
- Errors the user has explicitly told you to ignore
