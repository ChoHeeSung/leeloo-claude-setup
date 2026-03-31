# kordoc 통합 구현 (Do Phase)

**날짜**: 2026-03-31

## 지시 요약

kordoc-integration Design 기반으로 전체 구현 실행.

## 작업 내용

### 산출물 목록

| Phase | 파일 | 설명 |
|-------|------|------|
| 1 | `leeloo-util/package.json` | kordoc ^1.6.1 로컬 의존성 |
| 2 | `leeloo-util/scripts/check-env.sh` | kordoc + Node.js 점검 항목 추가 |
| 3 | `scripts/kordoc-compare.mjs` | compare() API 래퍼 |
| 3 | `scripts/kordoc-form.mjs` | extractFormFields() API 래퍼 |
| 3 | `scripts/kordoc-generate.mjs` | markdownToHwpx() API 래퍼 |
| 3 | `scripts/kordoc-table.mjs` | parse() → 테이블 추출 래퍼 |
| 4 | `skills/lk-doc-parse/SKILL.md` | 문서 파싱 스킬 (CLI 래핑) |
| 5 | `skills/lk-doc-compare/SKILL.md` | 문서 비교 스킬 (래퍼 호출) |
| 6 | `skills/lk-doc-form/SKILL.md` | 양식 인식 + HWPX 생성 스킬 |
| 7 | `leeloo-util/plugin.json` | v1.1.0으로 업데이트 |
| 8 | `leeloo-util/CLAUDE.md` | 새 스킬 정보 반영 |
| 8 | `CLAUDE.md` (루트) | leeloo-util 스킬 목록 업데이트 |

### 핵심 코드 스니펫

래퍼 스크립트 공통 패턴 (ESM):
```javascript
import { readFile } from "node:fs/promises";
import { compare } from "kordoc";
const buf = await readFile(file).then(b => b.buffer);
const result = await compare(buf1, buf2);
```

비유: kordoc CLI는 "배달 메뉴"(parse만), 래퍼 스크립트는 "매장 전용 메뉴"(compare/form/generate)를 배달 가능하게 만든 "대리 주문원".

## 결과

- 스킬 3개 생성: lk-doc-parse, lk-doc-compare, lk-doc-form
- 래퍼 스크립트 4개 생성
- leeloo-util v1.0.0 → v1.1.0 업그레이드
- PDCA 상태: do 단계 진행 중
