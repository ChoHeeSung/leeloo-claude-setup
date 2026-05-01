---
name: lk-doc-parse
description: |
  한국 공문서(HWP 5.x·HWPX·PDF)를 마크다운 또는 JSON으로 변환.
  공문서 파싱, 한글 파일 변환, HWP 마크다운, HWPX 파싱, PDF 텍스트, 한컴 파일, hwp parse, hwpx to markdown, hancom, document parse
user_invocable: true
argument-hint: "<file> [--pages <range>] [--json] [--metadata] [--table <N>]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-doc-parse — Korean Public Document Parsing

Skill that converts Korean public documents (HWP 5.x, HWPX, PDF) into markdown or JSON.
Uses the kordoc library; the format is auto-detected via magic bytes.

## Examples

```
/lk-doc-parse public_doc.hwp
/lk-doc-parse plan.hwpx --pages 1-3
/lk-doc-parse report.pdf --json
/lk-doc-parse form.hwp --metadata
/lk-doc-parse drawing.hwpx --table 0
/lk-doc-parse file1.hwp file2.hwpx file3.pdf
```

## Supported formats

| Format | Extension | Detection |
|--------|-----------|-----------|
| HWP 5.x | .hwp | OLE2 magic bytes |
| HWPX | .hwpx | ZIP magic bytes |
| PDF | .pdf | %PDF magic bytes |

---

## Procedure

### Argument parsing

Parse file path(s) and options from user input:
- `<file>` (or `<file1> <file2> ...`) → required. Document file path
- `--pages <range>` → optional. Page/section range (e.g., "1-3", "1,3,5")
- `--json` → optional. JSON output (blocks + metadata)
- `--metadata` → optional. Output metadata only
- `--table <N>` → optional. Extract only the N-th table (0-based)

If no file path is provided:
```
Usage: /lk-doc-parse <file> [--pages <range>] [--json] [--metadata] [--table <N>]
Examples: /lk-doc-parse public_doc.hwp
          /lk-doc-parse plan.hwpx --pages 1-3
          /lk-doc-parse form.hwp --metadata
```
Print and stop.

---

### Phase 0: Environment check

1. Verify the file exists. Print error and stop if not.
2. Verify kordoc is installed:
   ```bash
   node -e "require.resolve('kordoc', {paths:['${CLAUDE_PLUGIN_ROOT}/node_modules']})" 2>/dev/null
   ```
   If it fails:
   ```
   kordoc is not installed.
   Install with:
   cd ${CLAUDE_PLUGIN_ROOT} && npm install
   ```
   Stop.

---

### Phase 1: Document conversion

Branch by option:

#### Default (markdown conversion)
```bash
npx kordoc "<file>" [--pages <range>]
```
- Display the output to the user as markdown.
- Batch mode (multiple files): run each file sequentially.

#### --json (JSON output)
```bash
npx kordoc "<file>" --format json [--pages <range>]
```
- Display the JSON result in a code block.

#### --metadata (metadata only)
```bash
npx kordoc "<file>" --format json
```
- Extract only the metadata field from the JSON output and display:
  - title, author, creator, createdAt, modifiedAt, pageCount, version

#### --table N (table extraction)
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/kordoc-table.mjs" "<file>" <N>
```
- Output the N-th table as a markdown table.
- Default 0 (first table) when N is unspecified.

---

### Phase 2: Result formatting (Haiku Task)

Delegate header/meta/warning section composition of the kordoc execution result to a Haiku sub-agent. The main session only secures the kordoc output (Bash) and forwards the result to the user.

When the output is small, or for simple cases like single-table extraction with `--table N`, the main session displays directly without delegation.

**Agent tool invocation (only for batch mode or --metadata mode):**
- `subagent_type`: `task`
- `task_model`: `haiku`
- `prompt`:

```
Format the kordoc execution result below as user-facing markdown.

## Input
### File list
{files}

### kordoc output (per file)
{kordoc_outputs}

## Output format
Generate the following block per file.

## Conversion complete: {filename}

- Format: {HWP/HWPX/PDF}
- Pages: {pageCount}

{markdown body or JSON code block}

> Warning: {warning content}  (only when the warnings field is present)

On error, guide by error code:
- ENCRYPTED → "The document is encrypted. Remove the password and try again."
- DRM_PROTECTED → "DRM-protected document."
- UNSUPPORTED_FORMAT → "Unsupported format. Only HWP, HWPX, PDF are supported."

## Rules
- Use only information present in the kordoc output. Show "-" for missing values.
- Do not summarize or reinterpret body content. Include verbatim.
- Generate one block per file.
```

**Result verification (main session):**
- [ ] Number of input files = number of output blocks
- [ ] Body matches the kordoc source (no summary/edits)
- [ ] No warnings/errors are dropped

**Fallback on quality failure:** main session displays the original kordoc output verbatim.
