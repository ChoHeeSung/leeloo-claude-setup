# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`leeloo-claude-setup`은 Leeloo(이루기술) 사내 Claude Code 플러그인 마켓플레이스 레포지토리.
하나의 레포에서 8개 독립 플러그인(`.claude-plugin/marketplace.json`의 `plugins` 배열)을 제공.

## Plugins

| 플러그인 | 버전 | 유형 | 스킬 수 | 상세 |
|---|---|---|---|---|
| leeloo-kit | 3.4.0 | 환경/도구(하네스 엔지니어링 코어) | 3 | `leeloo-kit/CLAUDE.md` |
| leeloo-workflow | 1.0.1 | 워크플로우(Plan/리뷰/TODO) | 4 | `leeloo-workflow/CLAUDE.md` |
| leeloo-git | 1.0.1 | Git 자동화 | 2 | `leeloo-git/CLAUDE.md` |
| leeloo-agent | 1.0.1 | Sub Agent/Team 관리 | 2 | `leeloo-agent/CLAUDE.md` |
| leeloo-doc | 1.2.0 | 문서/도면(HWP·PDF 변환·추출) | 5 | `leeloo-doc/CLAUDE.md` |
| leeloo-bitbucket | 1.0.1 | Bitbucket REST API | 5 | `leeloo-bitbucket/CLAUDE.md` |
| leeloo-n8n | 1.0.1 | n8n MCP 래핑 | 8 | `leeloo-n8n/CLAUDE.md` |
| leeloo-its | 1.0.1 | ITS Oracle DB 관리 | 3 | `leeloo-its/CLAUDE.md` |

네임스페이스: `lk-` / `lk-doc-` / `lk-bb-` / `lk-n8n-` / `lk-its-` 접두사로 충돌 방지. 각 플러그인 독립 활성화 가능.

## Coding Principles

상세는 `~/.claude/CLAUDE.md` 필수 원칙 7(스파게티 코드 금지)을 따른다.
매 코드 작성/수정 시 SRP · 중첩 3단계 · 함수 50~80줄 · 복잡도 10 미만 · DRY & KISS 체크.

## Testing Changes

1. 레포를 마켓플레이스에 등록
2. 플러그인 목록에 8개 표시 확인
3. 각 플러그인의 skill이 `/` 자동완성에 나타나는지 확인

## Failure Memory
file-io(1건) — 상세: .leeloo/failure-memory/ 참조
- `Edit /Users/heesung/work/M_CHO/leeloo-claude-setup/leeloo-kit/scripts/session-start.js` — {"filePath":"/Users/heesung/work/M_CHO/leeloo-claude-setup/leeloo-kit/scripts/se
