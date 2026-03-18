# Plan: leeloo-n8n-plugin

> 작성일: 2026-03-18 | 작성자: Claude + heesung

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | leeloo-n8n-plugin |
| 목적 | n8n MCP 17개 도구를 사용자 친화적 skill로 래핑한 독립 플러그인 |
| 예상 기간 | 2~3일 |
| 복잡도 | Medium |

n8n MCP 서버의 17개 도구를 도메인별로 그룹핑하여 8개 skill로 구성한 독립 Claude Code 플러그인을 만든다. MCP 서버가 없으면 설치를 안내/실행하는 사전 체크를 포함하며, leeloo-kit 플러그인 패턴을 준수한다.

## 1. 배경 및 목적

### 문제 정의
- n8n MCP 도구를 직접 호출하려면 도구 이름(`mcp__n8n-mcp__n8n_create_workflow`)을 알아야 함
- 17개 도구가 flat하게 나열되어 탐색/발견이 어려움
- MCP 서버 미설치 시 아무 안내 없이 실패

### 목표
- `/n8n-*` skill 자동완성으로 모든 n8n 기능 접근
- 각 skill에 사용법 안내 포함
- MCP 서버 사전 체크 + 자동 설치
- leeloo-kit과 분리된 독립 플러그인으로 설치/삭제 가능

## 2. 의도 발견 로그

| 질문 | 답변 |
|------|------|
| 핵심 목적 | 17개 MCP 도구 전체를 skill로 래핑하여 사용자 친화적 인터페이스 제공 |
| 대상 사용자 | 이루기술 내부 개발자 |
| 성공 기준 | skill 자동완성 + 도움말, 독립 설치, MCP 직접 호출 제거, 구분 가능한 skill 접두사 |
| 제약 조건 | leeloo-kit 패턴 준수, MCP 없으면 설치 유도 |

## 3. 탐색한 대안

| 접근법 | 요약 | 장점 | 단점 | 선택 |
|--------|------|------|------|------|
| A: MCP 래핑 + 자동설치 | MCP 도구 래핑, 미설치 시 설치 유도 | 구현 단순, MCP 기능 그대로 | MCP 의존이지만 자동설치로 해소 | ✓ |
| B: MCP + HTTP 폴백 | MCP 없으면 REST API 직접 호출 | 두 환경 지원 | skill 복잡도 증가 | |
| C: HTTP API 전용 | n8n REST API만 사용 | MCP 무관 | 고급 기능 재구현 필요 | |

**선택**: 접근법 A 변형 — skill 호출 시 n8n MCP 사용 가능 여부 체크 → 없으면 설치 안내/실행 → MCP 도구로 작업 수행

## 4. YAGNI 리뷰

제거된 항목:
- 없음 (17개 MCP 도구 전체 포함)

포함된 범위:
- 17개 MCP 도구 전체를 8개 skill로 그룹핑
- n8n MCP 사전 체크 + 설치 skill
- 독립 플러그인 구조 (plugin.json, skills/)

## 5. 구현 범위

### 포함

**플러그인 구조**:
- `plugin.json` — 플러그인 매니페스트 (name: "leeloo-n8n")
- `skills/` — 8개 skill (n8n- 접두사)

**Skill 구성** (17개 MCP 도구 → 8개 skill):

| Skill | 서브커맨드 | 래핑하는 MCP 도구 |
|-------|-----------|-------------------|
| `n8n-setup` | status, install | health_check, MCP 서버 설치 |
| `n8n-workflow` | create, get, list, update, delete | n8n_create_workflow, n8n_get_workflow, n8n_list_workflows, n8n_update_full_workflow, n8n_update_partial_workflow, n8n_delete_workflow |
| `n8n-run` | test, list, get, delete | n8n_test_workflow, n8n_executions |
| `n8n-validate` | check, fix, lint | n8n_validate_workflow (by ID), n8n_autofix_workflow, validate_workflow (by JSON) |
| `n8n-node` | search, info, check | search_nodes, get_node, validate_node |
| `n8n-template` | search, get, deploy | search_templates, get_template, n8n_deploy_template |
| `n8n-version` | list, get, rollback, prune | n8n_workflow_versions |
| `n8n-docs` | (기본) | tools_documentation |

**각 Skill 공통 구조**:
- MCP 사용 가능 여부 사전 체크 (없으면 `/n8n-setup install` 안내)
- 서브커맨드 파싱
- MCP 도구 호출 Procedure
- 결과 포맷팅 + 다음 단계 제안

### 제외
- hooks (불필요 — skill만으로 충분)
- agents (불필요 — n8n 작업은 대화형)
- leeloo-kit PDCA 연동 (별도 플러그인이므로)
- n8n REST API 직접 호출 (MCP 래핑으로 통일)

## 6. 기술 설계 요약

### 아키텍처

하나의 레포(leeloo-claude-setup)에서 marketplace.json의 plugins 배열로 복수 플러그인을 제공한다.
각 플러그인은 독립 서브디렉토리에 배치한다.

**Step 0 (선행 작업)**: 기존 leeloo-kit 파일을 루트에서 `leeloo-kit/` 서브디렉토리로 이동하여 멀티 플러그인 구조로 전환한다.

```
leeloo-claude-setup/                  # 레포 루트
├── .claude-plugin/marketplace.json   # plugins: [leeloo-kit, leeloo-n8n]
├── docs/                             # 공통 문서 (Plan, TODO 등)
├── leeloo-kit/                       # source: "./leeloo-kit"
│   ├── plugin.json
│   ├── CLAUDE.md
│   ├── leeloo.config.json
│   ├── skills/
│   ├── hooks/
│   ├── scripts/
│   ├── agents/
│   ├── templates/
│   ├── output-styles/
│   └── resources/
└── leeloo-n8n/                       # source: "./leeloo-n8n"
    ├── plugin.json
    ├── CLAUDE.md
    └── skills/
        ├── n8n-setup/SKILL.md
        ├── n8n-workflow/SKILL.md
        ├── n8n-run/SKILL.md
        ├── n8n-validate/SKILL.md
        ├── n8n-node/SKILL.md
        ├── n8n-template/SKILL.md
        ├── n8n-version/SKILL.md
        └── n8n-docs/SKILL.md
```

### 주요 데이터 흐름

1. 사용자가 `/n8n-workflow create "My Workflow"` 입력
2. SKILL.md Procedure가 인자 파싱
3. MCP 사용 가능 여부 체크 (n8n_health_check 호출 시도)
4. 불가능하면 `/n8n-setup install` 안내 후 중단
5. 가능하면 `mcp__n8n-mcp__n8n_create_workflow` 호출
6. 결과를 사용자 친화적으로 포맷팅하여 표시

### MCP 사전 체크 패턴 (각 skill 공통)

각 skill의 Procedure 첫 단계에 다음을 포함:
```
1. n8n MCP 연결 확인: mcp__n8n-mcp__n8n_health_check 호출
   - 실패 시: "n8n MCP 서버가 설정되지 않았습니다. /n8n-setup install 을 먼저 실행하세요." 안내 후 중단
   - 성공 시: 다음 단계 진행
```

## 7. 구현 단계

| Step | 내용 | 파일 | 의존성 |
|------|------|------|--------|
| 0 | 멀티 플러그인 구조 전환 — leeloo-kit 파일을 leeloo-kit/ 서브디렉토리로 이동 + marketplace.json source 경로 수정 | leeloo-kit/*, marketplace.json | - |
| 1 | leeloo-n8n plugin.json 매니페스트 생성 + marketplace.json에 추가 | leeloo-n8n/plugin.json | Step 0 |
| 2 | n8n-setup skill 작성 (MCP 상태 확인 + 설치 가이드) | leeloo-n8n/skills/n8n-setup/SKILL.md | Step 1 |
| 3 | n8n-workflow skill 작성 (CRUD 6개 도구) | leeloo-n8n/skills/n8n-workflow/SKILL.md | Step 2 |
| 4 | n8n-run skill 작성 (실행 + 실행기록) | leeloo-n8n/skills/n8n-run/SKILL.md | Step 2 |
| 5 | n8n-validate skill 작성 (검증 + 자동수정) | leeloo-n8n/skills/n8n-validate/SKILL.md | Step 2 |
| 6 | n8n-node skill 작성 (노드 검색/정보/검증) | leeloo-n8n/skills/n8n-node/SKILL.md | Step 2 |
| 7 | n8n-template skill 작성 (템플릿 검색/조회/배포) | leeloo-n8n/skills/n8n-template/SKILL.md | Step 2 |
| 8 | n8n-version skill 작성 (버전 관리) | leeloo-n8n/skills/n8n-version/SKILL.md | Step 2 |
| 9 | n8n-docs skill 작성 (문서 조회) | leeloo-n8n/skills/n8n-docs/SKILL.md | Step 2 |
| 10 | leeloo-n8n CLAUDE.md 작성 | leeloo-n8n/CLAUDE.md | Step 3~9 |
| 11 | 루트 CLAUDE.md 갱신 (멀티 플러그인 구조 반영) | CLAUDE.md | Step 0 |
| 12 | 통합 테스트 (skill 자동완성 + 실행 검증) | - | Step 10~11 |

## 8. 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| n8n MCP 서버 설치 실패 | 중 | 높음 | n8n-setup에 수동 설치 가이드 포함 |
| MCP 도구 이름/파라미터 변경 | 낮 | 중 | skill에서 MCP 도구 이름을 명시적으로 참조, 버전 고정 |
| skill 개수 과다로 자동완성 혼잡 | 낮 | 낮 | n8n- 접두사로 네임스페이스 분리, 서브커맨드로 그룹핑 |
| leeloo-kit과 skill 이름 충돌 | 낮 | 중 | lk- vs n8n- 접두사로 완전 분리 |

## 9. 검증 기준

- [ ] plugin.json이 Claude Code에서 인식됨
- [ ] `/n8n-` 입력 시 8개 skill 자동완성 표시
- [ ] `/n8n-setup status`로 MCP 연결 상태 확인 가능
- [ ] `/n8n-workflow list`로 워크플로우 목록 조회 가능
- [ ] `/n8n-run test {id}`로 워크플로우 실행 가능
- [ ] MCP 서버 미설치 상태에서 `/n8n-workflow list` 실행 시 설치 안내 표시
- [ ] leeloo-kit과 독립적으로 설치/삭제 가능
