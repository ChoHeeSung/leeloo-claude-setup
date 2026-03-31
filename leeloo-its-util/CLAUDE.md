# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`leeloo-its-util`은 ITS(지능형교통시스템) 업무 자동화 유틸리티 모음 플러그인입니다.
도면 분석, 시설물 관리, 데이터 변환 등 ITS 현장 업무에 필요한 스킬을 제공합니다.

## Architecture

- `plugin.json` — Plugin manifest (name: "leeloo-its-util", version: "1.0.0").
- `scripts/` — 유틸리티 스크립트:
  - `check-env.sh` — 의존성 일괄 점검 + `--fix` 자동 설치.
- `skills/` — Skills (lk-iu- prefix):
  - `lk-iu-pdf-extract/` — PDF 도면에서 시설물 정보 추출 → Excel 생성.

## Key Design Decisions

- **하드코딩 금지**: 장비 유형, ID 접두사, 텍스트 레이아웃 등을 코드에 고정하지 않음. 모든 패턴은 Phase 1(탐색)에서 실제 도면을 분석하여 자동 발견.
- **기존 스킬 활용**: PDF 처리는 `pdf` 스킬, Excel 생성은 `xlsx` 스킬의 SKILL.md를 먼저 읽고 지침을 따름.
- **4-Phase 워크플로우**: 환경 준비 → 패턴 탐색 → 병렬 추출 → 통합/검증.
- **lk-iu- prefix**: ITS utility 네임스페이스 분리.

## Dependencies

### 필수 스킬 (실행 전 SKILL.md 참조)
- `pdf` 스킬: PDF 읽기, OCR, 텍스트 추출
- `xlsx` 스킬: Excel 생성, 서식, 수식

### Python 패키지
- pypdf, pdf2image, pytesseract, pdfplumber, openpyxl, Pillow

### 시스템
- tesseract-ocr, poppler-utils
- Tesseract data: eng.traineddata, kor.traineddata

## Testing Changes

1. 플러그인 활성화 후 `/lk-iu-pdf-extract` 자동완성 확인
2. 샘플 PDF 도면으로 시설물 추출 테스트
3. 생성된 Excel 시트 구조 및 서식 확인
