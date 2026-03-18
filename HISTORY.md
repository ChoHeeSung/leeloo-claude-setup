# HISTORY.md

## 2026-03-18

### leeloo-kit v2.0.0 리브랜딩 + PDCA 워크플로우 도입

**지시 요약**: leeloo-claude-setup → leeloo-kit으로 리브랜딩. PDCA 워크플로우, Gemini+Claude 이중 검증, 에이전트 자동화를 도입. 셸 스크립트 제거하고 순수 플러그인 구조로 전환.

**작업 내용**:

1. **리브랜딩**: plugin.json name → "leeloo-kit", 스킬 접두사 leeloo- → lk-
2. **순수 플러그인 전환**: setup-claude-code.sh, uninstall-claude-code.sh 삭제. settings-template.json, resources/settings.local.json 삭제. 마커 파일/백업 메커니즘 불필요.
3. **기반 인프라**: leeloo.config.json(중앙 설정), scripts/lib/(유틸리티 5개), hooks.json(5 이벤트), 런타임 스크립트 5개
4. **PDCA 스킬**: lk-plan(브레인스토밍 Plan), lk-pdca(design/do/analyze/report/status)
5. **검증 자동화**: lk-cross-validate(Score Card), lk-review(Gemini+Claude 이중 리뷰)
6. **에이전트 4개**: gap-detector, pdca-iterator, code-analyzer, report-generator
7. **기존 스킬 강화**: lk-agent(7종 프리셋), lk-team(5종 프리셋), lk-todo(설계문서 참조), lk-commit(TODO 연동), lk-setup(선택적 환경)
8. **템플릿 5개**: plan, design, analysis, report, do
9. **아웃풋 스타일 3개**: lk-dual-verify, lk-mentor, lk-ops
10. **레거시 제거**: leeloo-* 스킬 디렉토리 6개, 셸 스크립트 2개, 불필요 리소스 2개

**구현 방식**: Agent Team (3명 병렬) — infra(config/lib/hooks/scripts), content(템플릿/에이전트/스타일), skills(스킬 9개). 약 10분 만에 22개 태스크 완료.

**결과**:
- 생성: 30+ 파일 (scripts, agents, skills, templates, output-styles)
- 수정: 4 파일 (plugin.json, hooks.json, CLAUDE.md x2)
- 삭제: 10 파일 (셸 스크립트 2 + 레거시 스킬 6 + 불필요 리소스 2)

**비유**: 기존에는 "사무실 셋업 매뉴얼(setup script)"을 들고 다니며 하나하나 설치해야 했다면, 이제는 "스마트 오피스 패키지(순수 플러그인)"를 구독하면 모든 시스템이 자동으로 켜지는 것과 같다. PDCA 워크플로우는 건축 프로젝트와 같아서 — 설계도(Plan) → 상세도면(Design) → 시공(Do) → 감리(Analyze) → 준공보고서(Report) 순서를 강제하고, 감리 합격률(Match Rate)이 90% 미만이면 재시공을 지시한다.

---

## 2026-03-17

### uv (uvx) 자동 설치 추가

**지시 요약**: 초기 설정 스크립트에 uv/uvx 자동 설치 단계 추가

**작업 내용**:
1. `setup-claude-code.sh`에 Step 6으로 uv 설치 로직 추가 (기존 Step 6~7 → Step 7~8로 조정)
2. `command -v uvx`로 설치 여부 확인 → 없으면 공식 설치 스크립트 실행
3. curl 미설치 시 수동 설치 안내, 설치 실패 시에도 스크립트 중단하지 않음
4. README.md 설치 항목 테이블에 uv/uvx 추가

**핵심 코드**:
```bash
if ! command -v uvx &> /dev/null; then
    curl -LsSf https://astral.sh/uv/install.sh | sh 2>/dev/null \
        || echo "[leeloo-setup] uv 자동 설치 실패" >&2
fi
```

**결과**: 플러그인 설치 시 uv/uvx가 자동 설치되어 MCP 서버 등 Python 도구를 바로 사용 가능

**비유**: 새 사무실에 만능 공구함(uv)을 기본 비품으로 비치해 두는 것과 같다. Python 도구가 필요할 때 공구함에서 꺼내 바로 사용(uvx)할 수 있다.

---

### 초기 설치를 SessionStart 훅 → /leeloo-setup 스킬로 전환

**지시 요약**: Linux에서 SessionStart `prompt` 타입 훅 에러 발생, `command` 타입으로 변경해도 출력이 UI에 표시되지 않는 문제 → 훅 대신 스킬로 전환

**작업 내용**:
1. `skills/leeloo-setup/SKILL.md` 신규 생성 — install/uninstall/status 서브커맨드
2. `hooks/hooks.json`에서 SessionStart 훅 제거 (PostToolUse만 유지)
3. README.md, CLAUDE.md 업데이트 — 설치 방법을 `/leeloo-setup`으로 변경

**결과**: 크로스 플랫폼 호환성 확보, 사용자가 `/leeloo-setup`으로 명시적 설치/제거/상태확인

**비유**: 기존에는 새 직원이 출근(세션 시작)하면 자동 안내판(훅)이 떠야 했는데, 안내판 자체가 건물(OS)에 따라 안 보이는 문제가 있었다. 이제 안내 데스크(스킬)를 따로 만들어 직원이 직접 찾아오면 확실하게 안내해주는 방식으로 바꾼 것.

---

### Sub Agent 생성 스킬 + Agent Team 생성 스킬 추가

**지시 요약**: 사용자가 에이전트 frontmatter 문법이나 TeamCreate 도구 파라미터를 직접 알 필요 없이, 대화형으로 Sub Agent와 Agent Team을 구성할 수 있는 스킬 2종 추가

**작업 내용**:
1. **`/leeloo-agent` 스킬 생성** (`skills/leeloo-agent/SKILL.md`)
   - 서브커맨드: `create`, `create --preset`, `list`, `show`, `delete`
   - 프리셋 5종: `code-reviewer`, `debugger`, `tester`, `researcher`, `docs-writer`
   - 대화형 생성: 역할 질문 1회 → 자동 추론(name, tools, model, permissionMode) → 프리뷰 확인 → 파일 생성
   - 모델 선택 기준: opus(고난이도 추론) / sonnet(일반 구현) / haiku(단순 탐색)
   - 생성 위치: `.claude/agents/{name}.md` (Claude Code 공식 경로)

2. **`/leeloo-team` 스킬 생성** (`skills/leeloo-team/SKILL.md`)
   - 서브커맨드: `create`, `create --preset`, `list`, `message`, `broadcast`, `shutdown`
   - 팀 프리셋 4종: `fullstack`, `review-squad`, `refactor`, `research`
   - 대화형 생성: 목적 질문 1회 → 자동 설계(팀원 수/역할/모델/태스크 의존성) → 프리뷰 확인 → TeamCreate + TaskCreate + Agent spawn
   - TeamCreate, SendMessage, TeamDelete 도구를 래핑

3. **README.md** — 스킬 목록 및 구조도에 2개 스킬 추가
4. **CLAUDE.md** — Architecture 섹션에 2개 스킬 추가

**핵심 설계**:
```
# 에이전트 생성 플로우 (질문 최소화 → 추론 최대화)
질문 1회 (역할/목적) → AI 추론 (설정 전체) → 프리뷰 확인 → 생성

# 도구 최소화 원칙
읽기 전용 → ["Read", "Grep", "Glob"] + plan 모드
코드 수정 → + "Edit" + acceptEdits 모드
명령어 실행 → + "Bash" + default 모드
```

**결과**: `/leeloo-agent`로 Sub Agent를, `/leeloo-team`으로 Agent Team을 대화형으로 생성·관리 가능

**비유**: 기존에는 팀을 꾸리려면 채용 서류(frontmatter)를 직접 작성하고 인사 시스템(TeamCreate API)에 수동 등록해야 했는데, 이제 "이런 역할이 필요해요"라고 한마디만 하면 HR 담당자(스킬)가 채용 공고 작성부터 온보딩까지 자동으로 처리해주는 것과 같다.

---

### Agent Team 설정 추가

**지시 요약**: 초기 설정 시 Claude Code agent-team 플래그도 함께 설정되도록 추가

**작업 내용**:
1. `resources/settings-template.json`에 agent-team 관련 설정 추가
   - `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`: `"1"` (실험 기능 활성화)
   - `teammateMode`: `"auto"` (tmux/iTerm2는 split panes, 일반 터미널은 in-process)
2. `README.md`에 Agent Team 설정 섹션 추가

**핵심 코드**:
```json
// settings-template.json에 추가된 설정
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "teammateMode": "auto"
}
```

**결과**: 플러그인 설치 후 설정 스크립트 실행 시 agent-team 기능이 자동 활성화됨

**비유**: 새 사무실 세팅할 때 회의실(agent-team)도 기본 비품으로 포함시킨 것과 같다. 회의실 배치 모드(teammateMode)는 사무실 크기(터미널 종류)에 맞게 자동 조절된다.

---

## 2026-03-05

### 상태바 스크립트 파일명 변경

**지시 요약**: `statusline-cc-chips.sh` 파일명을 `statusline-leeloo.sh`로 변경하고, 관련 스크립트 내 참조도 수정

**작업 내용**:
1. 파일명 변경: `statusline-cc-chips.sh` → `statusline-leeloo.sh`
2. `statusline-leeloo.sh` 내 주석 수정: `CC CHIPS` → `Leeloo`
3. `setup-claude-code.sh` 내 참조 5곳 일괄 수정:
   - `settings.json`의 command 경로
   - `cp` 복사 명령어
   - `chmod` 실행 권한 부여
   - 설치 완료 메시지
   - 설정 요약 메시지
4. Step 4 섹션 주석도 `Leeloo statusline`으로 변경

**결과**: 모든 참조가 `statusline-leeloo.sh`로 통일됨

**비유**: 마치 회사 이름이 바뀌어서 간판(파일명)과 명함·서류(스크립트 내 참조) 모두를 새 이름으로 교체한 것과 같다.

## 2026-03-16

### Git 레포지토리 명 결정

**지시 요약**: Claude Code 초기 설정용 폴더의 Git 레포지토리 이름 추천 요청 (사내 폐쇄 용도, 회사명 leeloo/이루기술 반영)

**작업 내용**:
1. 플러그인 마켓 등록용 → 사내 폐쇄 용도로 방향 변경
2. 회사 브랜딩(leeloo) 반영한 후보 제시
3. 간결하고 직관적인 이름 위주로 추천

**결과**: **`leeloo-claude-setup`** 으로 확정

**비유**: 새 사무실을 열 때 건물 간판 이름을 정하는 것과 같다. 외부 고객용 화려한 이름이 아니라, 사내 직원들이 "아, 그 셋업 레포" 하고 바로 알아볼 수 있는 실용적인 이름을 선택한 것.

### Git Remote 설정

**지시 요약**: Bitbucket 원격 레포지토리 주소를 origin으로 설정

**작업 내용**:
- `git remote add origin https://ChoHeesung@bitbucket.org/leeloocoltd/leeloo-claude-setup.git`

**결과**: origin remote 설정 완료 (fetch/push 모두 동일 주소)

### 플러그인 구조 전환 (셸 스크립트 → Claude Code 플러그인)

**지시 요약**: 플러그인 설치 시 환경 설정이 즉각 실행되도록 Claude Code 플러그인 구조로 전환. 스킬 없이 설치만으로 모든 환경 설정 자동 적용.

**작업 내용**:
1. `plugin.json` 생성 — `SessionStart` 훅으로 셋업 스크립트 자동 트리거
2. `resources/` 디렉토리 생성 — 설정 템플릿 분리
   - `settings-template.json`: 머지용 설정 템플릿 (`__HOME__` 플레이스홀더 사용)
   - `settings.local.json`: 로컬 권한 설정
   - `statusline-leeloo.sh`: 상태바 스크립트
   - `CLAUDE.md`: 사내 표준 CLAUDE.md
3. `setup-claude-code.sh` 재작성:
   - 마커 파일(`~/.claude/.leeloo-setup-done`)로 멱등성 보장
   - `jq`를 이용한 settings.json 딥 머지 (기존 설정 보존)
   - settings.local.json, CLAUDE.md는 없을 때만 생성
   - 플러그인 마켓플레이스 등록/설치 로직 제거 (plugin.json의 enabledPlugins로 대체)

**핵심 코드**:
```json
// plugin.json — SessionStart 훅
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "bash ${CLAUDE_PLUGIN_ROOT}/setup-claude-code.sh"
      }]
    }]
  }
}
```
```bash
# 멱등성: 마커 파일 있으면 즉시 종료
if [ -f "$MARKER_FILE" ]; then exit 0; fi
# 머지: 기존 설정 보존하며 사내 설정 추가
jq -s '.[0] * .[1]' "$SETTINGS_FILE" <(echo "$TEMPLATE_RESOLVED")
```

**결과**: 플러그인 설치 → 첫 세션 시작 → 자동 환경 설정 → 이후 세션에서는 스킵

**비유**: 새 직원이 입사(플러그인 설치)하면 첫 출근일(첫 세션)에 사원증, 노트북, 계정이 자동 세팅되고, 다음 날부터는 그냥 출근만 하면 되는 온보딩 시스템과 같다.

### Git Commit Skill 내장

**지시 요약**: 기존 `leeloo-flow` 마켓플레이스의 `/commit` 스킬을 `leeloo-claude-setup` 플러그인에 내장하여 별도 인증/의존성 없이 사용 가능하게 전환

**작업 내용**:
1. `skills/commit/SKILL.md` 신규 생성 — 기존 `leeloo-flow/plugins/commit/skills/commit/SKILL.md` 내용 그대로 복사
   - Conventional Commits + 한국어 스타일 커밋 메시지 자동 생성
   - `--push` 플래그 지원, 메시지 직접 입력 옵션
   - Haiku 서브 에이전트로 diff 분석 위임
2. `resources/settings-template.json`에는 `commit@leeloo-flow` 항목이 없어 변경 불필요

**핵심 구조**:
```
skills/
└── commit/
    └── SKILL.md    ← auto-discovery로 플러그인에 자동 인식
```

**결과**: 플러그인 설치만으로 `/commit` 스킬 사용 가능. 별도 마켓플레이스 인증 불필요.

**비유**: 기존에는 커밋 도장(스킬)을 다른 건물(leeloo-flow 마켓플레이스)까지 가서 빌려와야 했는데, 이제 우리 사무실 서랍(leeloo-claude-setup)에 도장을 비치해 놓은 것과 같다.

### Gemini 교차검증 스킬 및 훅 추가

**지시 요약**: Claude plan mode에서 작성한 설계를 gemini-cli로 교차검증하는 기능 추가. 수동 호출(`/cross-validate`)과 plan mode 종료 시 자동 제안(PostToolUse 훅) 두 가지 진입점.

**작업 내용**:
1. `skills/cross-validate/SKILL.md` 신규 생성 — 7단계 프로시저
   - gemini-cli 존재 확인 → plan 파일 탐색 → gemini 실행 → 결과 표시/저장
   - 리뷰 결과는 **로컬 프로젝트 루트**에 `{plan파일명}.review.md`로 저장
   - 에러 처리: 미설치, 파일 없음, timeout, 빈 응답
2. `resources/gemini-review-prompt.md` 신규 생성 — 시니어 아키텍트 역할 프롬프트
   - 5가지 검증 기준: 완전성, 실현 가능성, 리스크, 대안, 논리 검증
   - 출력 형식: Overall Verdict / Strengths / Critical Issues / Concerns / Suggestions / Recommendations
3. `plugin.json` 수정 — `PostToolUse` 훅 추가
   - `matcher: "ExitPlanMode"` — plan mode 종료 시에만 트리거
   - `type: "prompt"` — 사용자에게 교차검증 제안

**핵심 코드**:
```json
// plugin.json — PostToolUse 훅 추가
"PostToolUse": [{
  "matcher": "ExitPlanMode",
  "hooks": [{
    "type": "prompt",
    "prompt": "Plan mode를 방금 종료했습니다. '/cross-validate를 실행하면 Gemini가 이 plan을 독립적으로 검증합니다. 교차검증하시겠습니까?'"
  }]
}]
```
```bash
# gemini-cli 실행 (120초 timeout)
timeout 120 gemini -p "${PROMPT}\n---\n${PLAN_CONTENT}" -o text
```

**결과**: `/cross-validate` 스킬로 수동 교차검증 가능, plan mode 종료 시 자동 제안

**비유**: 건축 설계도(plan)를 완성한 후, 다른 건축사(Gemini)에게 "이 설계에 문제 없는지 한번 봐주세요"라고 검토를 의뢰하는 것과 같다. 수동으로 의뢰할 수도 있고(스킬), 설계가 끝나면 자동으로 "검토 받으시겠습니까?"라고 물어보기도 한다(훅).

### gemini-cli 자동 설치 추가

**지시 요약**: 초기 설치 스크립트(`setup-claude-code.sh`)에 gemini-cli 자동 설치 단계 추가

**작업 내용**:
1. Step 5로 gemini-cli 설치 로직 추가 (기존 Step 5~6 → Step 6~7로 번호 조정)
2. `command -v gemini`로 이미 설치 여부 확인 → 없으면 `npm install -g @google/gemini-cli` 실행
3. npm 미설치 시 수동 설치 안내 메시지 출력
4. 설치 실패 시에도 스크립트는 중단하지 않음 (교차검증은 선택 기능)

**핵심 코드**:
```bash
if ! command -v gemini &> /dev/null; then
    if command -v npm &> /dev/null; then
        npm install -g @google/gemini-cli 2>/dev/null \
            || echo "gemini-cli 자동 설치 실패" >&2
    fi
fi
```

**결과**: 플러그인 첫 세션 시 gemini-cli가 자동 설치되어 `/cross-validate` 스킬을 바로 사용 가능

**비유**: 새 사무실에 복합기(gemini-cli)를 기본 비품으로 배치해 두는 것과 같다. 없으면 자동으로 설치하고, 이미 있으면 건너뛴다.

### 마켓플레이스 매니페스트 추가

**지시 요약**: leeloo-claude-setup 레포를 Claude Code 플러그인 마켓플레이스로도 등록할 수 있도록 `.claude-plugin/marketplace.json` 추가

**작업 내용**:
1. `.claude-plugin/marketplace.json` 신규 생성 — anthropics/claude-plugins-official 형식 준수
   - name, description, owner, plugins 배열 구조
   - `source: "."` 으로 같은 레포 내 플러그인 참조
2. `resources/settings-template.json` 수정
   - `enabledPlugins`에 `leeloo-claude-setup@leeloo-claude-setup` 추가
   - `extraKnownMarketplaces`에 leeloo-claude-setup Bitbucket URL 추가
3. `README.md` 구조도에 `.claude-plugin/` 디렉토리 및 마켓플레이스 항목 추가

**핵심 코드**:
```json
// .claude-plugin/marketplace.json
{
  "name": "leeloo-claude-setup",
  "plugins": [{
    "name": "leeloo-claude-setup",
    "source": ".",
    "category": "productivity"
  }]
}
```

**결과**: Add Marketplace에서 Bitbucket URL로 마켓플레이스 등록 가능

**비유**: 가게(플러그인)를 운영하면서 동시에 그 가게가 입점한 쇼핑몰 안내 디렉토리(마켓플레이스)도 함께 만든 것과 같다. 이제 "이 쇼핑몰에 어떤 가게가 있나요?"라고 물으면 자기 자신을 소개할 수 있다.

### Linux 호환성 수정 — OS별 분기 처리

**지시 요약**: Linux 서버에서 플러그인 테스트 시 발견된 macOS 전용 코드 문제 수정

**발견된 문제점**:
1. 알림 훅이 `osascript` (macOS 전용) → Linux에서 작동 안 함
2. jq 미설치 안내가 `brew install jq` (macOS 전용)
3. gemini-cli 미설치 시 Node.js 설치 안내가 macOS 전용

**작업 내용**:
1. `setup-claude-code.sh`에 `OS_TYPE="$(uname -s)"` OS 감지 추가
2. `settings-template.json`의 알림 명령어를 `__NOTIFY_STOP__`, `__NOTIFY_INPUT__` 플레이스홀더로 변경
3. setup 스크립트에서 OS별 분기:
   - macOS: `osascript` (기존)
   - Linux: `notify-send` (libnotify)
4. jq 설치 안내: macOS → `brew install jq`, Linux → `sudo apt install jq`
5. Node.js 설치 안내: macOS → `brew install node`, Linux → `sudo apt install nodejs npm`

**핵심 코드**:
```bash
OS_TYPE="$(uname -s)"
if [ "$OS_TYPE" = "Darwin" ]; then
    NOTIFY_STOP="osascript -e '...'"
else
    NOTIFY_STOP="notify-send -a 'Claude Code' '작업 완료' '...'"
fi
```

**결과**: macOS와 Linux 모두에서 플러그인이 정상 작동

**비유**: 해외 지사(Linux 서버)에도 본사(macOS)와 동일한 사내 시스템을 구축하되, 현지 인프라(notify-send, apt)에 맞게 로컬라이징한 것과 같다.

### 안전 설치 가이드 + 백업/언인스톨 + TODO 스킬

**지시 요약**: SessionStart 훅의 자동 실행 위험성 해소, 백업/복원 메커니즘 추가, Plan→TODO 변환 스킬 추가

**작업 내용**:
1. **SessionStart 훅 변경**: `type: "command"` → `type: "prompt"` 로 전환. 자동 실행 대신 설치 가이드만 표시
2. **백업 로직 추가**: `setup-claude-code.sh`에 Step 1.5로 `~/.claude/.leeloo-backup/` 백업 단계 삽입
3. **언인스톨 스크립트 생성**: `uninstall-claude-code.sh` — 백업 복원, 마커 삭제, 정리 (멱등성 보장)
4. **TODO 스킬 생성**: `skills/leeloo-todo/SKILL.md` — 8개 서브커맨드 (create/list/add/start/done/undo/clear)
5. **글로벌 CLAUDE.md 수정**: 필수 원칙 4번 "TODO.md 확인 원칙" 추가, 번호 재조정
6. **PostToolUse 훅 수정**: Plan mode 종료 시 교차검증 + TODO 생성 동시 제안
7. **README.md, CLAUDE.md 업데이트**: 백업, 언인스톨, TODO 스킬 설명 반영

**핵심 코드**:
```json
// hooks.json — SessionStart를 prompt 타입으로 변경
"SessionStart": [{
  "hooks": [{
    "type": "prompt",
    "prompt": "...마커 파일 확인 → 없으면 설치 가이드 표시..."
  }]
}]
```
```bash
# setup-claude-code.sh — 백업 로직
BACKUP_DIR="$CLAUDE_DIR/.leeloo-backup"
mkdir -p "$BACKUP_DIR"
for f in settings.json settings.local.json statusline-leeloo.sh CLAUDE.md; do
    [ -f "$CLAUDE_DIR/$f" ] && cp "$CLAUDE_DIR/$f" "$BACKUP_DIR/$f"
done
```

**결과**: 안전한 수동 설치 플로우, 완전한 백업/복원, Plan→TODO 워크플로우 완성

**비유**: 기존에는 새 직원이 첫 출근하면 시스템이 알아서 모든 걸 설치했는데(자동 실행), 이제는 "이것들을 설치해야 합니다"라는 체크리스트를 먼저 보여주고 직원이 직접 실행하는 방식으로 바뀌었다. 또한 설치 전 기존 환경을 사진 찍어두고(백업), 퇴사 시 원래대로 복원할 수 있게(언인스톨) 했다. 그리고 설계도(Plan)를 완성하면 "시공 작업 목록(TODO)"으로 변환하는 도구도 추가했다.

---

### 플러그인 구조 수정 — 훅 인식 + settings.json 파괴 버그 수정

**지시 요약**: Linux 서버에서 플러그인 설치 테스트 중 발견된 3가지 문제 수정

**발견된 문제점**:
1. SessionStart 훅이 자동 실행되지 않음
2. `plugin.json`을 `.claude-plugin/`으로 이동하면 플러그인 자체가 로드 안 됨
3. sed로 알림 명령어 치환 시 특수문자(`||`, `>`, `'`)가 settings.json을 파괴

**작업 내용**:
1. **훅 auto-discovery 구조 적용**: `hooks/hooks.json` 신규 생성 (공식 hookify 플러그인 구조 참고)
2. **plugin.json 위치 확정**: 루트에 유지 (`.claude-plugin/`으로 이동하면 플러그인 로드 실패)
3. **sed → jq 안전 치환**: 알림 명령어를 sed 플레이스홀더에서 jq `--arg` 주입으로 변경
   - `settings-template.json`에서 알림 플레이스홀더(`__NOTIFY_STOP__` 등) 제거
   - sed는 `__HOME__` 경로 치환만 담당
   - jq가 `.hooks` 필드를 안전하게 주입 (특수문자 자동 이스케이프)

**핵심 코드**:
```bash
# jq로 알림 훅 안전하게 주입
TEMPLATE_RESOLVED=$(echo "$TEMPLATE_RESOLVED" | jq \
    --arg stop_cmd "$NOTIFY_STOP" \
    --arg input_cmd "$NOTIFY_INPUT" \
    '.hooks = {
        "Stop": [{"hooks": [{"type": "command", "command": $stop_cmd}]}],
        "Notification": [{"hooks": [{"type": "command", "command": $input_cmd}]}]
    }')
```

**최종 플러그인 구조**:
```
leeloo-claude-setup/
├── plugin.json              ← 루트 (플러그인 매니페스트)
├── .claude-plugin/
│   └── marketplace.json     ← 마켓플레이스 전용
├── hooks/
│   └── hooks.json           ← 훅 auto-discovery
├── skills/                  ← 스킬 auto-discovery
└── ...
```

**결과**: SessionStart 훅 자동 실행, settings.json 정상 생성, 상태바 적용 확인

**비유**: 집(플러그인)을 지을 때, 대문(plugin.json)은 반드시 정문(루트)에 있어야 택배(Claude Code)가 찾아올 수 있다. 대문을 뒷골목(.claude-plugin/)으로 옮기면 택배가 "부재중"으로 돌아간다. 그리고 집 내부 배선(알림 명령어)은 전문가 도구(jq)로 시공해야 합선(sed 특수문자 파괴) 없이 안전하다.
