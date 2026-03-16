# leeloo-claude-setup

Leeloo(이루기술) 사내 Claude Code 환경 자동 설정 플러그인.

설치 후 첫 세션에서 사내 표준 설정을 자동 적용합니다.

## 설치

```bash
claude plugins:add /path/to/leeloo-claude-setup
```

또는 Plugin Marketplace를 통해 설치합니다.

## 설치 시 적용되는 항목

| 항목 | 설명 | 동작 |
|------|------|------|
| `settings.json` | 훅, 상태바, 플러그인, 마켓플레이스 설정 | 기존 설정에 **딥 머지** |
| `settings.local.json` | 로컬 권한 설정 | 없을 때만 생성 |
| `statusline-leeloo.sh` | Powerline 스타일 상태바 (모델, 컨텍스트, 비용, git) | 항상 덮어쓰기 |
| `CLAUDE.md` | 사내 표준 글로벌 CLAUDE.md | 없을 때만 생성 |
| `gemini-cli` | Gemini 교차검증용 CLI 도구 | 없을 때만 npm 설치 |

모든 파일은 `~/.claude/` 디렉토리에 배포됩니다.

## 주요 설정 내용

### 스킬

- `/leeloo-commit` — Conventional Commits + 한국어 스타일 커밋 메시지 자동 생성
- `/leeloo-cross-validate` — gemini-cli로 plan 교차검증 (Gemini가 독립적으로 설계 리뷰)

### 훅

- **Stop** — 작업 완료 시 macOS 알림 (Glass 사운드)
- **Notification** — 사용자 입력 대기 시 macOS 알림 (Ping 사운드)
- **PostToolUse(ExitPlanMode)** — plan mode 종료 시 Gemini 교차검증 제안

### 활성화 플러그인

- `leeloo-flow` — 사내 프로젝트 관리 워크플로우
- `context7`, `code-review`, `playwright`, `serena` 등 공식 플러그인 다수

### 마켓플레이스

- `claude-plugins-official` (GitHub)
- `leeloo-flow` (Bitbucket)
- `leeloo-claude-setup` (Bitbucket)

## 설계 원칙

- **머지, 덮어쓰기 아님** — `settings.json`은 `jq`로 딥 머지하여 기존 설정을 보존합니다.
- **멱등성** — 마커 파일(`~/.claude/.leeloo-setup-done`)로 중복 실행을 방지합니다.
- **비파괴적** — `settings.local.json`과 `CLAUDE.md`는 이미 존재하면 건드리지 않습니다.

## 사전 요구사항

- [jq](https://jqlang.github.io/jq/) — JSON 딥 머지에 필요
  ```bash
  brew install jq
  ```
- [Node.js / npm](https://nodejs.org/) — gemini-cli 자동 설치에 필요 (선택)

## 재설정

설정을 다시 적용하려면 마커 파일을 삭제 후 Claude Code를 재시작합니다:

```bash
rm -f ~/.claude/.leeloo-setup-done
```

## 구조

```
leeloo-claude-setup/
├── .claude-plugin/
│   └── marketplace.json         # 마켓플레이스 매니페스트
├── plugin.json              # 플러그인 매니페스트 (SessionStart, PostToolUse 훅)
├── setup-claude-code.sh     # 멱등성 설정 스크립트
├── skills/
│   ├── leeloo-commit/SKILL.md          # /leeloo-commit 스킬
│   └── leeloo-cross-validate/SKILL.md  # /leeloo-cross-validate 스킬
└── resources/
    ├── settings-template.json   # settings.json 머지 템플릿
    ├── settings.local.json      # 로컬 권한 템플릿
    ├── statusline-leeloo.sh     # 상태바 스크립트
    ├── gemini-review-prompt.md  # Gemini 교차검증 프롬프트 템플릿
    └── CLAUDE.md                # 글로벌 CLAUDE.md 템플릿
```
