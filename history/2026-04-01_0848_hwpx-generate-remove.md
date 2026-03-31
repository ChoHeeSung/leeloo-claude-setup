# HWPX 역변환 기능 제거

**날짜**: 2026-04-01 08:48

## 지시 요약

kordoc의 `markdownToHwpx` 기능이 한글 프로그램에서 열리지 않는 HWPX를 생성하여, lk-doc-form 스킬에서 `--to-hwpx` 기능 제거.

## 작업 내용

### 원인

kordoc v1.6.1의 `markdownToHwpx`가 생성하는 HWPX에 한글 프로그램 필수 요소 누락:
- `META-INF/container.xml`, `header.xml`, `version.xml` 등 메타파일 미생성
- 테이블 XML에 `rowCnt`, `colCnt`, `cellSz`, `cellAddr`, `subList` 등 필수 속성 없음
- 래퍼에서 후처리로 주입 시도했으나, 테이블 구조까지는 한글 호환 불가

kordoc 업스트림 이슈 등록: https://github.com/chrisryugj/kordoc/issues/4

### 변경 내역

| 파일 | 변경 |
|------|------|
| `lk-doc-form/SKILL.md` | `--to-hwpx` 모드 전체 제거, 양식 인식 전용으로 축소 |
| `scripts/kordoc-generate.mjs` | 삭제 |
| `leeloo-util/CLAUDE.md` | generate 래퍼 및 HWPX 역변환 언급 제거 |
| `README.md` | lk-doc-form 설명에서 HWPX 역변환 제거 |

## 결과

- lk-doc-form: 양식 인식(레이블-값 추출) 전용 스킬로 축소
- HWPX 역변환: kordoc 업스트림 수정 대기 (issue #4)
