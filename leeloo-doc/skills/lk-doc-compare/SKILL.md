---
name: lk-doc-compare
description: "공문서(HWP/HWPX/PDF) 비교 — 크로스 포맷 지원"
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

### Phase 2: 결과 해석 (Sonnet Task)

`--json` 옵션일 때는 JSON을 그대로 표시만 한다. 기본(마크다운) 모드에서 통계 + 주요 변경 요약 해석은 Sonnet 서브 에이전트에 위임한다.

**Agent tool 호출 (기본 모드):**
- `subagent_type`: `task`
- `task_model`: `sonnet`
- `prompt`:

```
아래 kordoc-compare 결과를 분석해 사용자용 요약 리포트를 작성하라.

## 입력
### 파일
- file1: {file1_path}
- file2: {file2_path}

### kordoc-compare 출력
{compare_output}

## 출력 형식
## 비교 결과: {file1} vs {file2}

### 통계
- 추가: {N}개 블록
- 삭제: {N}개 블록
- 수정: {N}개 블록
- 동일: {N}개 블록

### 주요 변경 사항
(변경 블록 중 내용 변경이 큰 것, 제목/조항 변경, 숫자/날짜 변경을 2~3줄로 요약. 3~5개 bullet. 원문 인용은 짧게.)

### 상세 diff
{원본 compare_output의 diff 섹션을 그대로 포함}

## 규칙
- 통계 숫자는 kordoc-compare 출력에서만 인용. 추정 금지.
- 주요 변경 사항은 실제 diff에 있는 내용만 요약. hallucination 금지.
- 원문에 없는 해석 추가 금지.
```

**결과 검증 (메인 세션):**
- [ ] 통계 숫자가 kordoc 원문과 일치
- [ ] 주요 변경 사항이 실제 diff에 존재
- [ ] 상세 diff 섹션이 원본 포함

**품질 미달 시 폴백:** 메인 세션이 원본 compare 출력을 그대로 표시.

---

### Phase 3: 분석 제안

비교 결과를 바탕으로 추가 작업을 제안:
- 변경이 많으면: "상세 리뷰가 필요합니다. 특정 섹션을 더 자세히 볼까요?"
- 변경이 없으면: "두 문서의 내용이 동일합니다."
- 양식 필드 변경이 감지되면: "`/lk-doc-form`으로 양식 필드를 비교해 볼까요?"
