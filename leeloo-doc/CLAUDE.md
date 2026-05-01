# leeloo-doc

Document/drawing processing plugin. Extracts data from engineering drawing PDFs and converts/compares/recognizes Korean office documents (HWP/HWPX/PDF).

## Architecture

- `plugin.json` — Plugin manifest (name: "leeloo-doc", version: "1.2.0").
- `package.json` — Node.js dependencies (kordoc ^2.5.2). Requires `npm install`.
- `scripts/` — Utility scripts:
  - `check-env.sh` — Bulk dependency check + `--fix` for auto-install.
  - `kordoc-compare.mjs` — Wrapper for kordoc compare() API (document comparison).
  - `kordoc-form.mjs` — Wrapper for kordoc extractFormFields() API (form recognition).
  - `kordoc-table.mjs` — Wrapper for kordoc parse() → table extraction.
  - `kordoc-md2hwpx.mjs` — Wrapper for kordoc markdownToHwpx() API (Markdown → HWPX conversion).
- `skills/` — 5 skills (lk-doc- prefix):
  - `lk-doc-pdf-extract/` — Extracts facility info from PDF drawings → generates Excel.
  - `lk-doc-parse/` — Converts Korean office documents (HWP/HWPX/PDF) → markdown.
  - `lk-doc-compare/` — Compares two office documents (cross-format HWP↔HWPX supported).
  - `lk-doc-form/` — Recognizes office document forms (label-value extraction).
  - `lk-doc-md2hwpx/` — Reverse conversion Markdown → HWPX (based on kordoc 2.5.x).

## Key Design Decisions

- **No hardcoding**: Equipment types, ID prefixes, text layouts, etc. are not hardcoded.
- **Reuse existing skills**: For PDF processing, read the `pdf` skill's SKILL.md first; for Excel, read the `xlsx` skill's SKILL.md, and follow their guidance.
- **Wrap kordoc**: kordoc CLI (parse) is called directly; library APIs (compare/form) are called via wrapper scripts.
- **Unified namespace**: All skills use the `lk-doc-*` prefix.
- **Local dependency**: kordoc is managed as a local dependency in package.json.

## Dependencies

### Node.js (for lk-doc-parse/compare/form)
- kordoc (HWP/HWPX/PDF parser)
- Node.js >= 18

### Python (for lk-doc-pdf-extract)
- pypdf, pdf2image, pdfplumber, openpyxl, Pillow
- poppler-utils
