# kordoc 통합 Design 작성

**날짜**: 2026-03-31

## 지시 요약

kordoc-integration Plan을 기반으로 상세 설계 문서 작성.

## 작업 내용

### Plan 대비 주요 변경 발견

Plan에서는 kordoc CLI가 `diff`, `form`, `generate` 서브커맨드를 제공한다고 가정했으나, **실제 CLI는 parse + watch만 지원**. `compare`, `extractFormFields`, `markdownToHwpx`는 라이브러리 API로만 존재.

비유: 식당(kordoc)이 배달(CLI)은 메인 메뉴만 해주고, 특별 메뉴(diff, form)는 직접 방문(라이브러리 호출)해야 주문 가능한 상황. 그래서 "대리 주문원"(래퍼 스크립트)을 만들어 특별 메뉴도 배달 받을 수 있게 설계.

### 설계 핵심

| 스킬 | 호출 방식 | 이유 |
|------|----------|------|
| lk-doc-parse | `npx kordoc <file>` CLI 직접 | CLI에서 완벽 지원 |
| lk-doc-compare | `node scripts/kordoc-compare.mjs` | CLI 미지원, 라이브러리 API |
| lk-doc-form | `node scripts/kordoc-form.mjs` | CLI 미지원, 라이브러리 API |

- 래퍼 스크립트 4개: compare, form, generate, table (.mjs ESM)
- kordoc 의존성: `leeloo-util/package.json`에 로컬 의존성으로 관리

## 결과

- Design 문서: `docs/design/kordoc-integration.design.md`
- PDCA 상태: `kordoc-integration` → design 단계로 진행
