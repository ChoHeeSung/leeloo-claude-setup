# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`leeloo-claude-setup`은 Leeloo(이루기술) 사내 Claude Code 플러그인 마켓플레이스 레포지토리입니다.
하나의 레포에서 복수의 독립 플러그인을 제공합니다.

## Multi-Plugin Structure

```
leeloo-claude-setup/
├── .claude-plugin/marketplace.json   # 마켓플레이스 매니페스트 (plugins 배열)
├── leeloo-kit/                       # 플러그인 1: 하네스 엔지니어링 + AI 개발 키트
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
├── leeloo-bitbucket/                 # 플러그인 3: Bitbucket 저장소 관리
│   ├── plugin.json
│   ├── CLAUDE.md
│   └── skills/                       # 5 skills (lk-bb- prefix)
├── leeloo-util/                  # 플러그인 4: 범용 유틸리티 모음
│   ├── plugin.json
│   ├── package.json                  # kordoc 의존성
│   ├── CLAUDE.md
│   ├── scripts/                      # kordoc 래퍼 스크립트
│   └── skills/                       # 5 skills (lk-iu-, lk-doc-, lk-git- prefix)
├── its-ddl-tool/                     # 플러그인 5: ITS DB 관리 도구
│   ├── plugin.json
│   ├── CLAUDE.md
│   ├── skills/                       # 3 skills (lk-its- prefix)
│   ├── resources/                    # DDL 규칙, 도메인 사전, DB 접속
│   └── tools/                        # 정합성 검증 스크립트
└── docs/                             # 공통 문서 (Plan, TODO 등)
```

## Plugins

### leeloo-kit (v3.1.0)
사내 표준 AI 개발 키트. 하네스 엔지니어링 기반 자동화 (배치 품질체크 + Failure Memory Loop + 세션 라이프사이클) + 다중 검증.
- Skills: lk-plan, lk-code-review, lk-plan-cross-review, lk-agent, lk-team, lk-todo, lk-commit, lk-setup, lk-skill-create
- 상세: `leeloo-kit/CLAUDE.md` 참조

### leeloo-n8n (v1.0.0)
n8n MCP 17개 도구를 8개 skill로 래핑한 워크플로우 자동화 플러그인.
- Skills: lk-n8n-setup, lk-n8n-workflow, lk-n8n-run, lk-n8n-validate, lk-n8n-node, lk-n8n-template, lk-n8n-version, lk-n8n-docs
- 상세: `leeloo-n8n/CLAUDE.md` 참조

### leeloo-bitbucket (v1.0.0)
Bitbucket Cloud REST API 직접 호출 기반 저장소 관리 플러그인. MCP 서버 불필요.
- Skills: lk-bb-setup, lk-bb-repo, lk-bb-branch, lk-bb-pr, lk-bb-commit
- 상세: `leeloo-bitbucket/CLAUDE.md` 참조

### leeloo-util (v1.1.0)
Leeloo 범용 유틸리티 모음. ITS 도면 분석, 한국 공문서(HWP/HWPX/PDF) 변환·비교·양식 인식.
- Skills: lk-iu-pdf-extract, lk-doc-parse, lk-doc-compare, lk-doc-form, lk-git-init
- 상세: `leeloo-util/CLAUDE.md` 참조

### its-ddl-tool (v1.0.0)
ITS Oracle DB 대화형 관리 도구. DDL 생성/수정, 코드 관리, 시설물 등록.
- Skills: lk-its-ddl, lk-its-code, lk-its-equip
- 상세: `its-ddl-tool/CLAUDE.md` 참조

## Key Design Decisions

- **멀티 플러그인 레포**: marketplace.json의 plugins 배열로 복수 플러그인 제공. 각 플러그인은 독립 서브디렉토리.
- **네임스페이스 분리**: lk- (leeloo-kit) vs lk-n8n- (leeloo-n8n) vs lk-bb- (leeloo-bitbucket) vs lk-iu- / lk-doc- (leeloo-util) vs lk-its- (its-ddl-tool) 접두사로 skill 충돌 방지.
- **독립 설치**: 각 플러그인은 개별적으로 활성화/비활성화 가능.

## Testing Changes

1. 레포를 마켓플레이스에 등록
2. 플러그인 목록에서 leeloo-kit, leeloo-n8n, leeloo-bitbucket, leeloo-util, its-ddl-tool 다섯 개가 표시되는지 확인
3. 각 플러그인의 skill이 `/` 자동완성에 나타나는지 확인

## Failure Memory
file-io(1건) — 상세: .leeloo/failure-memory/ 참조
- `Edit /Users/heesung/work/M_CHO/leeloo-claude-setup/leeloo-kit/scripts/bash-post.js` — {"filePath":"/Users/heesung/work/M_CHO/leeloo-claude-setup/leeloo-kit/scripts/ba
