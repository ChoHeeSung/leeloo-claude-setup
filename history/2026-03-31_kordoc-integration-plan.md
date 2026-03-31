# kordoc 통합 Plan 작성

**날짜**: 2026-03-31

## 지시 요약

kordoc(한국 공문서 HWP/HWPX/PDF 파서) 레포지토리를 분석하고, leeloo-util 플러그인에 어떻게 통합할지 계획 수립. MCP 그대로 통합 vs 스킬 래핑 비교 검토 요청.

## 작업 내용

### kordoc 분석 결과
- TypeScript 라이브러리 (v1.6.1), Node.js >= 18
- 3가지 인터페이스: 라이브러리, CLI (`npx kordoc`), MCP 서버 (`npx kordoc-mcp`)
- MCP 도구 7개: parse_document, detect_format, parse_metadata, parse_pages, parse_table, compare_documents, parse_form
- 비유: kordoc는 "한국어 공문서 전문 번역가" — HWP라는 한국 고유 포맷을 Claude가 읽을 수 있는 마크다운으로 통역해주는 역할

### 접근법 비교
| 방식 | 컨텍스트 비용 | 제어력 |
|------|-------------|--------|
| MCP 직접 등록 | 높음 (7도구 상시 ~2K토큰) | 낮음 |
| **스킬 래핑** | **낮음 (호출 시에만)** | **높음** |
| 하이브리드 | 높음 | 중간 |

### 결정: 스킬 래핑 (접근법 B)
- leeloo-n8n과 동일 패턴 (MCP 17도구 → 스킬 8개 선례)
- 스킬 3개 설계: `lk-doc-parse`, `lk-doc-compare`, `lk-doc-form`
- kordoc CLI를 Bash로 호출하는 방식

## 결과

- Plan 문서: `docs/plan/kordoc-integration.plan.md`
- PDCA 상태: `kordoc-integration` → plan 단계 등록
