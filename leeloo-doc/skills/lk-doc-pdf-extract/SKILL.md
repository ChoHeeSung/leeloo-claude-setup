---
name: lk-doc-pdf-extract
description: |
  설계 도면 PDF에서 시설물·장비 정보를 자동 추출하여 Excel로 정리.
  도면, PDF 도면, 시설물 추출, 장비 추출, 설계도, 엑셀 변환, 도면 분석, drawing, blueprint, equipment, pdf extract
user_invocable: true
argument-hint: "<pdf-path> [--output <dir>] [--pages <range>]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-doc-pdf-extract — Drawing PDF Facility Extraction

A general-purpose skill that auto-extracts facility/equipment information from design drawing PDFs and organizes it into Excel.
It does not depend on specific equipment types or ID schemes; it analyzes the drawings first to discover patterns on its own, then applies them across all pages.

## Examples

```
/lk-doc-pdf-extract CM-001_communication_conduit_plan.pdf
/lk-doc-pdf-extract power_wiring_plan.pdf --output revised/
/lk-doc-pdf-extract drawing.pdf --pages 3-7
```

## Core design principles

> **No hardcoding**: do not pin equipment types, ID prefixes, or text-box layouts in code.
> All patterns are discovered automatically by analyzing the actual drawings in Phase 1 (exploration).
> The same skill must work even when the site, project, or drawing format changes.

---

## Procedure

### Argument parsing

Parse the PDF path and options from user input:
- `<pdf-path>` → required. PDF file path
- `--output <dir>` → optional. Output folder (default: same location as the PDF)
- `--pages <range>` → optional. Page range to process (e.g., "3-7", "1,3,5-10")

If the PDF path is missing:
```
Usage: /lk-doc-pdf-extract <pdf-path> [--output <dir>] [--pages <range>]
Examples: /lk-doc-pdf-extract CM-001_plan.pdf
          /lk-doc-pdf-extract drawing.pdf --pages 3-7
          /lk-doc-pdf-extract drawing.pdf --output result/
```
Print and stop.

---

### Phase 0: Environment preparation

> **Reuse existing skills (mandatory)**: read the `pdf` skill (SKILL.md) for PDF reading/processing and the `xlsx` skill (SKILL.md) for Excel generation first, and follow their guidance.

1. **Environment check**: run `${CLAUDE_PLUGIN_ROOT}/scripts/check-env.sh` via Bash.
   - On failure, rerun with `--fix` to attempt auto install.
   - If auto-install still fails, report the missing items to the user and stop.
2. **Read pdf skill SKILL.md**: use Read on `.claude/skills/pdf/SKILL.md` → check PDF processing guidance.
3. **Read xlsx skill SKILL.md**: use Read on `.claude/skills/xlsx/SKILL.md` → check Excel generation guidance.
4. **Verify input file**: confirm the PDF file exists.
5. **Verify output folder**: when `--output` is set, use that folder; otherwise use the PDF's directory.
6. **Get total page count**: use pypdf.
   ```python
   from pypdf import PdfReader
   reader = PdfReader(pdf_path)
   total_pages = len(reader.pages)
   ```
7. **Determine extraction mode** (per pdf skill):
   - Try text extraction with pdfplumber on the first 2~3 pages.
   - If sufficient text is extracted → **text mode** (fast).
   - If text is absent or extremely sparse → **vision mode** (CAD vector drawing).
   - Note: do not use Python OCR libraries (pytesseract, etc.) — they are very inaccurate on CAD drawings.
     Drawings where text extraction is impossible must be analyzed by Claude Vision directly.
8. **Vision mode environment check**:
   - Verify pdf2image (poppler) is installed — needed to convert pages to PNG.
   - If missing, attempt install via `check-env.sh --fix`.

After preparation, print a summary:
```
## Environment ready

- PDF: {filename} ({total_pages} pages)
- Extraction mode: {text mode / vision mode}
- Output folder: {output path}
- Range: {all / specified pages}
```

---

### Phase 1: Exploration (pattern discovery) — most important step

**Goal**: automatically determine the equipment types, ID schemes, and text layouts used in this drawing.

#### 1-1. Sample page selection and reading
- Pick 3~4 sample pages: front (1~2p), middle (1p), end (1p).

**Text mode:**
- Extract text per sample page with pdfplumber.

**Vision mode — must delegate to SubAgents:**

> **Context protection principle**: if the parent session reads images directly, they accumulate in context and trigger "Request too large (max 20MB)". In vision mode, image analysis must be delegated to SubAgents to protect parent context.

- For each sample page, **spawn one SubAgent in parallel** (3~4 concurrent).
- Each SubAgent's settings:
  - `mode`: `"bypassPermissions"`
  - Pass the PDF path, page number, the `convert_page_safe` function code, and the 1-2 analysis item list in the prompt.
- Each SubAgent's tasks:
  1. Convert the assigned page to JPEG with `convert_page_safe`.
  2. Use Read on the JPEG file and have Claude Vision analyze the drawing.
  3. Identify the items from 1-2 (section format, facility blocks, equipment keywords, ID scheme, direction scheme).
  4. Return findings as **text (JSON)** (the image is discarded when the SubAgent ends).
- The parent receives only text → no images accumulate in context.
- Merge results from the 3~4 SubAgents to derive the overall pattern.

**`convert_page_safe` function** (include in the SubAgent prompt):
```python
import os
from pdf2image import convert_from_path

def convert_page_safe(pdf_path, page_num, output_path, max_size_mb=10):
    """Convert a page to a JPEG that fits within the context limit.
    Start at low DPI to minimize token usage.
    CAD drawing text is vector-based, so DPI 150 is sufficient."""
    for dpi in [150, 100]:
        images = convert_from_path(pdf_path, first_page=page_num, last_page=page_num, dpi=dpi)
        for quality in [70, 50]:
            images[0].save(output_path, "JPEG", quality=quality)
            size_mb = os.path.getsize(output_path) / (1024 * 1024)
            if size_mb <= max_size_mb:
                return dpi, quality, size_mb
    # Last resort: resize the image
    img = images[0]
    img = img.resize((img.width // 2, img.height // 2))
    img.save(output_path, "JPEG", quality=50)
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    return 100, 50, size_mb
```
- **Image-size rules (token-saving optimization):**
  - Do not use PNG → must be **JPEG** (CAD drawings are 5~10x smaller than PNG).
  - File size cap: **10MB** (leaves headroom in SubAgent context).
  - **Start at DPI 150** (CAD vector text is fine at 150; 200 wastes tokens).
  - Start at quality 70 (85 is overkill).
  - If still too large, resize resolution by half.

#### 1-2. Drawing content analysis

From the sample-page results (text or Vision), auto-detect:

**A. Drawing section format discovery**
```
- Whether sections like "STA.0+000 ~ STA.0+800" are used
- Whether station markers like "NO.xx+xx.xx" are used
- Whether the page title contains sheet numbers like "[1]", "[2]"
- Other location reference forms (KP, km, station, etc.)
```

**B. Facility info block structure discovery**
```
- Look for repeating structural patterns in the OCR text
- Example patterns (any of these may apply):
  · "Name + ID code" repeating for 2~3 lines
  · "Equipment type #number(location description)" form
  · Tables/lists summarizing items
  · Bulk listing in a Legend area
- Key: detect a "repeating structure" in any form
```

**C. Equipment-type keyword discovery**
```
- Extract frequent uppercase abbreviations (2~5 letters) from the OCR text
- Extract Korean equipment names (e.g., CCTV, emergency phone, VMS, detector)
- Build the discovered keyword list → use it in subsequent parsing
- Note: do not rely on a predefined list
```

**D. ID code scheme discovery**
```
- Collect alphanumeric code patterns
- Classify prefix types (e.g., CTS, HPS, VDS — varies per site)
- Infer prefix-to-equipment-type mapping (link equipment names and IDs that appear in the same block)
- Determine the digit pattern (prefix length + numeric length)
- Infer direction-distinction rule (S/N suffix, separate notation, etc.)
```

**E. Direction/location scheme discovery**
```
- Detect direction keywords: up/down, left/right, tunnel/mainline, entry/exit
- Check whether the ID code includes a direction discriminator
- Check whether the drawing layout splits up/down vertically
- Determine which side (top/bottom) of the drawing is up vs down (physical layout rule)
```

**F. Direction decision priority** (passed to Phase 2)
```
Apply the following priority when deciding direction:

Priority 1: physical position on the drawing (e.g., top of road = up, bottom = down — based on the layout discovered in Phase 1)
Priority 2: companion equipment direction (if other equipment IDs in the same label block agree, adopt that direction)
Priority 3: ID prefix (e.g., CTS=up, CTN=down — based on the prefix-direction mapping discovered in Phase 1)

When the ID prefix conflicts with physical position:
→ Apply physical position and mark the note column "ID prefix-position mismatch"
→ This may indicate a naming error in the design drawing; user review is required
```

#### 1-3. Organize discovery results

Pass exploration results to Phase 2 in this form:
```json
{
  "text_mode": "ocr or text",
  "section_format": "STA section format description",
  "facility_keywords": ["discovered equipment-type keywords"],
  "id_patterns": [
    {"prefix": "CTS", "digits": 5, "mapped_type": "CCTV", "direction": "up"}
  ],
  "block_structure": "text layout pattern of facility blocks",
  "direction_system": "direction scheme description",
  "direction_layout": "physical layout of up/down on the drawing (e.g., top=up, bottom=down)",
  "direction_priority": "1: physical position, 2: companion equipment, 3: ID prefix",
  "location_format": "location notation format (STA, KP, etc.)",
  "confidence_notes": "items that were uncertain during exploration"
}
```

#### 1-4. User confirmation

Summarize discovered patterns to the user:
```
## Phase 1 exploration result

### Extraction mode
{text / OCR}

### Discovered equipment types ({N})
{Keyword list — table}

### ID code scheme
{Prefix-type mapping table}

### Drawing section format
{STA, KP, etc.}

### Direction scheme
{Up/down distinction method}

### Uncertainties
{confidence_notes}
```

AskUserQuestion — "Proceed with full processing using these patterns? (Proceed/Modify)"
- "Modify" → incorporate user feedback and update pattern info
- "Proceed" → move to Phase 2

---

### Phase 2: Per-page extraction (parallel SubAgents)

Pass the patterns discovered in Phase 1 to each SubAgent.

#### 2-1. Group split

**Text mode:**
- Split total pages into 4~5 groups (text is light; multiple pages per group OK).
- Example: 20 pages → [1-4], [5-9], [10-14], [15-20].

**Vision mode — 1 page per SubAgent:**
- To prevent images from accumulating in SubAgent context, use **one SubAgent per page**.
- Spawn up to 5 SubAgents in parallel → after they finish, run the next batch of 5.
- Example: 20 pages → batch1[1-5], batch2[6-10], batch3[11-15], batch4[16-20].

#### 2-2. Spawn SubAgents in parallel

For each group (or each page) spawn a SubAgent in parallel via the Agent tool.

**SubAgent permissions (all modes):**
- `mode`: `"bypassPermissions"` — required because the following must run without per-action confirmation.
  - **Read**: original PDF and converted image files (required for Claude Vision in vision mode)
  - **Bash**: run Python scripts (pdf2image, pdfplumber, openpyxl)
  - **Write**: save JSON result files (/tmp/)

Pass to each SubAgent:
- PDF file path
- Assigned page range (vision mode: a single page)
- Phase 1 discovered pattern JSON (full)
- Extraction mode: `text` / `vision`
- The `convert_page_safe` function code (vision mode)
- Result save path: `/tmp/facility_result_p{page}.json`

Each SubAgent's tasks for the assigned page:

**Text mode** (pdfplumber text extraction works):
1. Extract text with pdfplumber.
2. Parse facilities using Phase 1 patterns.
3. Save the result as JSON.

**Vision mode** (text extraction fails — CAD vector drawing, etc.):
1. Convert one page to JPEG with `convert_page_safe` (auto-applies size limit, cap 10MB).
2. Save the image as `/tmp/facility_page_{N}.jpg`.
3. **Read the JPEG and have Claude Vision analyze the drawing directly**.
4. Cross-check Vision-identified facilities with Phase 1 patterns and structure them.
5. Save the result as JSON.
6. SubAgent ends → image context is discarded automatically.

> **Mandatory directives in the vision-mode SubAgent prompt:**
> - Equipment labels can appear not only on the road mainline but also on **slopes, cut areas, and hatched (cross-hatched) regions**.
>   Inspect every area of the drawing.
> - In hatched regions, text can blend with the background — read carefully.
> - Collect labels placed outside the road (slopes, embankments, retaining walls, tunnel portals, etc.).
> - **Focus only on the facility types discovered in Phase 1**. Do not analyze out-of-scope items
>   (road signs, conduit specs, sound walls, guardrails, etc.). Do not include them in the result JSON.

> **Image Read rules for token saving:**
> - Read the entire image **once** to identify all equipment positions.
> - Cropped image Read is allowed **at most once**, only for "needs review" items.
> - Per SubAgent, **maximum 2 image Reads total** (1 full + 1 crop).
> - Unnecessary repeated Reads or sequential per-area Reads are forbidden.

#### 2-3. Re-verify zero-result pages (vision mode)

After Phase 2, re-verify pages with zero facilities (excluding cover/legend):

1. Identify zero-result pages (excluding cover/legend/TOC pages).
2. For each zero-result page, **spawn a separate SubAgent** to re-analyze cropped (4-quadrant) images:
   - Split the original image into top-left/top-right/bottom-left/bottom-right.
   - Read each crop and re-analyze with Vision.
   - Partial zoom improves the chance of finding labels embedded in hatched areas.
3. Mark items newly discovered during re-verification with `note` "Re-verification finding".
4. If still zero after re-verification, report the page list to the user in Phase 4.

> **Context management & token-saving rules (mandatory in vision mode):**
> - Image analysis MUST be delegated to SubAgents to protect parent context.
> - Vision-mode SubAgents process **only one page** then exit.
> - Per SubAgent, image Reads are **at most 2** (1 full + 1 crop if needed).
> - Run SubAgents in batches of 5 to balance parallelism and stability.
> - **Search only target facilities** discovered in Phase 1 — do not analyze non-target items.

> **Important**: in vision mode, do not use Python OCR libraries (pytesseract, etc.).
> Claude Vision reading the drawing image directly yields far higher accuracy than OCR libraries on CAD drawings.

#### SubAgent parsing logic

```
For each page:
1. Extract drawing section (STA range, etc.)
2. Locate facility text blocks using the discovered facility_keywords
   - Inspect not only the road mainline but slopes, cut areas, hatched regions
3. From each block:
   - Equipment type (Korean name or English abbreviation)
   - Name (full notation including number, location description)
   - ID code (match against discovered id_patterns)
   - Install location (STA, KP, etc.)
   - Direction decision (apply priority):
     · 1: physical position on drawing (per direction_layout)
     · 2: companion equipment direction (other IDs in the same label block)
     · 3: ID prefix (id_patterns direction mapping)
     · On mismatch: physical position wins, mark note "ID prefix-position mismatch"
4. Confidence judgment → decide whether to mark "needs review" in note
```

#### Confidence judgment criteria

Mark "needs review" in note when any of the following hold:
- ID code does not match the digit pattern discovered in Phase 1
- Equipment-type keyword recognized but no matching ID found
- ID recognized but no matching equipment type found
- OCR result contains broken characters (Korean with only consonants, meaningless special chars, etc.)
- Two or more duplicate facilities of the same type detected at the same position
- A new ID prefix not seen in Phase 1 appears
- **Direction by ID prefix conflicts with physical position on drawing** → mark "ID prefix-position mismatch"
- **Found during re-verification** (cropped re-analysis of zero pages) → mark "Re-verification finding"

#### SubAgent result JSON format

```json
{
  "pages": [
    {
      "page": 3,
      "section": "STA.0+000 ~ STA.0+400",
      "facilities": [
        {
          "type": "CCTV",
          "name": "CCTV #12 (tunnel entrance)",
          "id": "CTS00012",
          "location": "STA.0+120",
          "direction": "up",
          "note": ""
        }
      ]
    }
  ],
  "new_patterns": ["new patterns not discovered in Phase 1"],
  "error_pages": []
}
```

---

### Phase 3: Aggregate and generate Excel

> **Follow the xlsx skill guidance** — apply all rules from xlsx SKILL.md (formatting, formulas, recalc, etc.).

#### 3-1. Collect and organize results
1. Collect all SubAgent JSON result files (`/tmp/facility_result_p*.json`).
2. Sort by page order.
3. Remove duplicates (the same facility may be captured at page boundaries).
   - Same ID + same type → keep the first occurrence.
4. Reassign sequence numbers (No.).

#### 3-2. Generate Excel file (openpyxl)

Generate the Excel per xlsx skill guidance. If formulas exist, run recalc.py.

Output filename: `{input_filename}_facility_list.xlsx`

**Sheet 1: "Facility list"**

| Col | Content | Width |
|-----|---------|-------|
| A | No. | 6 |
| B | Page | 8 |
| C | Drawing section | 25 |
| D | Facility type | 15 |
| E | Name | 30 |
| F | ID | 18 |
| G | Install location | 15 |
| H | Direction | 12 |
| I | Note | 25 |

**Sheet 2: "Summary"**
- Pivot table of count per direction x facility type
- Show total extraction count and "needs review" count

**Sheet 3: "Discovered patterns"**
- Record the ID scheme, equipment types, direction rules detected in Phase 1
- Documented for the user's reference in subsequent work

**Formatting:**
- Header: dark blue background (`003366`) + white bold text, Arial 10pt
- Data: Arial 9pt, thin borders
- Cells containing "needs review": yellow background (`FFFF00`)
- Row background per direction: distinct light colors (assigned dynamically per discovered direction count)
- Auto filter applied
- Freeze first row (frozen pane)

---

### Phase 4: Verification

After extraction, output a verification report:

```
## Extraction complete

### Result file
{output file path}

### Extraction stats
- Total entries: {N}
- Facility types: {M}
- "Needs review" count: {K}

### Per-page summary
| Page | Section | Facility count |
|------|---------|----------------|
| 1 | STA.0+000~0+400 | 12 |
| ... | ... | ... |

### "Needs review" reasons
| Reason | Count |
|--------|-------|
| ID digit mismatch | 3 |
| Equipment-ID unmatched | 2 |
| OCR broken | 1 |

### Warnings
- {Pages with zero facilities (excluding cover/legend)}

### Newly discovered patterns
- {New ID prefixes or equipment types that emerged in Phase 2}
```

---

## Dependencies

### Required skills (read SKILL.md before running)
- **pdf skill**: `.claude/skills/pdf/SKILL.md` — PDF reading, splitting, text/table extraction, OCR
- **xlsx skill**: `.claude/skills/xlsx/SKILL.md` — Excel generation, formatting, formulas, recalc

### Python packages
- pypdf, pdf2image, pdfplumber, openpyxl, Pillow
- Note: pytesseract is not used — replaced by Claude Vision for low CAD-drawing accuracy

### System
- poppler-utils (required by pdf2image)
- Note: tesseract-ocr is not required — Claude Vision analyzes drawings directly

## Important notes

1. **Detect CAD vector drawings**: when pdfplumber returns no text, switch to **vision mode**. Claude Vision reads the drawing image directly.
2. **No Python OCR**: Python OCR libraries like pytesseract are very inaccurate on CAD drawings. Drawings without extractable text MUST go through Claude Vision.
3. **Prevent context overflow (vision-mode core)**:
   - Direct image Read by the parent session accumulates context and triggers "Request too large".
   - Image analysis MUST be delegated to SubAgents to protect parent context.
   - One SubAgent processes **only one page** then exits (image context auto-discarded).
   - Image files: **JPEG**, cap **10MB** — no PNG.
4. **Pattern discovery is the key**: Phase 1 must be thorough for Phase 2 accuracy. Inspect at least 3~4 sample pages.
5. **Acknowledge Vision limits**: complex drawings or low-resolution areas may be hard to read. Mark uncertain items "needs review" so the user can manually verify.
6. **Pass environment to SubAgents**: when parallelizing, pass extraction mode (text/vision), Phase 1 discovered patterns, and the `convert_page_safe` function to every SubAgent.
7. **Handle new patterns**: if patterns not seen in Phase 1 appear during Phase 2, do not ignore — collect them as "needs review" and report them in Phase 4.
