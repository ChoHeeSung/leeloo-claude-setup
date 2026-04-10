# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`leeloo-util`은 Leeloo 범용 유틸리티 모음 플러그인입니다.
ITS 도면 분석, 한국 공문서(HWP/HWPX/PDF) 변환·비교·양식 인식 등 현장 업무 자동화 스킬을 제공합니다.

## Architecture

- `plugin.json` — Plugin manifest (name: "leeloo-util", version: "1.1.0").
- `package.json` — Node.js 의존성 (kordoc ^1.6.1). `npm install` 필요.
- `scripts/` — 유틸리티 스크립트:
  - `check-env.sh` — 의존성 일괄 점검 + `--fix` 자동 설치.
  - `kordoc-compare.mjs` — kordoc compare() API 래퍼 (문서 비교).
  - `kordoc-form.mjs` — kordoc extractFormFields() API 래퍼 (양식 인식).
  - `kordoc-table.mjs` — kordoc parse() → 테이블 추출 래퍼.
- `skills/` — Skills:
  - `lk-doc-pdf-extract/` — PDF 도면에서 시설물 정보 추출 → Excel 생성. (lk-doc- prefix)
  - `lk-doc-parse/` — 한국 공문서(HWP/HWPX/PDF) → 마크다운 변환. (lk-doc- prefix)
  - `lk-doc-compare/` — 두 공문서 비교 (크로스 포맷 HWP↔HWPX 지원).
  - `lk-doc-form/` — 공문서 양식 인식 (레이블-값 추출).
  - `lk-git-init/` — 대화형 Git 저장소 초기화 (remote, .gitignore, LFS).

## Key Design Decisions

- **하드코딩 금지**: 장비 유형, ID 접두사, 텍스트 레이아웃 등을 코드에 고정하지 않음.
- **기존 스킬 활용**: PDF 처리는 `pdf` 스킬, Excel 생성은 `xlsx` 스킬의 SKILL.md를 먼저 읽고 지침을 따름.
- **kordoc 스킬 래핑**: kordoc CLI(parse)는 직접 호출, 라이브러리 API(compare/form)는 래퍼 스크립트로 호출.
- **네임스페이스 통일**: 모든 스킬이 `lk-doc-*` (문서 도메인) 접두사 사용. `lk-git-init`만 예외.
- **로컬 의존성**: kordoc를 package.json에 로컬 의존성으로 관리. 글로벌 설치 불필요.

## Dependencies

### 필수 스킬 (lk-doc-pdf-extract용)
- `pdf` 스킬: PDF 읽기, OCR, 텍스트 추출
- `xlsx` 스킬: Excel 생성, 서식, 수식

### Node.js (lk-doc-* 스킬용)
- kordoc ^1.6.1 (HWP/HWPX/PDF 파서)
- Node.js >= 18

### Python 패키지 (lk-doc-pdf-extract용)
- pypdf, pdf2image, pdfplumber, openpyxl, Pillow

### 시스템
- poppler-utils (lk-doc-pdf-extract용)

## Testing Changes

1. 플러그인 활성화 후 스킬 자동완성 확인:
   - `/lk-doc-pdf-extract`, `/lk-doc-parse`, `/lk-doc-compare`, `/lk-doc-form`
2. `bash scripts/check-env.sh` — 환경 점검 통과 확인
3. 샘플 HWP/HWPX 파일로 lk-doc-* 스킬 동작 확인
4. 기존 lk-doc-pdf-extract 스킬 충돌 없음 확인
