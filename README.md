# leeloo-claude-setup

Leeloo(이루기술) 사내 Claude Code 플러그인 마켓플레이스.

하나의 레포에서 복수의 독립 플러그인을 제공합니다.

## 플러그인 목록

| 플러그인 | 버전 | 설명 |
|---------|------|------|
| **leeloo-kit** | 2.0.0 | 사내 표준 AI 개발 키트 — PDCA 워크플로우 + 다중 검증 자동화 + 에이전트 시스템 |
| **leeloo-n8n** | 1.0.0 | n8n 워크플로우 자동화 — MCP 17개 도구를 사용자 친화적 skill로 래핑 |

## 설치

Plugin Marketplace를 통해 설치합니다. 레포를 마켓플레이스에 등록하면 두 플러그인이 개별적으로 표시됩니다.

또는 직접 경로로 활성화:

```jsonc
// ~/.claude/settings.json
{
  "enabledPlugins": [
    "/path/to/leeloo-claude-setup/leeloo-kit",
    "/path/to/leeloo-claude-setup/leeloo-n8n"
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
| `/lk-review` | Gemini+Claude 이중 리뷰 + 통합 Score Card |
| `/lk-cross-validate` | Gemini 교차검증 + Score Card + 메트릭 저장 |
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

## 구조

```
leeloo-claude-setup/
├── .claude-plugin/
│   └── marketplace.json         # 마켓플레이스 매니페스트 (plugins 배열)
├── leeloo-kit/                  # 플러그인 1
│   ├── plugin.json
│   ├── CLAUDE.md
│   ├── leeloo.config.json
│   ├── skills/                  # 9 skills (lk- prefix)
│   ├── hooks/
│   ├── scripts/
│   ├── agents/
│   ├── templates/
│   ├── output-styles/
│   └── resources/
├── leeloo-n8n/                  # 플러그인 2
│   ├── plugin.json
│   ├── CLAUDE.md
│   └── skills/                  # 8 skills (lk-n8n- prefix)
└── docs/                        # 공통 문서
```

## 설계 원칙

- **멀티 플러그인 레포** — marketplace.json의 plugins 배열로 복수 플러그인 제공
- **순수 플러그인** — 셸 스크립트 없음. 플러그인 설치 = marketplace install 또는 enabledPlugins 경로
- **네임스페이스 분리** — lk- (leeloo-kit) vs lk-n8n- (leeloo-n8n) 접두사로 충돌 방지
- **독립 설치** — 각 플러그인은 개별적으로 활성화/비활성화 가능
- **PDCA 워크플로우** — Plan → Design → Do → Check → Act → Report
- **이중 검증** — Gemini 교차검증 + Claude 분석

## 사전 요구사항

- Claude Code
- Node.js v18+ (gemini-cli용, 선택)
- jq (선택)
