---
name: lk-doc-parse
description: "한국 공문서(HWP/HWPX/PDF)를 마크다운으로 변환. /lk-doc-parse <file> [--pages <range>] [--json] [--metadata] [--table <N>]"
user_invocable: true
argument-hint: "<file> [--pages <range>] [--json] [--metadata] [--table <N>]"
---

# /lk-doc-parse — 한국 공문서 파싱

한국 공문서(HWP 5.x, HWPX, PDF)를 마크다운 또는 JSON으로 변환하는 스킬.
kordoc 라이브러리를 사용하며, 포맷은 매직 바이트로 자동 감지한다.

## 사용 예시

```
/lk-doc-parse 공문서.hwp
/lk-doc-parse 계획서.hwpx --pages 1-3
/lk-doc-parse 보고서.pdf --json
/lk-doc-parse 서식.hwp --metadata
/lk-doc-parse 도면.hwpx --table 0
/lk-doc-parse file1.hwp file2.hwpx file3.pdf
```

## 지원 포맷

| 포맷 | 확장자 | 감지 방식 |
|------|--------|----------|
| HWP 5.x | .hwp | OLE2 매직 바이트 |
| HWPX | .hwpx | ZIP 매직 바이트 |
| PDF | .pdf | %PDF 매직 바이트 |

---

## Procedure

### 인자 파싱

사용자 입력에서 파일 경로와 옵션을 파싱한다:
- `<file>` (또는 `<file1> <file2> ...`) → 필수. 문서 파일 경로
- `--pages <range>` → 선택. 페이지/섹션 범위 (예: "1-3", "1,3,5")
- `--json` → 선택. JSON 형식 출력 (blocks + metadata)
- `--metadata` → 선택. 메타데이터만 출력
- `--table <N>` → 선택. N번째 테이블만 추출 (0-based)

파일 경로가 없으면:
```
사용법: /lk-doc-parse <file> [--pages <range>] [--json] [--metadata] [--table <N>]
예: /lk-doc-parse 공문서.hwp
    /lk-doc-parse 계획서.hwpx --pages 1-3
    /lk-doc-parse 서식.hwp --metadata
```
출력 후 중단.

---

### Phase 0: 환경 확인

1. 파일 존재 여부 확인. 없으면 에러 출력 후 중단.
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

---

### Phase 1: 문서 변환

옵션에 따라 분기:

#### 기본 (마크다운 변환)
```bash
npx kordoc "<file>" [--pages <range>]
```
- 출력을 사용자에게 마크다운으로 표시.
- 배치 모드 (파일 여러 개): 각 파일을 순차 실행.

#### --json (JSON 출력)
```bash
npx kordoc "<file>" --format json [--pages <range>]
```
- JSON 결과를 코드 블록으로 표시.

#### --metadata (메타데이터만)
```bash
npx kordoc "<file>" --format json
```
- JSON 출력에서 metadata 필드만 추출하여 표시:
  - title, author, creator, createdAt, modifiedAt, pageCount, version

#### --table N (테이블 추출)
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/kordoc-table.mjs" "<file>" <N>
```
- N번째 테이블을 마크다운 테이블로 출력.
- N 미지정 시 기본값 0 (첫 번째 테이블).

---

### Phase 2: 결과 표시

변환 결과를 사용자에게 표시한다.

성공 시:
```
## 변환 완료: {파일명}

- 포맷: {HWP/HWPX/PDF}
- 페이지: {pageCount}장

{마크다운 내용 또는 JSON}
```

경고가 있으면 함께 표시:
```
> 경고: {warning 내용}
```

실패 시 에러 메시지와 함께 가능한 원인을 안내:
- ENCRYPTED → "암호화된 문서입니다. 비밀번호를 해제한 후 다시 시도하세요."
- DRM_PROTECTED → "DRM이 적용된 문서입니다."
- UNSUPPORTED_FORMAT → "지원하지 않는 포맷입니다. HWP, HWPX, PDF만 지원합니다."
