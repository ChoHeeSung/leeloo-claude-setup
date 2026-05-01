---
name: lk-doc-compare
description: |
  공문서(HWP/HWPX/PDF) 두 파일 비교 — IR 레벨 크로스 포맷 차이 분석 지원.
  공문서 비교, 한글 비교, HWP 비교, HWPX 비교, PDF 비교, 문서 차이, diff, hwp compare, hwpx compare, document diff
user_invocable: true
argument-hint: "<file1> <file2> [--json]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-doc-compare — Public Document Comparison

Compare two Korean public documents (HWP/HWPX/PDF) at the IR (intermediate representation) level and analyze the differences.
Supports cross-format comparison — HWP and HWPX can be compared directly.

## Examples

```
/lk-doc-compare original.hwp revised.hwp
/lk-doc-compare v1.hwp v2.hwpx
/lk-doc-compare old.pdf new.pdf --json
```

## Use cases

- Compare revisions of public documents (what was added/removed/modified)
- Verify content equivalence after HWP → HWPX conversion
- Analyze differences between two versions of contracts or regulations

---

## Procedure

### Argument parsing

- `<file1>` → required. Reference document (original)
- `<file2>` → required. Target document (revision)
- `--json` → optional. Output diff result as JSON

If fewer than 2 files are given:
```
Usage: /lk-doc-compare <file1> <file2> [--json]
Examples: /lk-doc-compare original.hwp revised.hwp
          /lk-doc-compare v1.hwp v2.hwpx --json
```
Print and stop.

---

### Phase 0: Environment check

1. Verify both files exist. Print error and stop if not.
2. Verify kordoc is installed:
   ```bash
   node -e "require.resolve('kordoc', {paths:['${CLAUDE_PLUGIN_ROOT}/node_modules']})" 2>/dev/null
   ```
   If it fails, instruct the user to install and stop.

---

### Phase 1: Run document comparison

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/kordoc-compare.mjs" "<file1>" "<file2>" [--json]
```

Bash timeout: 120s.

---

### Phase 2: Result interpretation (Sonnet Task)

With `--json`, just display the JSON as-is. In default (markdown) mode, delegate the statistics + key change summary interpretation to a Sonnet sub-agent.

**Agent tool invocation (default mode):**
- `subagent_type`: `task`
- `task_model`: `sonnet`
- `prompt`:

```
Analyze the kordoc-compare result below and produce a user-facing summary report.

## Input
### Files
- file1: {file1_path}
- file2: {file2_path}

### kordoc-compare output
{compare_output}

## Output format
## Comparison result: {file1} vs {file2}

### Statistics
- Added: {N} blocks
- Removed: {N} blocks
- Modified: {N} blocks
- Unchanged: {N} blocks

### Key changes
(Pick changed blocks with significant content changes, title/clause edits, number/date edits. Summarize each in 2~3 lines as 3~5 bullets. Keep quoted source text short.)

### Detailed diff
{Include the diff section from the original compare_output verbatim}

## Rules
- Cite statistics only from the kordoc-compare output. Do not infer.
- Summarize only changes that actually appear in the diff. No hallucination.
- Do not add interpretation that is not in the source.
```

**Result verification (main session):**
- [ ] Statistics match the kordoc source
- [ ] Key changes exist in the actual diff
- [ ] Detailed diff section is included verbatim

**Fallback on quality failure:** main session displays the original compare output verbatim.

---

### Phase 3: Analysis suggestions

Based on the comparison result, propose follow-ups:
- Many changes: "Detailed review needed. Want to look at a specific section in depth?"
- No changes: "The two documents have identical content."
- Form field changes detected: "Use `/lk-doc-form` to compare form fields?"
