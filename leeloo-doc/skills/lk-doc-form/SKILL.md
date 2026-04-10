---
name: lk-doc-form
description: "공문서 양식 인식(레이블-값 추출). /lk-doc-form <file> [--json]"
user_invocable: true
argument-hint: "<file> [--json]"
---

# /lk-doc-form — 양식 인식

한국 공문서(HWP/HWPX/PDF)에서 정부 양식의 레이블-값 쌍을 자동 인식하여 추출한다.

## 사용 예시

```
/lk-doc-form 신청서.hwp
/lk-doc-form 보고서양식.hwpx --json
```

## 활용 시나리오

- 정부 서식에서 레이블-값 쌍 자동 추출 (예: "성명: 홍길동", "신청일: 2026-03-31")
- 추출된 양식 데이터를 구조화하여 Excel이나 DB에 저장

---

## Procedure

### 인자 파싱

- `<file>` → 필수. HWP/HWPX/PDF 파일 경로
- `--json` → 선택. 결과를 JSON으로 출력

인자가 없으면:
```
사용법: /lk-doc-form <file> [--json]
예: /lk-doc-form 신청서.hwp
    /lk-doc-form 보고서양식.hwpx --json
```
출력 후 중단.

---

### Phase 0: 환경 확인

1. 입력 파일 존재 여부 확인. 없으면 에러 출력 후 중단.
2. kordoc 설치 확인:
   ```bash
   node -e "require.resolve('kordoc', {paths:['${CLAUDE_PLUGIN_ROOT}/node_modules']})" 2>/dev/null
   ```
   실패 시 설치 안내 후 중단.

---

### Phase 1A: 양식 인식 (--to-hwpx 없을 때)

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/kordoc-form.mjs" "<file>" [--json]
```

Bash 타임아웃: 120초.

#### 결과 표시

래퍼 출력을 기반으로 표시:

```
## 양식 인식 결과: {파일명}

신뢰도: {confidence}%

| 레이블 | 값 |
|--------|-----|
| 성명 | 홍길동 |
| 신청일 | 2026-03-31 |
| ... | ... |
```

신뢰도가 50% 미만이면 경고:
```
> 신뢰도가 낮습니다. 이 문서는 정형화된 양식이 아닐 수 있습니다.
> `/lk-doc-parse`로 전체 내용을 확인해 보세요.
```

