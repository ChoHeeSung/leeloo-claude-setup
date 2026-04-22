# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`leeloo-claude-setup`은 Leeloo(이루기술) 사내 Claude Code 플러그인 마켓플레이스 레포지토리입니다.
하나의 레포에서 8개의 독립 플러그인을 유형별로 제공합니다.

## Multi-Plugin Structure

```
leeloo-claude-setup/
├── .claude-plugin/marketplace.json   # 마켓플레이스 매니페스트 (plugins 배열)
├── leeloo-kit/                       # 환경/도구: 하네스 엔지니어링 코어
│   ├── plugin.json
│   ├── CLAUDE.md
│   ├── skills/                       # 3 skills (lk-setup, lk-skill-create, lk-persona)
│   ├── hooks/
│   ├── scripts/
│   ├── agents/
│   ├── templates/
│   ├── output-styles/
│   └── resources/
├── leeloo-workflow/                  # 워크플로우: Plan, 코드 리뷰, TODO
│   ├── plugin.json
│   ├── CLAUDE.md
│   └── skills/                       # 4 skills (lk-plan, lk-code-review, lk-plan-cross-review, lk-todo)
├── leeloo-git/                       # Git: 커밋, 저장소 초기화
│   ├── plugin.json
│   ├── CLAUDE.md
│   └── skills/                       # 2 skills (lk-commit, lk-git-init)
├── leeloo-agent/                     # 에이전트/팀: Sub Agent, Team 관리
│   ├── plugin.json
│   ├── CLAUDE.md
│   └── skills/                       # 2 skills (lk-agent, lk-team)
├── leeloo-doc/                       # 문서/도면: 공문서 변환, 도면 추출
│   ├── plugin.json
│   ├── package.json                  # kordoc 의존성
│   ├── CLAUDE.md
│   ├── scripts/                      # kordoc 래퍼 스크립트
│   └── skills/                       # 4 skills (lk-doc- prefix)
├── leeloo-bitbucket/                 # 외부 연동: Bitbucket 저장소 관리
│   ├── plugin.json
│   ├── CLAUDE.md
│   └── skills/                       # 5 skills (lk-bb- prefix)
├── leeloo-n8n/                       # 외부 연동: n8n 워크플로우 자동화
│   ├── plugin.json
│   ├── CLAUDE.md
│   └── skills/                       # 8 skills (lk-n8n- prefix)
├── leeloo-its/                       # 외부 연동: ITS Oracle DB 관리
│   ├── plugin.json
│   ├── CLAUDE.md
│   ├── skills/                       # 3 skills (lk-its- prefix)
│   ├── resources/                    # DDL 규칙, 도메인 사전, DB 접속
│   └── tools/                        # 정합성 검증 스크립트
└── docs/                             # 공통 문서 (Plan, TODO 등)
```

## Plugins

### leeloo-kit (v3.4.0) — 환경/도구
하네스 엔지니어링 코어. Failure Memory Loop, 배치 품질체크, 세션 라이프사이클, Context Checkpoint.
- Skills: lk-setup, lk-skill-create, lk-persona
- 상세: `leeloo-kit/CLAUDE.md` 참조

### leeloo-workflow (v1.0.1) — 워크플로우
Plan 작성, 코드 리뷰, Gemini 교차검증, TODO 관리.
- Skills: lk-plan, lk-plan-cross-review, lk-code-review, lk-todo
- 상세: `leeloo-workflow/CLAUDE.md` 참조

### leeloo-git (v1.0.1) — Git
커밋 메시지 자동 생성 + 저장소 초기화.
- Skills: lk-commit, lk-git-init
- 상세: `leeloo-git/CLAUDE.md` 참조

### leeloo-agent (v1.0.1) — 에이전트/팀
Sub Agent 생성 + Agent Team 구성·운영.
- Skills: lk-agent, lk-team
- 상세: `leeloo-agent/CLAUDE.md` 참조

### leeloo-doc (v1.2.0) — 문서/도면
설계 도면 PDF 추출, 한국 공문서(HWP/HWPX/PDF) 변환·비교·양식 인식, Markdown → HWPX 역변환.
- Skills: lk-doc-pdf-extract, lk-doc-parse, lk-doc-compare, lk-doc-form, lk-doc-md2hwpx
- 상세: `leeloo-doc/CLAUDE.md` 참조

### leeloo-bitbucket (v1.0.1) — 외부 연동
Bitbucket Cloud REST API 직접 호출 기반 저장소 관리.
- Skills: lk-bb-setup, lk-bb-repo, lk-bb-branch, lk-bb-pr, lk-bb-commit
- 상세: `leeloo-bitbucket/CLAUDE.md` 참조

### leeloo-n8n (v1.0.1) — 외부 연동
n8n MCP 17개 도구를 8개 skill로 래핑.
- Skills: lk-n8n-setup, lk-n8n-workflow, lk-n8n-run, lk-n8n-validate, lk-n8n-node, lk-n8n-template, lk-n8n-version, lk-n8n-docs
- 상세: `leeloo-n8n/CLAUDE.md` 참조

### leeloo-its (v1.0.1) — 외부 연동
ITS Oracle DB 대화형 관리. DDL 생성/수정, 코드 관리, 시설물 등록.
- Skills: lk-its-ddl, lk-its-code, lk-its-equip
- 상세: `leeloo-its/CLAUDE.md` 참조

## Coding Principles — 스파게티 코드 작성 절대 금지 ⚠

> **이 프로젝트에서 코드를 작성·수정하는 모든 순간 강제 점검.**
> 상세 규칙은 `~/.claude/CLAUDE.md` **필수 원칙 7번**을 따른다. 아래는 매 작업마다 재확인하는 요약 체크리스트이다.
> 하나라도 위반하면 커밋/제출하지 말고 **즉시 분해·리팩터링**한다. "일단 돌아가게 하고 나중에"는 금지.

1. **단일 책임(SRP)** — 함수/클래스는 하나의 역할만. 변경 이유 2개 이상이면 분리.
2. **중첩 3단계 제한** — `if`/`for`/`while` 중첩 ≤ 3. 예외는 **Early Return / Guard Clause**로 먼저 처리.
3. **함수 50~80줄 이내** — 화면 한 장 초과 시 분해.
4. **복잡도 게이트** — 분기 10개 이상 또는 중첩 4단계 도달 시 **즉시 분해** (예외 없음).
5. **DRY & KISS** — 동일 로직 3회째엔 추출. 단, 추상화가 단순성을 해치면 중복을 용인.
6. **의미 있는 이름 우선** — 주석으로 모호한 이름을 보완하지 않는다.
7. **낮은 결합도** — 전역 상태·숨은 의존성·순환 참조 금지. 입출력은 명시적 인자/반환값으로만.
8. **스파게티 우회 금지** — 기존 스파게티에 덧씌우지 말 것. 수술 범위를 먼저 제안하고 **사용자 승인 후** 진행.

## Key Design Decisions

- **멀티 플러그인 레포**: marketplace.json의 plugins 배열로 8개 플러그인 제공. 유형별 분리.
- **네임스페이스 분리**: lk- (kit/workflow/git/agent) / lk-doc- (doc) / lk-bb- (bitbucket) / lk-n8n- (n8n) / lk-its- (its) 접두사로 충돌 방지.
- **독립 설치**: 각 플러그인은 개별적으로 활성화/비활성화 가능.

## Testing Changes

1. 레포를 마켓플레이스에 등록
2. 플러그인 목록에서 8개가 표시되는지 확인
3. 각 플러그인의 skill이 `/` 자동완성에 나타나는지 확인

## Failure Memory
file-io(1건) — 상세: .leeloo/failure-memory/ 참조
- `Edit /Users/heesung/work/M_CHO/leeloo-claude-setup/leeloo-kit/scripts/session-start.js` — {"filePath":"/Users/heesung/work/M_CHO/leeloo-claude-setup/leeloo-kit/scripts/se
