---
name: lk-hwp-compare
description: "두 공문서(HWP/HWPX/PDF)를 비교하여 변경사항 분석. /lk-hwp-compare <fileA> <fileB>"
user_invocable: true
argument-hint: "<fileA> <fileB>"
---

# /lk-hwp-compare — 공문서 비교 분석

두 HWP/HWPX/PDF 공문서를 비교하여 추가·삭제·수정·유지된 내용을 분석합니다.

## 사용법

```
/lk-hwp-compare <fileA> <fileB>
```

예시:
```
/lk-hwp-compare 계약서_v1.hwp 계약서_v2.hwp
/lk-hwp-compare 원본.pdf 수정본.pdf
```

## Procedure

### 사전 체크

Bash로 실행:
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

사용자 입력에서 두 파일 경로를 파싱합니다:
- `<fileA> <fileB>` → 두 파일 경로 추출
- 파일 경로가 하나만 있거나 없는 경우:
  ```
  사용법: /lk-hwp-compare <fileA> <fileB>
  두 파일 경로를 모두 입력하세요.
  ```
  중단.

---

### 비교 실행

Node.js 인라인으로 두 문서를 비교합니다.

**주의**: 패키지명이 `leeloo-hwp` 또는 `kordoc`일 수 있습니다.
`$(npm root -g)/leeloo-hwp`가 없으면 `$(npm root -g)/kordoc`를 시도하세요.

Bash로 실행:
```bash
PKG_PATH=$(npm root -g)/leeloo-hwp
[ -d "$PKG_PATH" ] || PKG_PATH=$(npm root -g)/kordoc
node -e "
const {compare}=require('$PKG_PATH');
const fs=require('fs');
(async()=>{
  const bufA=fs.readFileSync('$FILE_A');
  const bufB=fs.readFileSync('$FILE_B');
  const result=await compare(bufA,bufB);
  console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.message);process.exit(1)});
"
```

---

### 결과 표시

비교 결과를 다음 형식으로 정리하여 출력합니다:

```
문서 비교 결과

파일 A: {fileA}
파일 B: {fileB}

## 변경 통계

| 항목 | 수 |
|------|----|
| 추가됨 (added) | {stats.added} |
| 삭제됨 (removed) | {stats.removed} |
| 수정됨 (modified) | {stats.modified} |
| 유지됨 (unchanged) | {stats.unchanged} |

## 변경 상세

{diffs 배열의 각 항목을 type별로 분류하여 표시}
```

- `diffs`가 비어있으면: "두 문서의 내용이 동일합니다."
- 오류 발생 시: 오류 메시지를 그대로 표시하고 `/lk-hwp-setup status`로 설치 상태 확인 안내.
