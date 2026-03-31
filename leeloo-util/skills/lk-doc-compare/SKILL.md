---
name: lk-doc-compare
description: "두 공문서(HWP/HWPX/PDF)를 비교하여 차이점 분석. 크로스 포맷 지원. /lk-doc-compare <file1> <file2> [--json]"
user_invocable: true
argument-hint: "<file1> <file2> [--json]"
---

# /lk-doc-compare — 공문서 비교

두 한국 공문서(HWP/HWPX/PDF)를 IR(중간 표현) 수준에서 비교하여 차이점을 분석한다.
크로스 포맷 비교 지원 — HWP와 HWPX를 직접 비교할 수 있다.

## 사용 예시

```
/lk-doc-compare 원본.hwp 수정본.hwp
/lk-doc-compare v1.hwp v2.hwpx
/lk-doc-compare old.pdf new.pdf --json
```

## 활용 시나리오

- 공문서 개정판 비교 (어떤 내용이 추가/삭제/수정되었는지)
- HWP → HWPX 변환 후 내용 동일성 검증
- 두 버전의 계약서/규정 차이 분석

---

## Procedure

### 인자 파싱

- `<file1>` → 필수. 비교 기준 문서 (원본)
- `<file2>` → 필수. 비교 대상 문서 (수정본)
- `--json` → 선택. diff 결과를 JSON으로 출력

파일이 2개 미만이면:
```
사용법: /lk-doc-compare <file1> <file2> [--json]
예: /lk-doc-compare 원본.hwp 수정본.hwp
    /lk-doc-compare v1.hwp v2.hwpx --json
```
출력 후 중단.

---

### Phase 0: 환경 확인

1. 두 파일 존재 여부 확인. 없으면 에러 출력 후 중단.
2. kordoc 설치 확인:
   ```bash
   node -e "require.resolve('kordoc', {paths:['${CLAUDE_PLUGIN_ROOT}/node_modules']})" 2>/dev/null
   ```
   실패 시 설치 안내 후 중단.

---

### Phase 1: 문서 비교 실행

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/kordoc-compare.mjs" "<file1>" "<file2>" [--json]
```

Bash 타임아웃: 120초.

---

### Phase 2: 결과 표시

#### 기본 출력 (마크다운)

래퍼 스크립트의 마크다운 출력을 그대로 표시하되, Claude가 추가로 해석을 덧붙인다:

```
## 비교 결과: {file1} vs {file2}

### 통계
- 추가: {N}개 블록
- 삭제: {N}개 블록
- 수정: {N}개 블록
- 동일: {N}개 블록

### 주요 변경 사항
{변경된 블록들을 의미 단위로 요약}

### 상세 diff
{래퍼 출력}
```

#### --json 출력

JSON 결과를 코드 블록으로 표시.

---

### Phase 3: 분석 제안

비교 결과를 바탕으로 추가 작업을 제안:
- 변경이 많으면: "상세 리뷰가 필요합니다. 특정 섹션을 더 자세히 볼까요?"
- 변경이 없으면: "두 문서의 내용이 동일합니다."
- 양식 필드 변경이 감지되면: "`/lk-doc-form`으로 양식 필드를 비교해 볼까요?"
