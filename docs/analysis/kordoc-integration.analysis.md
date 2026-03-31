# kordoc-integration Gap Analysis

> 분석일: 2026-03-31 | 분석 에이전트: gap-detector

## Match Rate: 97.1%

| 항목 | 결과 |
|------|------|
| 총 검증 항목 | 35개 |
| 통과 (OK) | 33개 |
| 부분 통과 (Partial) | 2개 |
| 미통과 (Gap) | 0개 |
| 설계 외 추가 | 2개 (모두 긍정적) |
| 판정 | **PASS** |

산출식: (33 + 2 x 0.5) / 35 x 100 = 97.1%

## 갭 목록

### 산출물 파일 존재 (12/12 OK)

| 항목 | 설계 | 구현 | 상태 |
|------|------|------|------|
| package.json | kordoc ^1.6.1, type:module, private | 100% 일치 | OK |
| check-env.sh | kordoc 환경 점검 추가 | 76~105행에 구현 | OK |
| kordoc-compare.mjs | compare() 래퍼 | 설계 코드와 문자 수준 일치 | OK |
| kordoc-form.mjs | extractFormFields() 래퍼 | 설계 코드와 문자 수준 일치 | OK |
| kordoc-generate.mjs | markdownToHwpx() 래퍼 | 설계 코드와 문자 수준 일치 | OK |
| kordoc-table.mjs | 테이블 추출 래퍼 | 에러 처리 강화 (빈 테이블 방어) | OK |
| lk-doc-parse SKILL.md | 문서 파싱 스킬 | 설계 인터페이스 100% 구현 | OK |
| lk-doc-compare SKILL.md | 문서 비교 스킬 | 설계 인터페이스 100% 구현 | OK |
| lk-doc-form SKILL.md | 양식 인식 + HWPX 생성 | 설계 인터페이스 100% 구현 | OK |
| plugin.json | v1.1.0 업데이트 | version, description 갱신 | OK |
| leeloo-util/CLAUDE.md | 스킬 정보 반영 | 4개 스킬 + 래퍼 + 의존성 문서화 | OK |
| 루트 CLAUDE.md | leeloo-util 섹션 업데이트 | v1.1.0, skills 4개, 트리 업데이트 | OK |

### 인터페이스 설계 (11/11 OK)

| 항목 | 설계 | 구현 | 상태 |
|------|------|------|------|
| lk-doc-parse 기본 변환 | `npx kordoc <file>` | 구현됨 | OK |
| lk-doc-parse --pages | `--pages <range>` | 구현됨 | OK |
| lk-doc-parse --json | `--format json` | 구현됨 | OK |
| lk-doc-parse --metadata | JSON에서 metadata 추출 | 구현됨 | OK |
| lk-doc-parse --table N | kordoc-table.mjs 호출 | 구현됨 | OK |
| lk-doc-parse 배치 | 다중 파일 | 구현됨 | OK |
| lk-doc-compare 기본 | kordoc-compare.mjs 호출 | 구현됨 | OK |
| lk-doc-compare --json | --json 플래그 전달 | 구현됨 | OK |
| lk-doc-form 양식 인식 | kordoc-form.mjs 호출 | 구현됨 | OK |
| lk-doc-form --json | --json 플래그 전달 | 구현됨 | OK |
| lk-doc-form --to-hwpx | kordoc-generate.mjs 호출 | 구현됨 | OK |

### Partial 항목 (2개)

| 항목 | 설계 | 구현 | 상태 | 비고 |
|------|------|------|------|------|
| kordoc-table.mjs 에러 처리 | `idx >= tables.length` 체크 | + `tables.length === 0` 체크 추가 | Partial | 설계 대비 **개선** 방향 |
| check-env.sh Node.js 버전 | 설계 코드 블록에 없음 | Node.js >= 18 체크 구현 | Partial | 설계 요구사항 충실 반영, 코드 블록에만 누락 |

## 개선 권고

| 우선순위 | 항목 | 설명 |
|----------|------|------|
| Low | check-env.sh 완료 메시지 | `lk-iu-pdf-extract`만 언급 → `lk-doc-*` 스킬도 추가 권고 |

## 결론

**PASS.** 설계 12개 산출물 전체 구현, 35개 검증 항목 중 미구현 0개.
Partial 2건은 모두 설계 대비 개선 방향이므로 수정 불필요.
