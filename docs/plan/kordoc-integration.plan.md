# Plan: kordoc-integration

> 작성일: 2026-03-31 | 작성자: Claude + ChoHeeSung

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | kordoc-integration |
| 목적 | kordoc(한국 공문서 HWP/HWPX/PDF 파서)를 leeloo-util 플러그인에 스킬로 통합 |
| 예상 기간 | 스킬 3개 + 환경 스크립트 |
| 복잡도 | Medium |

## 1. 배경 및 목적

### 문제 정의

- 한국 공문서(HWP 5.x, HWPX, PDF)를 Claude가 직접 읽지 못함.
- 이전 leeloo-hwp 시도는 구조 설계 미흡으로 원복됨(커밋 `423c702`).
- kordoc(v1.6.1)이 이 문제를 이미 해결: HWP/HWPX/PDF → 마크다운 + IRBlock[] 변환, 문서 비교, 양식 인식까지 제공.

### 목표

- kordoc의 7개 MCP 도구 기능을 leeloo-util의 스킬 2~3개로 래핑.
- MCP 상시 로딩 없이 **호출 시에만** 컨텍스트를 사용하는 구조로 통합.
- `lk-doc-*` 네이밍으로 leeloo-util 체계에 편입.

## 2. 의도 발견 로그

| 질문 | 답변 |
|------|------|
| 핵심 목적 | 파싱 + 문서 비교 + 양식 인식 전체 (kordoc 7개 도구 기능 모두) |
| 대상 사용자 | 사내 직원 — 공문서 내용 확인/분석, 데이터 추출→Excel, 문서 변환 파이프라인 |
| 성공 기준 | `/lk-doc-*` 스킬 3개가 자동완성에 노출, HWP/HWPX/PDF 파싱·비교·양식추출 동작 |
| 제약 조건 | 이전 leeloo-hwp 원복 경험 → 구조 설계를 먼저 확정한 후 구현. MCP 대신 스킬 래핑 방식. |

## 3. 탐색한 대안

| 접근법 | 장점 | 단점 | 선택 |
|--------|------|------|------|
| A: MCP 서버 그대로 등록 | 구현 최소, 자동 업데이트 | 도구 7개 상시 컨텍스트 점유(~2K토큰), 출력 형식 제어 불가, 네이밍 불일치 | |
| **B: 스킬로 래핑** | **컨텍스트 절약, 워크플로우 제어, leeloo-n8n 선례, 네이밍 일관성** | kordoc 업데이트 시 스킬도 수정 필요 | **✓** |
| C: 하이브리드 (MCP + 스킬) | 유연성 최대 | 복잡도 높음, 두 레이어 유지보수 | |

**선택**: 접근법 B — leeloo-n8n과 동일 패턴(MCP 도구를 스킬로 래핑). 컨텍스트 절약이 핵심 이유.

## 4. YAGNI 리뷰

제거된 항목:
- 없음 — 사용자가 전체 기능 포함을 요청.

포함된 범위:
- 문서 파싱 (parse_document, detect_format, parse_metadata, parse_pages, parse_table)
- 문서 비교 (compare_documents)
- 양식 인식 (parse_form)
- HWPX 생성 (markdown → hwpx 역변환)

## 5. 구현 범위

### 포함

| 스킬 | 래핑 대상 (kordoc 기능) | 설명 |
|------|------------------------|------|
| `lk-doc-parse` | parse_document, detect_format, parse_metadata, parse_pages, parse_table | 문서 파싱 통합 스킬. 서브커맨드로 분기. |
| `lk-doc-compare` | compare_documents | 두 문서 비교(크로스 포맷 HWP↔HWPX 지원). |
| `lk-doc-form` | parse_form + HWPX 생성 | 양식 인식 + 마크다운→HWPX 역변환. |

### 제외

- kordoc MCP 서버 직접 등록 (접근법 A 기각)
- Watch 모드 / 웹훅 (서버 기능, 스킬 범위 아님)
- kordoc 소스 코드 포크 (npm 패키지로 사용)

## 6. 기술 설계 요약

### 아키텍처

```
사용자 → /lk-doc-parse <file> → 스킬 프롬프트 로딩
                                    ↓
                              Bash: npx kordoc <file> [options]
                                    ↓
                              마크다운 출력 → Claude 분석/요약
```

### 핵심 설계 원칙

1. **kordoc CLI 래핑**: `npx kordoc` CLI를 Bash로 호출. 라이브러리 임포트가 아닌 CLI 호출로 의존성 최소화.
2. **지연 설치**: `scripts/check-env.sh`에 kordoc 설치 확인 추가. 첫 호출 시 `npm install -g kordoc` 안내.
3. **서브커맨드 패턴**: 하나의 스킬 안에서 서브커맨드로 기능 분기 (lk-n8n 패턴과 동일).

### 주요 데이터 흐름

```
[HWP/HWPX/PDF 파일]
    ↓ npx kordoc parse
[마크다운 텍스트 + 메타데이터 JSON]
    ↓ Claude 프롬프트에서 처리
[분석 결과 / 요약 / 구조화 데이터]
```

### 스킬별 CLI 매핑

| 스킬 서브커맨드 | kordoc CLI 명령 |
|----------------|-----------------|
| `/lk-doc-parse <file>` | `npx kordoc <file>` |
| `/lk-doc-parse <file> --pages 1-3` | `npx kordoc <file> --pages 1-3` |
| `/lk-doc-parse <file> --table 0` | `npx kordoc <file> --table 0` |
| `/lk-doc-parse <file> --metadata` | `npx kordoc <file> --metadata` |
| `/lk-doc-parse <file> --format` | `npx kordoc detect <file>` |
| `/lk-doc-compare <file1> <file2>` | `npx kordoc diff <file1> <file2>` |
| `/lk-doc-form <file>` | `npx kordoc form <file>` |
| `/lk-doc-form <file> --to-hwpx` | `npx kordoc generate <input.md> -o output.hwpx` |

## 7. 구현 단계

| Step | 내용 | 파일 | 의존성 |
|------|------|------|--------|
| 1 | 환경 스크립트에 kordoc 설치 확인 추가 | `leeloo-util/scripts/check-env.sh` | 없음 |
| 2 | lk-doc-parse 스킬 작성 | `leeloo-util/skills/lk-doc-parse/SKILL.md` | Step 1 |
| 3 | lk-doc-compare 스킬 작성 | `leeloo-util/skills/lk-doc-compare/SKILL.md` | Step 1 |
| 4 | lk-doc-form 스킬 작성 | `leeloo-util/skills/lk-doc-form/SKILL.md` | Step 1 |
| 5 | plugin.json에 스킬 3개 등록 | `leeloo-util/plugin.json` | Step 2~4 |
| 6 | leeloo-util/CLAUDE.md 업데이트 | `leeloo-util/CLAUDE.md` | Step 5 |
| 7 | 루트 CLAUDE.md 업데이트 (스킬 목록) | `CLAUDE.md` | Step 5 |
| 8 | 테스트: 샘플 HWP/HWPX 파일로 3개 스킬 동작 확인 | — | Step 5 |

## 8. 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| kordoc CLI 인터페이스 변경 | 낮음 | 중간 | 스킬에서 `--version` 체크, 주요 버전 변경 시 스킬 업데이트 |
| 대용량 HWP 파일 파싱 타임아웃 | 중간 | 중간 | Bash 타임아웃 설정(120s), `--pages` 옵션으로 범위 제한 안내 |
| kordoc npm 글로벌 설치 권한 문제 | 낮음 | 낮음 | `npx kordoc`로 실행 시 자동 다운로드, 글로벌 설치 불필요 |
| PDF 파싱 시 pdfjs-dist 미설치 | 중간 | 낮음 | check-env.sh에서 감지, 기존 pdf 스킬과 역할 분리 명시 |
| 이전 leeloo-hwp처럼 구조 설계 문제 재발 | 낮음 | 높음 | Plan 확정 후 구현, leeloo-n8n 검증된 패턴 그대로 적용 |

## 9. 검증 기준

- [ ] `npm ls -g kordoc` 또는 `npx kordoc --version`이 정상 동작
- [ ] `/lk-doc-parse sample.hwp` → 마크다운 출력 확인
- [ ] `/lk-doc-parse sample.hwpx --pages 1-2` → 페이지 범위 파싱 확인
- [ ] `/lk-doc-parse sample.pdf --table 0` → 테이블 추출 확인
- [ ] `/lk-doc-compare file1.hwp file2.hwpx` → 크로스 포맷 diff 출력 확인
- [ ] `/lk-doc-form gov-form.hwp` → 레이블-값 JSON 추출 확인
- [ ] `/lk-doc-form input.md --to-hwpx` → HWPX 파일 생성 확인
- [ ] leeloo-util 플러그인에서 스킬 3개가 `/` 자동완성에 노출
- [ ] 기존 `lk-iu-pdf-extract` 스킬과 충돌 없음
