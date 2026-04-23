---
name: lk-doc-md2hwpx
description: "Markdown → 한국 공문서 HWPX 변환"
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

## 지원 요소 (kordoc 2.5.2 — 한컴 오피스 표시 기준)

| 요소 | 결과 |
|---|---|
| 제목 (`#`, `##`, ...) | ✅ 정상 (굵게 렌더) |
| 본문 단락 | ✅ 정상 |
| **굵게** (`**text**`) | ✅ `HY견고딕` 페이스로 시각 구분 (v2.5.2 신규) |
| 인용 블록 (`>`) | ✅ 표시 |
| 순서 없는 목록 (`-`) | ✅ `·` prefix로 표시 |
| 순서 있는 목록 (`1. 2. 3.`) | ✅ 자동 번호 · 중첩 · 리셋 정상 (v2.5.2 신규) |
| 테이블 셀 구조 | ✅ 셀 렌더링 (테두리는 제약 — 아래 참조) |

## 알려진 제약 (kordoc 2.5.2)

1. **테이블 테두리 미표시** — 셀 구조는 그려지지만 한컴에서 외곽선이 렌더되지 않음. 원인은 `Contents/header.xml`의 `refList` 자식 정의가 한컴 공식 HWPX와 호환 수준이 아닌 것으로 진단됨 (`borderFills` 블록 자체는 유효; `styles itemCnt=1` / `paraProperties itemCnt=8` 등 정의 부족 의심). 상세 진단은 이슈 [chrisryugj/kordoc#4](https://github.com/chrisryugj/kordoc/issues/4) 참조.
2. **이탤릭 시각 구분 없음** — `*기울임*` 텍스트는 들어가나 일반 텍스트와 동일한 폰트로 표시됨. bold와 달리 전용 폰트 페이스 라우팅이 아직 없음.
3. **인라인 코드 시각 약함** — `` `코드` ``는 `함초롬돋움`으로 폰트는 바뀌지만 배경/음영이 없어 눈에 잘 띄지 않음.

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

알려진 제약 (kordoc 2.5.2):
- 테이블 테두리는 한컴에서 렌더되지 않을 수 있습니다 (header.xml refList 구조 호환 이슈).
- *기울임*과 `` `코드` ``는 시각 구분이 약합니다. **굵게**와 순서 있는 목록은 정상 동작합니다.
```

배치 처리 (여러 .md 파일을 한 번에 변환)는 사용자가 명시적으로 요청한 경우에만 진행하며, 파일별로 Phase 1을 순차 실행한다.
