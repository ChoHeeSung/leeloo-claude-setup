# Plan: leeloo-hwp-plugin

> 작성일: 2026-03-31 | 작성자: Claude + heesung

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | leeloo-hwp-plugin |
| 목적 | leeloo-hwp(kordoc 포크) CLI를 skill로 래핑하여 HWP/HWPX/PDF 공문서 변환 제공 |
| 예상 기간 | 1일 |
| 복잡도 | Low |

회사 Bitbucket 포크(leeloo-hwp)를 `npm install -g`로 1회 설치 후, 스킬에서 `leeloo-hwp` CLI를 직접 호출한다. MCP 서버, vendor 디렉토리, clone+build 모두 불필요.

## 1. 배경 및 목적

### 문제 정의
- kordoc는 HWP/HWPX/PDF 공문서를 마크다운으로 변환하는 도구
- MCP 서버를 띄우면 작동하지만, 로컬 파일 파싱에 MCP 오버헤드가 불필요
- CLI가 모든 기능을 제공하므로 skill에서 직접 호출이 더 효율적

### 목표
- `/lk-hwp-` skill 자동완성으로 모든 기능 접근
- `npm install -g` 1회 설치 후 `leeloo-hwp` CLI 직접 호출
- `leeloo-its-util` → `leeloo-util`로 확장하여 ITS + HWP 스킬 공존

## 2. 의도 발견 로그

| 질문 | 답변 |
|------|------|
| 핵심 목적 | kordoc MCP 7개 도구 전체를 skill로 래핑 |
| 네이밍 | 플러그인: leeloo-util (확장), 접두사: lk-hwp- |
| Skill 구성 | 3개 skill (setup, parse, compare) |
| 설치 방식 | `npm install -g git+https://bitbucket.org/leeloocoltd/leeloo-hwp.git` |
| 소스 관리 | Bitbucket leeloocoltd/leeloo-hwp (kordoc 포크) |

## 3. 탐색한 대안

| 접근법 | 요약 | 선택 |
|--------|------|------|
| A: MCP 서버 래핑 | kordoc-mcp → MCP 도구 호출 | |
| B: vendor/ clone+build | 플러그인 내 소스 내장 | |
| C: npm install -g | 글로벌 설치 1회 → CLI 직접 호출 | ✓ |
| D: npx leeloo-hwp | 실행 시 자동 다운로드 (npm 퍼블리시 필요) | |

**선택**: C — Bitbucket에만 있으므로 `npm install -g git+URL`로 1회 설치. vendor/ 디렉토리, .gitignore, build 과정 모두 불필요.

## 4. YAGNI 리뷰

제거된 항목: 없음 (7개 도구 전체 포함)

## 5. 구현 범위

### 포함

**플러그인 리네이밍**: `leeloo-its-util` → `leeloo-util`

**Skill 구성** (기존 1개 + 신규 3개 = 4개 skill):

| Skill | 서브커맨드 | 설명 |
|-------|-----------|------|
| `lk-iu-pdf-extract` | (기존 유지) | ITS 도면 PDF → 시설물 Excel |
| `lk-hwp-setup` | status, install | leeloo-hwp CLI 설치 확인 + `npm install -g` |
| `lk-hwp-parse` | doc, metadata, pages, table, form, detect | 문서 변환/추출 (6개 서브커맨드) |
| `lk-hwp-compare` | (기본) | 두 문서 비교 |

### 제외
- MCP 서버, vendor/ 디렉토리, clone+build, .gitignore
- hooks, agents

## 6. 기술 설계 요약

### 아키텍처

```
leeloo-util/                         # 기존 leeloo-its-util 확장
├── plugin.json                      # name: "leeloo-util"
├── CLAUDE.md
├── scripts/
│   └── check-env.sh                 # 기존 ITS 환경 점검
└── skills/
    ├── lk-iu-pdf-extract/SKILL.md   # 기존 ITS (그대로 유지)
    ├── lk-hwp-setup/SKILL.md        # 신규: 설치 확인 + npm install -g
    ├── lk-hwp-parse/SKILL.md        # 신규: 문서 변환/추출
    └── lk-hwp-compare/SKILL.md      # 신규: 문서 비교
```

### 설치 흐름 (lk-hwp-setup install)

```bash
npm install -g git+https://bitbucket.org/leeloocoltd/leeloo-hwp.git
```

### 사전 체크

```bash
which leeloo-hwp >/dev/null 2>&1 || echo "leeloo-hwp 미설치. /lk-hwp-setup install 실행 필요"
```

### CLI 매핑

| 서브커맨드 | CLI 명령 | 출력 |
|-----------|----------|------|
| doc | `leeloo-hwp <file>` | 마크다운 전문 |
| metadata | `leeloo-hwp --metadata <file>` | 제목/작성자/날짜 JSON |
| pages | `leeloo-hwp --pages <range> <file>` | 지정 페이지 마크다운 |
| table | `leeloo-hwp --table <index> <file>` | N번째 테이블 마크다운 |
| form | `leeloo-hwp --form <file>` | 레이블-값 JSON |
| detect | `leeloo-hwp --format <file>` | 파일 포맷 정보 |

> **주의**: 실제 CLI 옵션은 구현 시 `leeloo-hwp --help` 확인 필요

### 주요 데이터 흐름

```
1. 사용자: /lk-hwp-parse doc 공문서.hwp
2. SKILL.md: 인자 파싱 (서브커맨드=doc, 파일=공문서.hwp)
3. 사전 체크: which leeloo-hwp
4. CLI 호출: leeloo-hwp 공문서.hwp
5. 결과: 마크다운 텍스트 출력
```

## 7. 구현 단계

| Step | 내용 | 파일 | 의존성 |
|------|------|------|--------|
| 1 | leeloo-hwp CLI 옵션 상세 조사 (`leeloo-hwp --help`) | - | - |
| 2 | **플러그인 리네이밍**: `leeloo-its-util/` → `leeloo-util/`, plugin.json, marketplace.json 갱신 | leeloo-util/plugin.json, marketplace.json | - |
| 3 | lk-hwp-setup skill 작성 (status + install: `npm install -g git+URL`) | leeloo-util/skills/lk-hwp-setup/SKILL.md | Step 2 |
| 4 | lk-hwp-parse skill 작성 (6개 서브커맨드) | leeloo-util/skills/lk-hwp-parse/SKILL.md | Step 1, 3 |
| 5 | lk-hwp-compare skill 작성 (문서 비교) | leeloo-util/skills/lk-hwp-compare/SKILL.md | Step 1, 3 |
| 6 | leeloo-util CLAUDE.md + 루트 CLAUDE.md + README.md 갱신 | CLAUDE.md, README.md | Step 3~5 |
| 7 | HISTORY.md 구조 개편 — history/ 폴더 분리 | HISTORY.md, history/*.md | Step 6 |

### HISTORY.md 구조 개편

```
HISTORY.md                          # 인덱스 (참조 + 요약만)
history/
├── 2026-03-18_leeloo-n8n.md
├── 2026-03-30_leeloo-its-util.md
└── 2026-03-31_leeloo-hwp.md
```

**이유**: HISTORY.md가 비대해지면 컨텍스트를 낭비. 요약만 남기고 상세는 개별 파일로 분리.

## 8. 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| CLI 옵션 ≠ MCP 도구 매핑 | 중 | 중 | Step 1에서 조사, 필요 시 Node.js 래퍼 |
| npm install -g 권한 오류 | 중 | 중 | `--prefix` 옵션 또는 sudo 안내 |
| Bitbucket 인증 필요 | 중 | 중 | lk-hwp-setup에서 인증 방법 안내 |
| PDF 파싱 시 pdfjs-dist 누락 | 중 | 낮 | install 시 함께 설치되도록 package.json dependencies에 포함 |

## 9. 검증 기준

- [ ] `/lk-hwp-` 입력 시 3개 skill 자동완성 표시
- [ ] `/lk-hwp-setup install`로 leeloo-hwp 설치 가능
- [ ] `/lk-hwp-parse doc sample.hwp`로 HWP → 마크다운 변환
- [ ] `/lk-hwp-parse table 0 sample.hwp`로 테이블 추출
- [ ] `/lk-hwp-compare fileA.hwp fileB.hwpx`로 크로스 포맷 비교
- [ ] 미설치 시 설치 안내 표시
- [ ] 기존 lk-iu-pdf-extract 스킬 정상 동작 유지
