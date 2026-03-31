# leeloo-claude-setup

Leeloo(이루기술) 사내 Claude Code 플러그인 마켓플레이스.

하나의 레포에서 복수의 독립 플러그인을 제공합니다.

## 플러그인 목록

| 플러그인 | 버전 | 설명 |
|---------|------|------|
| **leeloo-kit** | 2.0.0 | 사내 표준 AI 개발 키트 — PDCA 워크플로우 + 다중 검증 자동화 + 에이전트 시스템 |
| **leeloo-n8n** | 1.0.0 | n8n 워크플로우 자동화 — MCP 17개 도구를 사용자 친화적 skill로 래핑 |
| **leeloo-bitbucket** | 1.0.0 | Bitbucket Cloud 저장소 관리 — REST API 직접 호출 기반 |
| **leeloo-util** | 1.0.0 | Leeloo 범용 유틸리티 모음 — ITS 도면 분석, 공문서 변환, 데이터 처리 등 |

## 설치

Plugin Marketplace를 통해 설치합니다. 레포를 마켓플레이스에 등록하면 네 플러그인이 개별적으로 표시됩니다.

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

PDCA 워크플로우 + Gemini 교차검증 + 에이전트 자동화를 제공하는 사내 표준 AI 개발 키트.

### 스킬 (lk- 접두사)

| 스킬 | 설명 |
|------|------|
| `/lk-plan` | 브레인스토밍 기반 Plan 작성 + Gemini 교차검증 연동 |
| `/lk-pdca` | PDCA 통합 관리 (design/do/analyze/report/status) |
| `/lk-code-review` | 코드 리뷰 — Claude 단독 또는 Gemini 이중 (`--dual`) |
| `/lk-plan-cross-review` | 플랜 리뷰 — Gemini가 Plan/Design을 독립 검증 |
| `/lk-agent` | Sub Agent 대화형 생성/관리 (프리셋 7종) |
| `/lk-team` | Agent Team 구성/관리 (프리셋 5종) |
| `/lk-todo` | Plan을 TODO 리스트로 변환 + 진행 상황 추적 |
| `/lk-commit` | Conventional Commits + 한국어 스타일 + TODO 연동 |
| `/lk-setup` | 선택적 환경 강화 (statusline, CLAUDE.md, gemini) |

### 에이전트

- `gap-detector` — 설계/구현 Gap 분석 + Match Rate 산출
- `pdca-iterator` — Gap 기반 자동 개선
- `code-analyzer` — 코드 품질/보안/성능 분석
- `report-generator` — PDCA 사이클 완료 보고서 생성

### 훅

- **SessionStart** — 세션 초기화, 의존성 확인, PDCA 상태 표시
- **PreToolUse(Bash)** — 위험 명령 차단 (rm -rf, git push --force 등)
- **PostToolUse(Write|Edit)** — PDCA 문서 포맷 검증
- **PostToolUse(Skill)** — 스킬 완료 후 다음 단계 제안
- **Stop** — 에이전트/스킬 완료 처리

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

ITS(지능형교통시스템) 업무 자동화 유틸리티 모음. 도면 분석, 시설물 관리, 데이터 변환 등.

### 스킬 (lk-iu- 접두사)

| 스킬 | 설명 |
|------|------|
| `/lk-iu-pdf-extract` | 설계 도면 PDF에서 시설물·장비 정보를 자동 추출하여 Excel로 정리 |

### /lk-iu-pdf-extract 사용법

설계 도면 PDF를 입력하면, 도면을 자동 분석하여 시설물 목록을 Excel로 추출합니다.

```bash
# 기본 사용
/lk-iu-pdf-extract CM-001_통신관로_평면도.pdf

# 출력 폴더 지정
/lk-iu-pdf-extract 전력배선평면도.pdf --output 수정본/

# 특정 페이지만 처리
/lk-iu-pdf-extract 도면.pdf --pages 3-7
```

**워크플로우 (4-Phase):**

1. **Phase 0 — 환경 준비**: 의존성 점검, PDF 모드 판별 (텍스트/비전)
2. **Phase 1 — 패턴 탐색**: 샘플 3~4페이지를 분석하여 장비 유형, ID 체계, 방향 구분 등을 자동 발견
3. **Phase 2 — 병렬 추출**: 발견된 패턴으로 전체 페이지를 SubAgent 병렬 처리
4. **Phase 3~4 — Excel 생성 및 검증**: 시설물 목록 + 요약 + 발견 패턴 시트 생성

**추출 모드:**

| 모드 | 조건 | 방식 |
|------|------|------|
| 텍스트 | pdfplumber로 텍스트 추출 가능 | 텍스트 파싱 (빠름) |
| 비전 | 텍스트 추출 불가 (CAD 벡터 도면) | Claude Vision이 이미지 직접 판독 |

**핵심 설계 원칙:**
- 하드코딩 금지 — 장비 유형, ID 접두사 등을 코드에 고정하지 않음. Phase 1에서 자동 발견.
- Python OCR 미사용 — CAD 도면에서 정확도가 낮아 Claude Vision으로 대체.
- 컨텍스트 보호 — 비전 모드에서 이미지 분석은 1페이지/SubAgent로 분리하여 20MB 제한 방지.

**사전 요구사항:**
- poppler-utils (`brew install poppler`)
- Python 패키지: pypdf, pdfplumber, pdf2image, openpyxl, Pillow
- 환경 점검: `bash leeloo-util/scripts/check-env.sh` (자동 설치: `--fix`)

## 구조

```
leeloo-claude-setup/
├── .claude-plugin/
│   └── marketplace.json         # 마켓플레이스 매니페스트 (plugins 배열)
├── leeloo-kit/                  # 플러그인 1: PDCA + AI 개발 키트
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
├── leeloo-util/             # 플러그인 4: ITS 업무 자동화 유틸리티
│   ├── plugin.json
│   ├── CLAUDE.md
│   ├── skills/                  # 1 skill (lk-iu- prefix)
│   └── scripts/
└── docs/                        # 공통 문서
```

## 설계 원칙

- **멀티 플러그인 레포** — marketplace.json의 plugins 배열로 복수 플러그인 제공
- **순수 플러그인** — 셸 스크립트 없음. 플러그인 설치 = marketplace install 또는 enabledPlugins 경로
- **네임스페이스 분리** — lk- / lk-n8n- / lk-bb- / lk-iu- 접두사로 충돌 방지
- **독립 설치** — 각 플러그인은 개별적으로 활성화/비활성화 가능
- **PDCA 워크플로우** — Plan → Design → Do → Check → Act → Report
- **이중 검증** — Gemini 교차검증 + Claude 분석

## 사전 요구사항

- Claude Code
- Node.js v18+ (gemini-cli용, 선택)
- jq (선택)
