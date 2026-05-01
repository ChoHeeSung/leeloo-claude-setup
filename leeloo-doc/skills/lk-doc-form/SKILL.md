---
name: lk-doc-form
description: |
  공문서 양식 자동 인식 — 한글 공문서(HWP/HWPX/PDF)에서 레이블-값 쌍 추출.
  공문서 양식, 양식 인식, 서식, 레이블 추출, 한글 양식, 폼 추출, form recognition, hwp form, label extraction, government form
user_invocable: true
argument-hint: "<file> [--json]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-doc-form — Form Recognition

Auto-detect and extract label-value pairs from government forms in Korean public documents (HWP/HWPX/PDF).

## Examples

```
/lk-doc-form application.hwp
/lk-doc-form report-form.hwpx --json
```

## Use cases

- Auto-extract label-value pairs from government forms (e.g., "Name: Hong Gildong", "Application date: 2026-03-31")
- Structure extracted form data into Excel or a database

---

## Procedure

### Argument parsing

- `<file>` → required. HWP/HWPX/PDF file path
- `--json` → optional. Output the result as JSON

If no argument is provided:
```
Usage: /lk-doc-form <file> [--json]
Examples: /lk-doc-form application.hwp
          /lk-doc-form report-form.hwpx --json
```
Print and stop.

---

### Phase 0: Environment check

1. Verify the input file exists. Print error and stop if not.
2. Verify kordoc is installed:
   ```bash
   node -e "require.resolve('kordoc', {paths:['${CLAUDE_PLUGIN_ROOT}/node_modules']})" 2>/dev/null
   ```
   If it fails, instruct the user to install and stop.

---

### Phase 1A: Form recognition (without --to-hwpx)

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/kordoc-form.mjs" "<file>" [--json]
```

Bash timeout: 120s.

#### Display result

Display based on the wrapper output:

```
## Form recognition result: {filename}

Confidence: {confidence}%

| Label | Value |
|-------|-------|
| Name | Hong Gildong |
| Application date | 2026-03-31 |
| ... | ... |
```

If confidence is below 50%, warn:
```
> Confidence is low. This document may not be a structured form.
> Use `/lk-doc-parse` to inspect the full content.
```
