# leeloo-doc

문서/도면 처리 플러그인. 설계 도면 PDF 추출 + 한국 공문서(HWP/HWPX/PDF) 변환·비교·양식 인식.

## Architecture

- `plugin.json` — Plugin manifest (name: "leeloo-doc", version: "1.1.0").
- `package.json` — Node.js 의존성 (kordoc). `npm install` 필요.
- `scripts/` — 유틸리티 스크립트:
  - `check-env.sh` — 의존성 일괄 점검 + `--fix` 자동 설치.
  - `kordoc-compare.mjs` — kordoc compare() API 래퍼 (문서 비교).
  - `kordoc-form.mjs` — kordoc extractFormFields() API 래퍼 (양식 인식).
  - `kordoc-table.mjs` — kordoc parse() → 테이블 추출 래퍼.
- `skills/` — 4 skills (lk-doc- prefix):
  - `lk-doc-pdf-extract/` — PDF 도면에서 시설물 정보 추출 → Excel 생성.
  - `lk-doc-parse/` — 한국 공문서(HWP/HWPX/PDF) → 마크다운 변환.
  - `lk-doc-compare/` — 두 공문서 비교 (크로스 포맷 HWP↔HWPX 지원).
  - `lk-doc-form/` — 공문서 양식 인식 (레이블-값 추출).

## Key Design Decisions

- **하드코딩 금지**: 장비 유형, ID 접두사, 텍스트 레이아웃 등을 코드에 고정하지 않음.
- **기존 스킬 활용**: PDF 처리는 `pdf` 스킬, Excel 생성은 `xlsx` 스킬의 SKILL.md를 먼저 읽고 지침을 따름.
- **kordoc 스킬 래핑**: kordoc CLI(parse)는 직접 호출, 라이브러리 API(compare/form)는 래퍼 스크립트로 호출.
- **네임스페이스 통일**: 모든 스킬이 `lk-doc-*` 접두사 사용.
- **로컬 의존성**: kordoc를 package.json에 로컬 의존성으로 관리.

## Dependencies

### Node.js (lk-doc-parse/compare/form용)
- kordoc (HWP/HWPX/PDF 파서)
- Node.js >= 18

### Python (lk-doc-pdf-extract용)
- pypdf, pdf2image, pdfplumber, openpyxl, Pillow
- poppler-utils
