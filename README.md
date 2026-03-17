# leeloo-claude-setup

Leeloo(이루기술) 사내 Claude Code 환경 설정 플러그인.

설치 후 첫 세션에서 설치 가이드를 안내하며, 사용자가 직접 설정 스크립트를 실행합니다.

## 설치

```bash
claude plugins:add /path/to/leeloo-claude-setup
```

또는 Plugin Marketplace를 통해 설치합니다.

플러그인 설치 후 첫 세션에서 설치 안내가 표시됩니다. 터미널에서 직접 실행하세요:

```bash
bash <plugin-root>/setup-claude-code.sh
```

## 설치 시 적용되는 항목

| 항목 | 설명 | 동작 |
|------|------|------|
| `settings.json` | 훅, 상태바, 플러그인, 마켓플레이스 설정 | 기존 설정에 **딥 머지** |
| `settings.local.json` | 로컬 권한 설정 | 없을 때만 생성 |
| `statusline-leeloo.sh` | Powerline 스타일 상태바 (모델, 컨텍스트, 비용, git) | 항상 덮어쓰기 |
| `CLAUDE.md` | 사내 표준 글로벌 CLAUDE.md | 없을 때만 생성 |
| `gemini-cli` | Gemini 교차검증용 CLI 도구 | 없을 때만 npm 설치 |

모든 파일은 `~/.claude/` 디렉토리에 배포됩니다.

## 백업

설치 스크립트는 실행 전 기존 파일들을 `~/.claude/.leeloo-backup/`에 자동 백업합니다.

백업 대상: `settings.json`, `settings.local.json`, `statusline-leeloo.sh`, `CLAUDE.md`

- 수정 전 기존 파일만 백업 (없으면 스킵)
- 재설치 시 백업 덮어씀 (항상 최신 설치 전 상태 유지)

## 제거 (Uninstall)

```bash
bash <plugin-root>/uninstall-claude-code.sh
```

제거 스크립트 동작:
- `~/.claude/.leeloo-backup/`에서 원래 파일 복원
- 백업에 없는 파일(=설치가 새로 만든 파일)은 삭제
- 마커 파일(`~/.claude/.leeloo-setup-done`) 삭제
- 백업 디렉토리 정리
- 멱등성 보장 (여러 번 실행해도 안전)

**참고**: gemini-cli, Node.js 등 시스템 패키지는 제거하지 않습니다.

## 주요 설정 내용

### 스킬

- `/leeloo-commit` — Conventional Commits + 한국어 스타일 커밋 메시지 자동 생성
- `/leeloo-cross-validate` — gemini-cli로 plan 교차검증 (Gemini가 독립적으로 설계 리뷰)
- `/leeloo-todo` — Plan을 TODO 리스트로 변환하고 진행 상황 추적
- `/leeloo-agent` — Sub Agent 대화형 생성/관리 (프리셋 5종 내장)
- `/leeloo-team` — Agent Team 대화형 구성/관리 (프리셋 4종 내장)

### Agent Team

- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` — 에이전트 팀 기능 활성화
- `teammateMode: "auto"` — 디스플레이 모드 (tmux/iTerm2에서 split panes, 일반 터미널에서 in-process)

### 훅

- **SessionStart** — 설정 미완료 시 설치 가이드 표시 (prompt 타입)
- **Stop** — 작업 완료 시 macOS 알림 (Glass 사운드)
- **Notification** — 사용자 입력 대기 시 macOS 알림 (Ping 사운드)
- **PostToolUse(ExitPlanMode)** — plan mode 종료 시 Gemini 교차검증 + TODO 생성 제안

### 활성화 플러그인

- `leeloo-flow` — 사내 프로젝트 관리 워크플로우
- `context7`, `code-review`, `playwright`, `serena` 등 공식 플러그인 다수

### 마켓플레이스

- `claude-plugins-official` (GitHub)
- `leeloo-flow` (Bitbucket)
- `leeloo-claude-setup` (Bitbucket)

## 설계 원칙

- **수동 실행** — SessionStart 훅은 설치 가이드만 표시하고, 사용자가 직접 스크립트를 실행합니다.
- **머지, 덮어쓰기 아님** — `settings.json`은 `jq`로 딥 머지하여 기존 설정을 보존합니다.
- **멱등성** — 마커 파일(`~/.claude/.leeloo-setup-done`)로 중복 실행을 방지합니다.
- **비파괴적** — `settings.local.json`과 `CLAUDE.md`는 이미 존재하면 건드리지 않습니다.
- **백업 & 복원** — 설치 전 기존 파일을 백업하고, 언인스톨로 복원할 수 있습니다.

## 사전 요구사항

- [jq](https://jqlang.github.io/jq/) — JSON 딥 머지에 필요
  ```bash
  brew install jq
  ```
- [Node.js / npm](https://nodejs.org/) — gemini-cli 자동 설치에 필요 (선택)

## 재설정

설정을 다시 적용하려면 마커 파일을 삭제 후 설정 스크립트를 실행합니다:

```bash
rm -f ~/.claude/.leeloo-setup-done
bash <plugin-root>/setup-claude-code.sh
```

## 구조

```
leeloo-claude-setup/
├── .claude-plugin/
│   ├── plugin.json              # 플러그인 매니페스트
│   └── marketplace.json         # 마켓플레이스 매니페스트
├── hooks/
│   └── hooks.json               # 훅 정의 (SessionStart, PostToolUse)
├── setup-claude-code.sh         # 멱등성 설정 스크립트 (백업 포함)
├── uninstall-claude-code.sh     # 언인스톨 스크립트 (백업 복원)
├── skills/
│   ├── leeloo-agent/SKILL.md           # /leeloo-agent 스킬
│   ├── leeloo-commit/SKILL.md          # /leeloo-commit 스킬
│   ├── leeloo-cross-validate/SKILL.md  # /leeloo-cross-validate 스킬
│   ├── leeloo-team/SKILL.md            # /leeloo-team 스킬
│   └── leeloo-todo/SKILL.md            # /leeloo-todo 스킬
└── resources/
    ├── settings-template.json   # settings.json 머지 템플릿
    ├── settings.local.json      # 로컬 권한 템플릿
    ├── statusline-leeloo.sh     # 상태바 스크립트
    ├── gemini-review-prompt.md  # Gemini 교차검증 프롬프트 템플릿
    └── CLAUDE.md                # 글로벌 CLAUDE.md 템플릿
```
