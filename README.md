# leeloo-claude-setup

Leeloo(이루기술) 사내 Claude Code 플러그인 마켓플레이스.

하나의 레포에서 복수의 독립 플러그인을 제공합니다.

## 플러그인 목록

| 플러그인 | 버전 | 설명 |
|---------|------|------|
| **leeloo-kit** | 3.1.0 | 사내 표준 AI 개발 키트 — 하네스 엔지니어링 기반 자동화 + 다중 검증 |
| **leeloo-n8n** | 1.0.0 | n8n 워크플로우 자동화 — MCP 17개 도구를 사용자 친화적 skill로 래핑 |
| **leeloo-bitbucket** | 1.0.0 | Bitbucket Cloud 저장소 관리 — REST API 직접 호출 기반 |
| **leeloo-util** | 1.1.0 | 범용 유틸리티 모음 — ITS 도면 분석, 한국 공문서(HWP/HWPX/PDF) 변환·비교·양식 인식 |
| **its-ddl-tool** | 1.0.0 | ITS DB 관리 — Oracle DDL 생성/수정, 코드 관리, 시설물 등록 (대화형) |

## 설치

Plugin Marketplace를 통해 설치합니다. 레포를 마켓플레이스에 등록하면 다섯 플러그인이 개별적으로 표시됩니다.

또는 직접 경로로 활성화:

```jsonc
// ~/.claude/settings.json
{
  "enabledPlugins": [
    "/path/to/leeloo-claude-setup/leeloo-kit",
    "/path/to/leeloo-claude-setup/leeloo-n8n",
    "/path/to/leeloo-claude-setup/leeloo-bitbucket",
    "/path/to/leeloo-claude-setup/leeloo-util"
  ]
}
```

## leeloo-kit

하네스 엔지니어링 기반 자동화 + Gemini 교차검증을 제공하는 사내 표준 AI 개발 키트.

플러그인 설치만으로 자동 적용:
- **Failure Memory Loop**: 모든 도구 실패 자동 감지 → 유형별 기록 → 다음 세션 자동 방지
- **배치 품질체크**: 편집 시 경로만 수집 → Stop 시 언어별 분류 후 일괄 lint/typecheck (per-edit 아님)
- **세션 라이프사이클**: SessionStart(이전 세션 복원) → PreCompact(Context Checkpoint 보존) → SessionEnd(세션 요약 저장)
- **Control Flow**: 위험 명령 차단, 린터 미설치 자동 감지

**다양한 개발언어 지원**: JS/TS, Python, Erlang/Elixir, Java, Go, Rust, HTML

### 스킬 (lk- 접두사)

| 스킬 | 설명 |
|------|------|
| `/lk-plan` | 브레인스토밍 기반 Plan 작성 + Gemini 교차검증 연동 |
| `/lk-code-review` | 코드 리뷰 — Claude 단독 또는 Gemini 이중 (`--dual`) |
| `/lk-plan-cross-review` | 플랜 리뷰 — Gemini가 Plan/Design을 독립 검증 |
| `/lk-agent` | Sub Agent 대화형 생성/관리 (프리셋 7종) |
| `/lk-team` | Agent Team 구성/관리 (프리셋 5종) |
| `/lk-todo` | Plan을 TODO 리스트로 변환 + 진행 상황 추적 |
| `/lk-commit` | Conventional Commits + 한국어 스타일 + TODO 연동 |
| `/lk-setup` | 선택적 환경 강화 (install/reinstall/statusline/gemini 등) |
| `/lk-skill-create` | Git 히스토리 + 프로젝트 구조 분석으로 SKILL.md 자동 생성 |

### 에이전트

- `code-analyzer` — 코드 품질/보안/성능 분석

### 훅 (6개 이벤트)

- **SessionStart** — 이전 세션 요약 복원, Failure Memory 요약, 린터 미설치 감지, TODO 진행률
- **PreToolUse(Bash)** — 위험 명령 차단 (rm -rf, git push --force 등)
- **PostToolUse(Write|Edit)** — 편집 파일 경로 수집 (배치 품질체크용) + 도구 에러 감지
- **PostToolUse(mcp_)** — MCP 도구 실패 감지
- **PostToolUse(Skill)** — 스킬 완료 후 다음 단계 안내
- **PreCompact** — Context Checkpoint + Failure Memory + TODO 상태 보존
- **Stop** — 누적 편집 파일 배치 lint/typecheck (30s 타임아웃)
- **SessionEnd** — 세션 요약 저장 + Context Checkpoint 병합 + Failure Memory Loop

## leeloo-n8n

n8n MCP 서버의 17개 도구를 8개 skill로 래핑한 워크플로우 자동화 플러그인.

### 사전 요구사항

- n8n MCP 서버 설정 필요 (`/lk-n8n-setup install`로 가이드 확인)

### 스킬 (lk-n8n- 접두사)

| 스킬 | 서브커맨드 | 래핑 MCP 도구 |
|------|-----------|--------------|
| `/lk-n8n-setup` | status, install | health_check |
| `/lk-n8n-workflow` | create, get, list, update, delete | create/get/list/update/delete_workflow |
| `/lk-n8n-run` | test, list, get, delete | test_workflow, executions |
| `/lk-n8n-validate` | check, fix, lint | validate_workflow, autofix_workflow |
| `/lk-n8n-node` | search, info, check | search_nodes, get_node, validate_node |
| `/lk-n8n-template` | search, get, deploy | search/get/deploy_template |
| `/lk-n8n-version` | list, get, rollback, prune | workflow_versions |
| `/lk-n8n-docs` | (overview), topic | tools_documentation |

## leeloo-bitbucket

Bitbucket Cloud REST API 직접 호출 기반 저장소 관리 플러그인. MCP 서버 불필요.

### 사전 요구사항

- Bitbucket App Password 설정 필요 (`/lk-bb-setup`으로 초기 설정)

### 스킬 (lk-bb- 접두사)

| 스킬 | 설명 |
|------|------|
| `/lk-bb-setup` | Bitbucket 연결 확인 및 대화형 초기 설정 |
| `/lk-bb-repo` | 저장소 관리 (목록/조회/생성/삭제) |
| `/lk-bb-branch` | 브랜치 관리 (목록/생성/삭제) |
| `/lk-bb-pr` | Pull Request 관리 (목록/조회/생성/머지/댓글) |
| `/lk-bb-commit` | 커밋 이력 및 diff 조회 |

## leeloo-util

범용 유틸리티 모음. ITS 도면 분석 + 한국 공문서(HWP/HWPX/PDF) 변환·비교·양식 인식.

### 스킬

#### 도면 분석 (lk-doc- 접두사)

| 스킬 | 설명 |
|------|------|
| `/lk-doc-pdf-extract` | 설계 도면 PDF에서 시설물·장비 정보를 자동 추출하여 Excel로 정리 |

#### 한국 공문서 처리 (lk-doc- 접두사)

[kordoc](https://github.com/chrisryugj/kordoc) 라이브러리를 스킬로 래핑하여, MCP 상시 로딩 없이 호출 시에만 컨텍스트를 사용합니다.

| 스킬 | 설명 |
|------|------|
| `/lk-doc-parse` | HWP/HWPX/PDF를 마크다운으로 변환. 메타데이터, 테이블 추출, 배치 변환 지원 |
| `/lk-doc-compare` | 두 공문서 비교 (크로스 포맷 HWP↔HWPX 지원). 개정판 diff 분석 |
| `/lk-doc-form` | 정부 양식에서 레이블-값 쌍 자동 추출 |

#### Git 유틸리티

| 스킬 | 설명 |
|------|------|
| `/lk-git-init` | 대화형 Git 저장소 초기화 — remote 설정, .gitignore 생성, LFS 초기화 |

**지원 포맷:**

| 포맷 | 확장자 | 비고 |
|------|--------|------|
| HWP 5.x | .hwp | 한글 바이너리 |
| HWPX | .hwpx | 한글 XML (개방형) |
| PDF | .pdf | pdfjs-dist 선택 설치 |

**사용 예시:**

```bash
# 공문서 마크다운 변환
/lk-doc-parse 공문서.hwp
/lk-doc-parse 계획서.hwpx --pages 1-3

# 두 문서 비교 (크로스 포맷)
/lk-doc-compare 원본.hwp 수정본.hwpx

# 양식 인식
/lk-doc-form 신청서.hwp
```

### /lk-doc-pdf-extract 사용법

설계 도면 PDF를 입력하면, 도면을 자동 분석하여 시설물 목록을 Excel로 추출합니다.

```bash
# 기본 사용
/lk-doc-pdf-extract CM-001_통신관로_평면도.pdf

# 출력 폴더 지정
/lk-doc-pdf-extract 전력배선평면도.pdf --output 수정본/

# 특정 페이지만 처리
/lk-doc-pdf-extract 도면.pdf --pages 3-7
```

**워크플로우 (4-Phase):**

1. **Phase 0 — 환경 준비**: 의존성 점검, PDF 모드 판별 (텍스트/비전)
2. **Phase 1 — 패턴 탐색**: 샘플 3~4페이지를 분석하여 장비 유형, ID 체계, 방향 구분 등을 자동 발견
3. **Phase 2 — 병렬 추출**: 발견된 패턴으로 전체 페이지를 SubAgent 병렬 처리
4. **Phase 3~4 — Excel 생성 및 검증**: 시설물 목록 + 요약 + 발견 패턴 시트 생성

### 사전 요구사항

**lk-doc-pdf-extract용:**
- poppler-utils (`brew install poppler`)
- Python 패키지: pypdf, pdfplumber, pdf2image, openpyxl, Pillow

**lk-doc-* 스킬용:**
- Node.js >= 18
- kordoc (`cd leeloo-util && npm install`로 자동 설치)

**환경 점검:**
```bash
bash leeloo-util/scripts/check-env.sh        # 점검
bash leeloo-util/scripts/check-env.sh --fix   # 자동 설치
```

## its-ddl-tool

ITS Oracle DB 대화형 관리 도구. DDL 생성/수정, 코드/패턴 관리, 시설물 등록을 대화형으로 처리하고 DB에 직접 실행.

### 스킬 (lk-its- 접두사)

| 스킬 | 서브커맨드 | 설명 |
|------|-----------|------|
| `/lk-its-ddl` | create, alter, show, check, dict | 테이블 DDL 생성/수정, 정합성 검증, 도메인 사전 검색 |
| `/lk-its-code` | add-group, add-item, add-pattern, add-holiday, list, search | 코드 그룹/항목, 교통 패턴, 공휴일 관리 |
| `/lk-its-equip` | add, modify, list, show, status, move, delete | 현장 시설물(VDS, CCTV, VMS 등) 등록/수정/조회 |

### 사전 요구사항

- Python 3 + `oracledb` 패키지 (`pip install oracledb`)
- Oracle DB 접속 가능 (resources/db-connection.md 참조)

## 구조

```
leeloo-claude-setup/
├── .claude-plugin/
│   └── marketplace.json         # 마켓플레이스 매니페스트 (plugins 배열)
├── leeloo-kit/                  # 플러그인 1: 하네스 엔지니어링 + AI 개발 키트
│   ├── plugin.json
│   ├── CLAUDE.md
│   ├── skills/                  # 9 skills (lk- prefix)
│   ├── hooks/
│   ├── scripts/
│   ├── agents/
│   ├── templates/
│   ├── output-styles/
│   └── resources/
├── leeloo-n8n/                  # 플러그인 2: n8n 워크플로우 자동화
│   ├── plugin.json
│   ├── CLAUDE.md
│   └── skills/                  # 8 skills (lk-n8n- prefix)
├── leeloo-bitbucket/            # 플러그인 3: Bitbucket 저장소 관리
│   ├── plugin.json
│   ├── CLAUDE.md
│   ├── skills/                  # 5 skills (lk-bb- prefix)
│   └── scripts/
├── leeloo-util/                 # 플러그인 4: 범용 유틸리티 모음
│   ├── plugin.json
│   ├── package.json             # kordoc 의존성
│   ├── CLAUDE.md
│   ├── skills/                  # 5 skills (lk-doc-, lk-git- prefix)
│   └── scripts/                 # kordoc 래퍼 스크립트
├── its-ddl-tool/                # 플러그인 5: ITS DB 관리 도구
│   ├── plugin.json
│   ├── CLAUDE.md
│   ├── skills/                  # 3 skills (lk-its- prefix)
│   ├── resources/               # DDL 규칙, 도메인 사전, DB 접속
│   └── tools/                   # 정합성 검증 스크립트
└── docs/                        # 공통 문서 (Plan 등)
```

## 설계 원칙

- **멀티 플러그인 레포** — marketplace.json의 plugins 배열로 복수 플러그인 제공
- **순수 플러그인** — 셸 스크립트 없음. 플러그인 설치 = marketplace install 또는 enabledPlugins 경로
- **네임스페이스 분리** — lk- / lk-n8n- / lk-bb- / lk-doc- / lk-git- / lk-its- 접두사로 충돌 방지
- **독립 설치** — 각 플러그인은 개별적으로 활성화/비활성화 가능
- **하네스 엔지니어링** — Failure Memory Loop + Back-Pressure + Auto Quality Check
- **이중 검증** — Gemini 교차검증 + Claude 분석
- **컨텍스트 절약** — MCP 도구 상시 로딩 대신 스킬 래핑으로 호출 시에만 컨텍스트 사용

## 사전 요구사항

- Claude Code
- Node.js v18+ (kordoc, gemini-cli용)
- jq (선택)
