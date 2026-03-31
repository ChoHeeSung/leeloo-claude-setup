# Design: kordoc-integration

> 작성일: 2026-03-31 | Plan 참조: docs/plan/kordoc-integration.plan.md

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | kordoc-integration |
| 아키텍처 패턴 | CLI 래핑 + Node.js 래퍼 스크립트 (라이브러리 API 호출) |
| 주요 기술 스택 | kordoc (npm), Node.js >= 18, Bash |

## Plan 대비 설계 변경점

> **중요**: Plan 단계에서는 kordoc CLI가 diff/form/generate 서브커맨드를 제공한다고 가정했으나,
> 실제 분석 결과 **CLI는 파일 변환(parse)과 watch만 제공**합니다.
> `compare`, `extractFormFields`, `markdownToHwpx`는 **라이브러리 API로만** 존재합니다.
>
> 따라서 스킬 3개 중:
> - `lk-doc-parse`: CLI 직접 래핑 가능 ✅
> - `lk-doc-compare`, `lk-doc-form`: **래퍼 스크립트 필요** (라이브러리 API 호출)

---

## 1. 시스템 아키텍처

### 컴포넌트 구조

```
leeloo-util/
├── plugin.json                          # 스킬 3개 추가 등록
├── scripts/
│   ├── check-env.sh                     # kordoc 설치 확인 추가
│   ├── kordoc-compare.mjs               # NEW: compare() 래퍼
│   ├── kordoc-form.mjs                  # NEW: extractFormFields() 래퍼
│   └── kordoc-generate.mjs              # NEW: markdownToHwpx() 래퍼
└── skills/
    ├── lk-iu-pdf-extract/SKILL.md       # 기존 (변경 없음)
    ├── lk-doc-parse/SKILL.md            # NEW: 문서 파싱
    ├── lk-doc-compare/SKILL.md          # NEW: 문서 비교
    └── lk-doc-form/SKILL.md             # NEW: 양식 인식 + HWPX 생성
```

### 의존성 다이어그램

```
┌─────────────────────┐
│  /lk-doc-parse      │ ──→ npx kordoc <file> [options]     (CLI 직접)
└─────────────────────┘
┌─────────────────────┐
│  /lk-doc-compare    │ ──→ node scripts/kordoc-compare.mjs (래퍼)
└─────────────────────┘          ↓
┌─────────────────────┐     import { compare, parse,
│  /lk-doc-form       │ ──→ node scripts/kordoc-form.mjs    (래퍼)
└─────────────────────┘     extractFormFields } from "kordoc"
                                 ↓
                            ┌─────────┐
                            │ kordoc  │  (npm 패키지, 로컬 설치)
                            │ v1.6.1  │
                            └─────────┘
```

### 호출 방식 결정 근거

| 기능 | CLI 지원 | 라이브러리 API | 채택 방식 |
|------|---------|---------------|----------|
| parse (변환) | ✅ `kordoc <file>` | `parse(buffer)` | **CLI** — 가장 단순 |
| detect format | ✅ 자동 감지 (parse 내부) | `detectFormat(buffer)` | **CLI** — parse 결과에 포함 |
| pages 범위 | ✅ `--pages 1-3` | `parse(buf, {pages})` | **CLI** |
| metadata | ❌ (parse 결과에 포함) | `parse().metadata` | **CLI** `--format json` → metadata 필드 |
| table 추출 | ❌ (CLI에 없음) | `parse().blocks` 필터링 | **래퍼** — blocks에서 table 타입 필터 |
| compare (diff) | ❌ | `compare(bufA, bufB)` | **래퍼** |
| form fields | ❌ | `extractFormFields(blocks)` | **래퍼** |
| markdown→HWPX | ❌ | `markdownToHwpx(md)` | **래퍼** |

---

## 2. 데이터 모델

### kordoc 핵심 타입 (스킬에서 다루는 범위)

```
ParseResult (성공 시)
├── fileType: "hwp" | "hwpx" | "pdf"
├── markdown: string              ← lk-doc-parse 기본 출력
├── blocks: IRBlock[]             ← lk-doc-form, lk-doc-compare 내부 사용
├── metadata: DocumentMetadata    ← lk-doc-parse --metadata
└── warnings: string[]

DiffResult
├── stats: { added, removed, modified, unchanged }
└── diffs: BlockDiff[]            ← lk-doc-compare 출력

FormResult
├── fields: FormField[]           ← lk-doc-form 출력
│   └── { label, value, row, col }
└── confidence: number (0~1)
```

---

## 3. 인터페이스 설계

### 3.1 스킬 CLI 인터페이스

#### lk-doc-parse

```
/lk-doc-parse <file>                    # 마크다운으로 변환 (stdout)
/lk-doc-parse <file> --pages <range>    # 특정 페이지만
/lk-doc-parse <file> --json             # JSON 출력 (blocks + metadata)
/lk-doc-parse <file> --metadata         # 메타데이터만 (JSON → metadata 필드)
/lk-doc-parse <file> --table <N>        # N번째 테이블만 추출
/lk-doc-parse <file1> <file2> ...       # 배치 변환
```

실행 매핑:
```bash
# 기본 / --pages / --json / 배치
npx kordoc <file> [--pages <range>] [--format json]

# --metadata (CLI로 JSON 출력 후 metadata 필드 추출)
npx kordoc <file> --format json | node -e "
  const r=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  console.log(JSON.stringify(r.metadata,null,2))"

# --table N (래퍼 스크립트)
node ${PLUGIN_ROOT}/scripts/kordoc-table.mjs <file> <N>
```

#### lk-doc-compare

```
/lk-doc-compare <file1> <file2>         # 두 문서 비교 (크로스 포맷 가능)
/lk-doc-compare <file1> <file2> --json  # diff 결과를 JSON으로 출력
```

실행 매핑:
```bash
node ${PLUGIN_ROOT}/scripts/kordoc-compare.mjs <file1> <file2> [--json]
```

#### lk-doc-form

```
/lk-doc-form <file>                     # 양식 인식 (레이블-값 쌍 추출)
/lk-doc-form <file> --json              # JSON 출력
/lk-doc-form <input.md> --to-hwpx <output.hwpx>  # 마크다운→HWPX 역변환
```

실행 매핑:
```bash
# 양식 인식
node ${PLUGIN_ROOT}/scripts/kordoc-form.mjs <file> [--json]

# HWPX 생성
node ${PLUGIN_ROOT}/scripts/kordoc-generate.mjs <input.md> <output.hwpx>
```

### 3.2 래퍼 스크립트 설계

모든 래퍼 스크립트는 동일 패턴을 따릅니다:

```javascript
// 공통 패턴 (ESM)
import { readFile, writeFile } from "node:fs/promises";
import { /* 필요한 함수 */ } from "kordoc";

const [,, ...args] = process.argv;
// 인자 파싱 → 파일 읽기 → kordoc API 호출 → 결과 출력
```

#### scripts/kordoc-compare.mjs

```javascript
#!/usr/bin/env node
// 두 문서 비교: node kordoc-compare.mjs <file1> <file2> [--json]
import { readFile } from "node:fs/promises";
import { compare } from "kordoc";

const [,, file1, file2, ...flags] = process.argv;
if (!file1 || !file2) { console.error("Usage: node kordoc-compare.mjs <file1> <file2> [--json]"); process.exit(1); }

const [buf1, buf2] = await Promise.all([
  readFile(file1).then(b => b.buffer),
  readFile(file2).then(b => b.buffer),
]);

const result = await compare(buf1, buf2);

if (flags.includes("--json")) {
  console.log(JSON.stringify(result, null, 2));
} else {
  // 사람이 읽기 쉬운 형식
  const { stats, diffs } = result;
  console.log(`## 비교 결과\n`);
  console.log(`- 추가: ${stats.added}개`);
  console.log(`- 삭제: ${stats.removed}개`);
  console.log(`- 수정: ${stats.modified}개`);
  console.log(`- 동일: ${stats.unchanged}개\n`);
  for (const d of diffs) {
    if (d.type === "unchanged") continue;
    console.log(`[${d.type}] ${d.before?.text ?? ""} → ${d.after?.text ?? ""}`);
  }
}
```

#### scripts/kordoc-form.mjs

```javascript
#!/usr/bin/env node
// 양식 인식: node kordoc-form.mjs <file> [--json]
import { readFile } from "node:fs/promises";
import { parse, extractFormFields } from "kordoc";

const [,, file, ...flags] = process.argv;
if (!file) { console.error("Usage: node kordoc-form.mjs <file> [--json]"); process.exit(1); }

const buf = await readFile(file).then(b => b.buffer);
const parsed = await parse(buf);
if (!parsed.success) { console.error(`파싱 실패: ${parsed.error}`); process.exit(1); }

const result = extractFormFields(parsed.blocks);

if (flags.includes("--json")) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`## 양식 인식 결과 (신뢰도: ${(result.confidence * 100).toFixed(0)}%)\n`);
  console.log(`| 레이블 | 값 |`);
  console.log(`|--------|-----|`);
  for (const f of result.fields) {
    console.log(`| ${f.label} | ${f.value} |`);
  }
}
```

#### scripts/kordoc-generate.mjs

```javascript
#!/usr/bin/env node
// HWPX 생성: node kordoc-generate.mjs <input.md> <output.hwpx>
import { readFile, writeFile } from "node:fs/promises";
import { markdownToHwpx } from "kordoc";

const [,, input, output] = process.argv;
if (!input || !output) { console.error("Usage: node kordoc-generate.mjs <input.md> <output.hwpx>"); process.exit(1); }

const md = await readFile(input, "utf8");
const hwpxBuf = await markdownToHwpx(md);
await writeFile(output, Buffer.from(hwpxBuf));
console.log(`HWPX 생성 완료: ${output}`);
```

#### scripts/kordoc-table.mjs

```javascript
#!/usr/bin/env node
// 테이블 추출: node kordoc-table.mjs <file> <index>
import { readFile } from "node:fs/promises";
import { parse } from "kordoc";

const [,, file, indexStr] = process.argv;
if (!file) { console.error("Usage: node kordoc-table.mjs <file> [index]"); process.exit(1); }

const idx = parseInt(indexStr ?? "0", 10);
const buf = await readFile(file).then(b => b.buffer);
const parsed = await parse(buf);
if (!parsed.success) { console.error(`파싱 실패: ${parsed.error}`); process.exit(1); }

const tables = parsed.blocks.filter(b => b.type === "table");
if (idx >= tables.length) { console.error(`테이블 ${idx}번 없음 (총 ${tables.length}개)`); process.exit(1); }

const t = tables[idx].table;
// 마크다운 테이블로 출력
const header = t.cells[0].map(c => c.text);
console.log(`| ${header.join(" | ")} |`);
console.log(`| ${header.map(() => "---").join(" | ")} |`);
for (let r = 1; r < t.rows; r++) {
  console.log(`| ${t.cells[r].map(c => c.text).join(" | ")} |`);
}
```

---

## 4. 환경 설정

### check-env.sh 추가 항목

```bash
# --- kordoc ---
echo "## kordoc (한국 공문서 파서)"

if command -v npx &>/dev/null && npx kordoc --version &>/dev/null 2>&1; then
  VER=$(npx kordoc --version 2>&1)
  ok "kordoc ($VER)"
else
  fail "kordoc 미설치"
  if $FIX_MODE; then
    echo "       → 설치 시도: npm install -g kordoc"
    npm install -g kordoc && ok "kordoc 설치 완료" || fail "kordoc 설치 실패"
  fi
fi
```

### kordoc 의존성 설치 위치

래퍼 스크립트에서 `import "kordoc"`를 사용하므로, kordoc가 resolve 가능해야 합니다.

| 방식 | 장점 | 단점 | 채택 |
|------|------|------|------|
| `npm install -g kordoc` | 어디서든 `import "kordoc"` 가능 | 글로벌 설치 필요 | |
| `npx`로 CLI만 사용 | 설치 불필요 | 래퍼에서 라이브러리 import 불가 | |
| **`leeloo-util/package.json` + `npm install`** | **로컬 의존성으로 깔끔**, 래퍼 import 가능 | plugin 디렉토리에 node_modules 생성 | **✓** |

**결정**: `leeloo-util/package.json`에 kordoc 의존성 추가 → `npm install` 후 래퍼 스크립트에서 로컬 import.

```json
{
  "private": true,
  "type": "module",
  "dependencies": {
    "kordoc": "^1.6.1"
  }
}
```

---

## 5. 보안 고려사항

- kordoc 자체에 보안 하드닝 내장 (ZIP bomb 방지, XXE 방지, 경로 순회 방지, 500MB 크기 제한)
- 래퍼 스크립트는 사용자가 제공한 파일 경로만 사용 — 경로 검증은 kordoc에 위임
- `markdownToHwpx`로 생성된 HWPX는 로컬 파일로만 저장 — 네트워크 전송 없음

---

## 6. 성능 고려사항

- **대용량 파일**: kordoc 500MB 제한 내장. 스킬에서 추가 제한 불필요.
- **Bash 타임아웃**: 스킬 프롬프트에서 Bash 호출 시 `timeout` 파라미터 120초 설정 권장.
- **npx 콜드 스타트**: 첫 실행 시 npx가 패키지를 다운로드하므로 느림. `npm install -g` 또는 로컬 설치로 해결.
- **PDF 파싱**: pdfjs-dist 선택 설치. 미설치 시 PDF 파싱 불가 — check-env.sh에서 안내.

---

## 7. 테스트 전략

### 단위 테스트 (래퍼 스크립트)

```bash
# kordoc-compare.mjs
node scripts/kordoc-compare.mjs sample1.hwp sample2.hwpx
node scripts/kordoc-compare.mjs sample1.hwp sample2.hwpx --json

# kordoc-form.mjs
node scripts/kordoc-form.mjs gov-form.hwp
node scripts/kordoc-form.mjs gov-form.hwp --json

# kordoc-generate.mjs
node scripts/kordoc-generate.mjs input.md output.hwpx
```

### 통합 테스트 (스킬 호출)

```
/lk-doc-parse sample.hwp                     → 마크다운 출력 확인
/lk-doc-parse sample.hwpx --pages 1-2        → 페이지 범위 파싱
/lk-doc-parse sample.hwp --metadata           → 메타데이터 JSON
/lk-doc-parse sample.hwp --table 0            → 테이블 마크다운
/lk-doc-compare file1.hwp file2.hwpx          → diff 결과
/lk-doc-form gov-form.hwp                     → 양식 필드 테이블
/lk-doc-form input.md --to-hwpx output.hwpx   → HWPX 파일 생성
```

### E2E 테스트

- leeloo-util 플러그인 활성화 후 `/` 자동완성에 `lk-doc-parse`, `lk-doc-compare`, `lk-doc-form` 노출 확인
- 기존 `lk-iu-pdf-extract` 스킬과 충돌 없음 확인

---

## 8. 구현 순서

| Phase | 내용 | 산출물 | 의존성 |
|-------|------|--------|--------|
| 1 | kordoc 로컬 의존성 설정 | `leeloo-util/package.json` 생성, `npm install` | 없음 |
| 2 | check-env.sh에 kordoc 항목 추가 | `scripts/check-env.sh` 수정 | Phase 1 |
| 3 | 래퍼 스크립트 4개 작성 | `scripts/kordoc-{compare,form,generate,table}.mjs` | Phase 1 |
| 4 | lk-doc-parse SKILL.md 작성 | `skills/lk-doc-parse/SKILL.md` | Phase 2 |
| 5 | lk-doc-compare SKILL.md 작성 | `skills/lk-doc-compare/SKILL.md` | Phase 3 |
| 6 | lk-doc-form SKILL.md 작성 | `skills/lk-doc-form/SKILL.md` | Phase 3 |
| 7 | plugin.json 업데이트 | `plugin.json` 스킬 3개 추가 | Phase 4~6 |
| 8 | CLAUDE.md 업데이트 (leeloo-util + 루트) | `leeloo-util/CLAUDE.md`, `CLAUDE.md` | Phase 7 |
| 9 | 테스트 | 샘플 HWP/HWPX/PDF로 검증 | Phase 7 |

---

## 9. 기술 결정 요약

| 결정 | 이유 | 대안 |
|------|------|------|
| CLI 래핑 (parse) | kordoc CLI가 이미 완성도 높음 | 라이브러리 직접 호출 (불필요한 복잡도) |
| 래퍼 스크립트 (compare/form/generate) | CLI에 해당 기능 없음, 라이브러리 API만 존재 | MCP 서버 호출 (컨텍스트 비용), 인라인 node -e (유지보수 어려움) |
| ESM (.mjs) | kordoc이 ESM 패키지 | CJS (.cjs) — kordoc ESM과 호환 문제 |
| 로컬 package.json 의존성 | 래퍼에서 import 가능, 버전 고정 | 글로벌 설치 (버전 관리 어려움), npx (래퍼에서 import 불가) |
| `lk-doc-*` 네이밍 | 기존 `lk-iu-*`와 네임스페이스 분리, 문서(doc) 도메인 명확 | `lk-iu-hwp-*` (너무 길고 HWP에 한정) |
