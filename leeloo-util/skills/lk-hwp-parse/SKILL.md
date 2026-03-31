---
name: lk-hwp-parse
description: "HWP/HWPX/PDF 공문서 변환 및 추출. /lk-hwp-parse [doc|metadata|pages|table|form|detect] <file>"
user_invocable: true
argument-hint: "[doc|metadata|pages|table|form|detect] <file> [options]"
---

# /lk-hwp-parse — 공문서 파싱 및 추출

HWP/HWPX/PDF 공문서를 마크다운 변환, 메타데이터 추출, 표/양식 추출 등 다양한 방식으로 파싱합니다.

## 서브커맨드

```
/lk-hwp-parse doc <file>               — 전체 문서를 마크다운으로 변환
/lk-hwp-parse metadata <file>          — 문서 메타데이터 추출 (작성자, 날짜 등)
/lk-hwp-parse pages <range> <file>     — 특정 페이지 범위 추출 (예: 1-3, 2, 1,3,5)
/lk-hwp-parse table <index> <file>     — 특정 인덱스의 표 추출 (0부터 시작)
/lk-hwp-parse form <file>              — 양식 필드 추출 (JSON)
/lk-hwp-parse detect <file>            — 파일 포맷 감지
```

## Procedure

### 사전 체크 (모든 서브커맨드 공통)

모든 서브커맨드 실행 전, Bash로 실행:
```bash
which leeloo-hwp >/dev/null 2>&1 && echo "OK" || echo "NOT_INSTALLED"
```

- `NOT_INSTALLED`인 경우:
  ```
  leeloo-hwp가 설치되어 있지 않습니다.
  /lk-hwp-setup install 을 먼저 실행하세요.
  ```
  중단.

---

### 인자 파싱

사용자 입력에서 서브커맨드와 파일 경로를 파싱합니다:
- `doc <file>` → **doc** 동작
- `metadata <file>` → **metadata** 동작
- `pages <range> <file>` → **pages** 동작
- `table <index> <file>` → **table** 동작
- `form <file>` → **form** 동작
- `detect <file>` → **detect** 동작
- 인자 없음 또는 서브커맨드 없음 → 사용법 안내 후 중단

---

### doc 동작

CLI로 전체 문서를 마크다운으로 변환합니다.

Bash로 실행:
```bash
leeloo-hwp "$FILE"
```

결과를 그대로 출력합니다.

---

### metadata 동작

Node.js 인라인으로 문서 메타데이터를 추출합니다.

**주의**: 패키지명이 `leeloo-hwp` 또는 `kordoc`일 수 있습니다.
`$(npm root -g)/leeloo-hwp`가 없으면 `$(npm root -g)/kordoc`를 시도하세요.

Bash로 실행:
```bash
PKG_PATH=$(npm root -g)/leeloo-hwp
[ -d "$PKG_PATH" ] || PKG_PATH=$(npm root -g)/kordoc
node -e "
const {parse}=require('$PKG_PATH');
const fs=require('fs');
(async()=>{
  const buf=fs.readFileSync('$FILE');
  const result=await parse(buf);
  console.log(JSON.stringify(result.metadata,null,2));
})().catch(e=>{console.error(e.message);process.exit(1)});
"
```

결과 메타데이터를 JSON 형식으로 출력합니다.

---

### pages 동작

CLI로 특정 페이지 범위를 추출합니다.

Bash로 실행:
```bash
leeloo-hwp "$FILE" --pages "$RANGE"
```

결과를 그대로 출력합니다.

---

### table 동작

Node.js 인라인으로 특정 인덱스의 표를 추출하여 마크다운으로 변환합니다.

**주의**: 패키지명이 `leeloo-hwp` 또는 `kordoc`일 수 있습니다.

Bash로 실행:
```bash
PKG_PATH=$(npm root -g)/leeloo-hwp
[ -d "$PKG_PATH" ] || PKG_PATH=$(npm root -g)/kordoc
node -e "
const {parse,blocksToMarkdown}=require('$PKG_PATH');
const fs=require('fs');
(async()=>{
  const buf=fs.readFileSync('$FILE');
  const result=await parse(buf);
  const tables=result.blocks.filter(b=>b.type==='table');
  if(tables.length===0){console.log('표가 없습니다.');return;}
  const idx=$INDEX;
  if(idx>=tables.length){console.log('인덱스 범위 초과. 표 개수: '+tables.length);return;}
  console.log(blocksToMarkdown([tables[idx]]));
})().catch(e=>{console.error(e.message);process.exit(1)});
"
```

결과 표를 마크다운 형식으로 출력합니다.

---

### form 동작

Node.js 인라인으로 양식 필드를 추출합니다.

**주의**: 패키지명이 `leeloo-hwp` 또는 `kordoc`일 수 있습니다.

Bash로 실행:
```bash
PKG_PATH=$(npm root -g)/leeloo-hwp
[ -d "$PKG_PATH" ] || PKG_PATH=$(npm root -g)/kordoc
node -e "
const {parse,extractFormFields}=require('$PKG_PATH');
const fs=require('fs');
(async()=>{
  const buf=fs.readFileSync('$FILE');
  const result=await parse(buf);
  const fields=extractFormFields(result.blocks);
  console.log(JSON.stringify(fields,null,2));
})().catch(e=>{console.error(e.message);process.exit(1)});
"
```

양식 필드를 JSON 형식으로 출력합니다.

---

### detect 동작

Node.js 인라인으로 파일 포맷을 감지합니다.

**주의**: 패키지명이 `leeloo-hwp` 또는 `kordoc`일 수 있습니다.

Bash로 실행:
```bash
PKG_PATH=$(npm root -g)/leeloo-hwp
[ -d "$PKG_PATH" ] || PKG_PATH=$(npm root -g)/kordoc
node -e "
const {detectFormat}=require('$PKG_PATH');
const fs=require('fs');
const buf=fs.readFileSync('$FILE');
const fmt=detectFormat(buf);
console.log(fmt);
"
```

감지된 포맷(예: `hwp`, `hwpx`, `pdf`)을 출력합니다.
