---
name: lk-doc-md2hwpx
description: "Markdown을 한국 공문서 HWPX로 변환. /lk-doc-md2hwpx <input.md> [output.hwpx]"
user_invocable: true
argument-hint: "<input.md> [output.hwpx]"
---

# /lk-doc-md2hwpx — Markdown → HWPX 변환

AI가 작성하거나 외부에서 받은 Markdown 문서를 한컴 오피스에서 열 수 있는 HWPX 파일로 변환한다.
kordoc 라이브러리의 `markdownToHwpx` API를 사용한다.

## 사용 예시

```
/lk-doc-md2hwpx 보고서.md
/lk-doc-md2hwpx 회의록.md 회의록_2026-04-22.hwpx
```

출력 경로 미지정 시 입력 파일과 같은 디렉토리에 같은 이름의 `.hwpx`로 저장한다.

## 지원 요소 (kordoc 2.5.x — 한컴 오피스 표시 기준)

| 요소 | 결과 |
|---|---|
| 제목 (`#`, `##`, ...) | ✅ 정상 |
| 본문 단락 | ✅ 정상 |
| 인용 블록 (`>`) | ✅ 표시 |
| 순서 없는 목록 (`-`) | ✅ `·` prefix로 표시 |
| 테이블 (`| col1 | col2 |`) | ✅ 셀 구조 렌더링 |

## 알려진 제약 (kordoc 2.5.1)

다음은 kordoc upstream 한계로, 사용자가 변환 전에 알고 있어야 한다:

1. **테이블 테두리 미표시** — 셀 구조는 그려지지만 borderFill `width` 단위 표기 이슈로 한글이 테두리를 무시.
2. **인라인 서식 시각 구분 없음** — `**굵게**`, `*기울임*`, `` `코드` ``는 텍스트는 들어가나 한글 화면에서 일반 글자와 동일하게 표시됨.
3. **순서 있는 목록 자동 번호 미작동** — `1. / 2. / 3.`이 모두 `1.`로 표시됨. 워크어라운드: 명시적으로 `(1) / (2) / (3)` 또는 `①②③`로 작성.

위 3건이 중요한 문서라면 변환 후 한컴 오피스에서 직접 보정하거나, kordoc upstream 후속 릴리스를 기다려 재변환할 것.

---

## Procedure

### 인자 파싱

- `<input.md>` (필수) — 입력 markdown 파일 경로
- `[output.hwpx]` (선택) — 출력 hwpx 경로. 미지정 시 입력과 같은 디렉토리에 동일한 basename + `.hwpx`로 저장.

인자 없으면:
```
사용법: /lk-doc-md2hwpx <input.md> [output.hwpx]
예: /lk-doc-md2hwpx 보고서.md
    /lk-doc-md2hwpx 회의록.md 회의록_2026-04-22.hwpx
```
출력 후 중단.

### Phase 0: 환경 확인

1. 입력 파일 존재 여부 확인. 없으면 에러 출력 후 중단.
2. kordoc 설치 확인:
   ```bash
   node -e "require.resolve('kordoc', {paths:['${CLAUDE_PLUGIN_ROOT}/node_modules']})" 2>/dev/null
   ```
   실패 시:
   ```
   kordoc가 설치되지 않았습니다.
   다음 명령으로 설치하세요:
   cd ${CLAUDE_PLUGIN_ROOT} && npm install
   ```
   중단.

### Phase 1: 변환 실행

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/kordoc-md2hwpx.mjs" "<input.md>" ["<output.hwpx>"]
```

스크립트는 다음을 stdout으로 출력한다:
- 출력 경로
- 파일 크기 (bytes)
- 변환 소요 시간 (ms)

비-제로 종료 코드 시 stderr 메시지를 사용자에게 그대로 전달.

### Phase 2: 사용자 안내

변환 성공 후 다음 안내를 표시:

```
변환 완료: <output.hwpx>

한컴 오피스에서 열어 결과를 확인하세요:
  open "<output.hwpx>"      (macOS)
  start "<output.hwpx>"     (Windows)

알려진 제약 (kordoc 2.5.1):
- 테이블 테두리는 화면에 표시되지 않을 수 있습니다.
- **굵게** / *기울임* / `코드` 서식은 시각적으로 구분되지 않습니다.
- 순서 있는 목록(1./2./3.)은 모두 1.로 표시됩니다.
```

배치 처리 (여러 .md 파일을 한 번에 변환)는 사용자가 명시적으로 요청한 경우에만 진행하며, 파일별로 Phase 1을 순차 실행한다.
