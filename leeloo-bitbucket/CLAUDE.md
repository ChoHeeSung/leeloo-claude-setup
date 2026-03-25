# CLAUDE.md — leeloo-bitbucket

## Overview

`leeloo-bitbucket`은 Bitbucket Cloud REST API 2.0을 직접 호출하는 Claude Code 플러그인입니다.
MCP 서버 없이 curl 기반으로 저장소 관리 기능을 제공합니다.

## Prerequisites

- Bitbucket Cloud API Token + 워크스페이스 설정 필요. `/lk-bb-setup install`로 초기 설정.
- 설정 파일: `~/.claude/leeloo-bitbucket.local.md` (YAML frontmatter에 인증 정보 저장)
- 필드: `bitbucket_user_email`, `bitbucket_api_token`, `bitbucket_workspace`

## Skills (lk-bb- prefix)

| 스킬 | 서브커맨드 | 기능 |
|------|-----------|------|
| `lk-bb-setup` | status, install | 연결 확인, 대화형 초기 설정 |
| `lk-bb-repo` | list, get, create, delete | 저장소 CRUD |
| `lk-bb-branch` | list, create, delete | 브랜치 관리 |
| `lk-bb-pr` | list, get, create, merge, comment | PR 관리 |
| `lk-bb-commit` | list, diff | 커밋 이력, diff 조회 |

## Scripts

- `scripts/bb-fetch-all.sh` — 병렬 페이지네이션 유틸리티. 동시 요청 수 제한(`--max-parallel`, 기본 5) 지원.
  ```bash
  bb-fetch-all.sh <endpoint> [--pagelen 100] [--max-parallel 5] [--jq-filter '{name, slug}'] [--query "state=OPEN"]
  ```

## Architecture

- Pure skill plugin — hooks, agents 없음. scripts는 병렬 페이지네이션 유틸리티만 포함.
- 각 skill은 설정 파일 읽기 → 인자 파싱 → curl 호출 → 결과 포맷팅 패턴
- 설정 파일 미존재 시 `/lk-bb-setup install` 안내로 유도
- API 엔드포인트: `https://api.bitbucket.org/2.0/`
- 인증: Basic Auth (`-u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN"`)
