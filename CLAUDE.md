# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`leeloo-claude-setup`은 Leeloo(이루기술) 사내 Claude Code 플러그인 마켓플레이스 레포지토리입니다.
하나의 레포에서 복수의 독립 플러그인을 제공합니다.

## Multi-Plugin Structure

```
leeloo-claude-setup/
├── .claude-plugin/marketplace.json   # 마켓플레이스 매니페스트 (plugins 배열)
├── leeloo-kit/                       # 플러그인 1: PDCA 워크플로우 + AI 개발 키트
│   ├── plugin.json
│   ├── CLAUDE.md
│   ├── skills/                       # 9 skills (lk- prefix)
│   ├── hooks/
│   ├── scripts/
│   ├── agents/
│   ├── templates/
│   ├── output-styles/
│   └── resources/
├── leeloo-n8n/                       # 플러그인 2: n8n 워크플로우 자동화
│   ├── plugin.json
│   ├── CLAUDE.md
│   └── skills/                       # 8 skills (n8n- prefix)
└── docs/                             # 공통 문서 (Plan, TODO 등)
```

## Plugins

### leeloo-kit (v2.0.0)
사내 표준 AI 개발 키트. PDCA 워크플로우 + 다중 검증 자동화 + 에이전트 시스템.
- Skills: lk-plan, lk-pdca, lk-review, lk-cross-validate, lk-agent, lk-team, lk-todo, lk-commit, lk-setup
- 상세: `leeloo-kit/CLAUDE.md` 참조

### leeloo-n8n (v1.0.0)
n8n MCP 17개 도구를 8개 skill로 래핑한 워크플로우 자동화 플러그인.
- Skills: lk-n8n-setup, lk-n8n-workflow, lk-n8n-run, lk-n8n-validate, lk-n8n-node, lk-n8n-template, lk-n8n-version, lk-n8n-docs
- 상세: `leeloo-n8n/CLAUDE.md` 참조

## Key Design Decisions

- **멀티 플러그인 레포**: marketplace.json의 plugins 배열로 복수 플러그인 제공. 각 플러그인은 독립 서브디렉토리.
- **네임스페이스 분리**: lk- (leeloo-kit) vs lk-n8n- (leeloo-n8n) 접두사로 skill 충돌 방지.
- **독립 설치**: 각 플러그인은 개별적으로 활성화/비활성화 가능.

## Testing Changes

1. 레포를 마켓플레이스에 등록
2. 플러그인 목록에서 leeloo-kit, leeloo-n8n 두 개가 표시되는지 확인
3. 각 플러그인의 skill이 `/` 자동완성에 나타나는지 확인
