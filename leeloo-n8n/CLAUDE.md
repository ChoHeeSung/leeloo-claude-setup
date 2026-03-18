# CLAUDE.md — leeloo-n8n

## Overview

`leeloo-n8n`은 n8n MCP 서버의 17개 도구를 8개 skill로 래핑한 Claude Code 플러그인입니다.
`/n8n-*` 자동완성으로 모든 n8n 기능에 접근할 수 있습니다.

## Prerequisites

- n8n MCP 서버가 설정되어 있어야 합니다. `/lk-n8n-setup install`로 설치 가이드를 확인하세요.

## Skills (n8n- prefix)

| 스킬 | 서브커맨드 | MCP 도구 |
|------|-----------|----------|
| `lk-n8n-setup` | status, install | health_check |
| `lk-n8n-workflow` | create, get, list, update, delete | create/get/list/update_full/update_partial/delete_workflow |
| `lk-n8n-run` | test, list, get, delete | test_workflow, executions |
| `lk-n8n-validate` | check, fix, lint | validate_workflow, autofix_workflow, validate(JSON) |
| `lk-n8n-node` | search, info, check | search_nodes, get_node, validate_node |
| `lk-n8n-template` | search, get, deploy | search/get/deploy_template |
| `lk-n8n-version` | list, get, rollback, prune | workflow_versions |
| `lk-n8n-docs` | (overview), topic | tools_documentation |

## Architecture

- Pure skill plugin — hooks, agents, scripts 없음
- 각 skill은 MCP 사전 체크 → 인자 파싱 → MCP 호출 → 결과 포맷팅 패턴
- MCP 미설치 시 `/lk-n8n-setup install` 안내로 유도
