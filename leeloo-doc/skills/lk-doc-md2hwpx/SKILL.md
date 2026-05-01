---
name: lk-doc-md2hwpx
description: |
  Markdown 문서를 한컴오피스에서 열리는 HWPX 파일로 변환.
  마크다운 변환, MD를 한글로, HWPX 변환, 공문서 작성, 한컴, markdown to hwpx, md to hwp, hancom, hwpx convert
user_invocable: true
argument-hint: "<input.md> [output.hwpx]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-doc-md2hwpx — Markdown → HWPX Conversion

Convert Markdown documents (AI-authored or externally provided) into HWPX files that open in Hancom Office.
Uses the `markdownToHwpx` API from the kordoc library.

## Examples

```
/lk-doc-md2hwpx report.md
/lk-doc-md2hwpx minutes.md minutes_2026-04-22.hwpx
```

When the output path is omitted, save into the input file's directory using the same basename with `.hwpx`.

## Supported elements (kordoc 2.5.2 — based on Hancom Office rendering)

| Element | Result |
|---------|--------|
| Heading (`#`, `##`, ...) | OK (rendered bold) |
| Body paragraph | OK |
| **Bold** (`**text**`) | OK — visually distinguished via `HY견고딕` face (new in v2.5.2) |
| Block quote (`>`) | OK |
| Unordered list (`-`) | OK — rendered with `·` prefix |
| Ordered list (`1. 2. 3.`) | OK — auto numbering, nesting, reset all work (new in v2.5.2) |
| Table cell structure | OK — cells render (border has limitations — see below) |

## Known limitations (kordoc 2.5.2)

1. **Table borders not displayed** — cell structure is drawn but Hancom does not render the outline. Diagnosis suggests the `refList` child definitions in `Contents/header.xml` are not at compatibility level with Hancom's official HWPX (the `borderFills` block itself is valid; suspected missing definitions like `styles itemCnt=1` / `paraProperties itemCnt=8`). See issue [chrisryugj/kordoc#4](https://github.com/chrisryugj/kordoc/issues/4) for details.
2. **No visual italic distinction** — `*italic*` text is included but renders in the same font as normal text. Unlike bold, no dedicated font face routing exists yet.
3. **Weak inline-code visual** — `` `code` `` switches to `함초롬돋움`, but without background/shading it does not stand out.

For documents where the above three matter, fix manually in Hancom Office after conversion or wait for the next kordoc upstream release and reconvert.

---

## Procedure

### Argument parsing

- `<input.md>` (required) — input markdown file path
- `[output.hwpx]` (optional) — output hwpx path. If omitted, save under the input directory using the same basename + `.hwpx`.

If no argument is provided:
```
Usage: /lk-doc-md2hwpx <input.md> [output.hwpx]
Examples: /lk-doc-md2hwpx report.md
          /lk-doc-md2hwpx minutes.md minutes_2026-04-22.hwpx
```
Print and stop.

### Phase 0: Environment check

1. Verify the input file exists. Print error and stop if not.
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

### Phase 1: Run conversion

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/kordoc-md2hwpx.mjs" "<input.md>" ["<output.hwpx>"]
```

The script prints the following to stdout:
- Output path
- File size (bytes)
- Conversion time (ms)

On non-zero exit, forward the stderr message to the user verbatim.

### Phase 2: User guidance

After successful conversion, display:

```
Conversion complete: <output.hwpx>

Open in Hancom Office to verify the result:
  open "<output.hwpx>"      (macOS)
  start "<output.hwpx>"     (Windows)

Known limitations (kordoc 2.5.2):
- Table borders may not render in Hancom (header.xml refList structure compatibility issue).
- *italic* and `` `code` `` have weak visual distinction. **bold** and ordered lists work correctly.
```

Batch processing (converting multiple .md files at once) runs only when the user explicitly requests it, executing Phase 1 sequentially per file.
