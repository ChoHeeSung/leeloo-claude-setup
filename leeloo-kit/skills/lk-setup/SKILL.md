---
name: lk-setup
description: |
  Leeloo-kit 환경 강화 도구 — 설치·statusline·플러그인 토글·기본 모델 설정·CLAUDE.md 동기화.
  환경 설정, 셋업, 설치, 모델 설정, 플러그인 토글, statusline, setup, install, model, plugins, statusline
user_invocable: true
argument-hint: "[status|install|model|plugins|statusline|claude-md|gemini|serena|reinstall]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-setup — Optional Environment Enhancement

Selectively install or inspect individual leeloo-kit environment components.
Handled directly by tool calls inside the SKILL.md Procedure — no shell scripts required.

## Subcommands

```
/lk-setup                         — show current environment status (default = status)
/lk-setup status                  — show current environment status
/lk-setup install                 — install missing items in batch (skip already installed)
/lk-setup reinstall               — full reinstall (overwrite existing config)
/lk-setup statusline              — copy statusline-leeloo.sh to ~/.claude/
/lk-setup claude-md               — install CLAUDE.md to ~/.claude/CLAUDE.md
/lk-setup gemini                  — show gemini-cli install guide
/lk-setup serena                  — disable serena plugin dashboard auto-open
/lk-setup plugins                 — list installed plugins + status (default = list)
/lk-setup plugins list            — list installed plugins + status
/lk-setup plugins toggle          — interactive plugin on/off
/lk-setup plugins audit           — detect likely-unused plugins (repo analysis)
/lk-setup plugins install-docskills — register document-skills + anthropic-agent-skills marketplace
/lk-setup plugins mcp-list        — list MCP servers + status
/lk-setup plugins mcp-toggle      — interactive MCP server on/off
/lk-setup model                   — view and change the default session model
```

## Procedure

### Argument Parsing

Parse the subcommand from user input:
- No argument or `status` → **status** action
- `install` → **install** action
- `reinstall` → **reinstall** action
- `statusline` → **statusline** action
- `claude-md` → **claude-md** action
- `gemini` → **gemini** action
- `serena` → **serena** action
- `plugins` alone or `plugins list` → **plugins list** action
- `plugins toggle` → **plugins toggle** action
- `plugins audit` → **plugins audit** action
- `plugins install-docskills` → **plugins install-docskills** action (former `plugins` action)
- `plugins mcp-list` → **plugins mcp-list** action
- `plugins mcp-toggle` → **plugins mcp-toggle** action
- `model` → **model** action

---

### status action

Use Bash to check the following items:

```bash
# Node.js version
node --version 2>/dev/null || echo "NOT_INSTALLED"

# gemini-cli installation
command -v gemini 2>/dev/null || echo "NOT_INSTALLED"

# statusline existence
test -f ~/.claude/statusline-leeloo.sh && echo "INSTALLED" || echo "NOT_INSTALLED"

# CLAUDE.md existence
test -f ~/.claude/CLAUDE.md && echo "INSTALLED" || echo "NOT_INSTALLED"

# jq installation
command -v jq 2>/dev/null || echo "NOT_INSTALLED"

# serena dashboard auto-open setting
grep -q 'web_dashboard_open_on_launch: false' ~/.serena/serena_config.yml 2>/dev/null && echo "CONFIGURED" || echo "NOT_CONFIGURED"

# anthropic-agent-skills marketplace registration
grep -q 'anthropic-agent-skills' ~/.claude/settings.json 2>/dev/null && echo "REGISTERED" || echo "NOT_REGISTERED"

# document-skills plugin installation
grep -q 'document-skills@anthropic-agent-skills' ~/.claude/settings.json 2>/dev/null && echo "INSTALLED" || echo "NOT_INSTALLED"

# Default model setting
python3 -c "import json; d=json.load(open(os.path.expanduser('~/.claude/settings.json'))); print(d.get('model','NOT_SET'))" 2>/dev/null || grep -o '"model"[[:space:]]*:[[:space:]]*"[^"]*"' ~/.claude/settings.json 2>/dev/null | head -1 | sed 's/.*: *"\(.*\)"/\1/' || echo "NOT_SET"
```

Display results as a table:

```
leeloo-kit 환경 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| Node.js | ✅ v22.x / ❌ 미설치 | gemini-cli 필요 |
| gemini-cli | ✅ 설치됨 / ❌ 미설치 | /lk-setup gemini |
| statusline-leeloo.sh | ✅ 설치됨 / ❌ 미설치 | /lk-setup statusline |
| CLAUDE.md | ✅ 설치됨 / ❌ 미설치 | /lk-setup claude-md |
| jq | ✅ 설치됨 / ❌ 미설치 | brew install jq |
| serena 대시보드 | ✅ 비활성화됨 / ⚠️ 자동 열기 | /lk-setup serena |
| anthropic-agent-skills | ✅ 등록됨 / ❌ 미등록 | /lk-setup plugins |
| document-skills | ✅ 설치됨 / ❌ 미설치 | /lk-setup plugins |
| 기본 모델 | claude-sonnet-4-6[1m] (또는 NOT_SET) | /lk-setup model |

설치되지 않은 항목은 해당 서브커맨드로 설치하세요.
```

---

### statusline action

1. **Verify source file**: run via Bash:
   ```bash
   test -f "${CLAUDE_PLUGIN_ROOT}/resources/statusline-leeloo.sh" && echo "EXISTS" || echo "NOT_FOUND"
   ```
   - If NOT_FOUND: "statusline-leeloo.sh 소스 파일을 찾을 수 없습니다." then abort.

2. **Read source file**: Read `${CLAUDE_PLUGIN_ROOT}/resources/statusline-leeloo.sh`.

3. **Check destination path**: run `test -f ~/.claude/statusline-leeloo.sh && echo "EXISTS" || echo "NOT_EXISTS"`.
   - If exists, AskUserQuestion — "~/.claude/statusline-leeloo.sh가 이미 존재합니다. 덮어쓸까요? (덮어쓰기/취소)"
   - On "취소": abort.

4. **Copy file**: Write the source content to `~/.claude/statusline-leeloo.sh`.

5. **Set executable**: run `chmod +x ~/.claude/statusline-leeloo.sh`.

6. **Register statusLine in settings.json**: Read `~/.claude/settings.json`, then:
   - If `statusLine` already references `statusline-leeloo.sh`: skip.
   - If `statusLine` is missing or different: Edit to set:
     ```json
     "statusLine": {
       "type": "command",
       "command": "bash ~/.claude/statusline-leeloo.sh"
     }
     ```
   - If `statusLine` is entirely absent: append it after `"hooks": {}` or another top-level key.

7. **Result message**:
   ```
   statusline-leeloo.sh 설치 완료

   경로: ~/.claude/statusline-leeloo.sh
   설정: ~/.claude/settings.json → statusLine 자동 등록됨

   Claude Code를 재시작하면 적용됩니다.
   ```

---

### claude-md action

1. **Check destination file**: run `test -f ~/.claude/CLAUDE.md && echo "EXISTS" || echo "NOT_EXISTS"`.

2. **If exists**: AskUserQuestion — "~/.claude/CLAUDE.md가 이미 존재합니다. 어떻게 처리할까요? (덮어쓰기/취소)"
   - On "취소": abort.

3. **Read source file**: Read `${CLAUDE_PLUGIN_ROOT}/resources/CLAUDE.md`.

4. **Install file**: Write the source content to `~/.claude/CLAUDE.md`.

5. **Result message**:
   ```
   CLAUDE.md 설치 완료

   경로: ~/.claude/CLAUDE.md

   이 파일은 모든 프로젝트에 적용되는 글로벌 지침입니다.
   프로젝트별 커스터마이징은 프로젝트 루트의 CLAUDE.md를 수정하세요.
   ```

---

### gemini action

First check Node.js installation:
```bash
node --version 2>/dev/null || echo "NOT_INSTALLED"
```

Then output:

```
gemini-cli 설치 가이드

gemini-cli는 Gemini 교차검증(/lk-plan-cross-review, /lk-code-review --dual)에 필요합니다.

## 설치 방법

### 방법 1: npm (권장)
npm install -g @google/gemini-cli

### 방법 2: 공식 문서
https://github.com/google-gemini/gemini-cli

## 설치 확인
gemini --version

## 인증 설정
gemini auth login

## Node.js가 없는 경우
```

If Node.js is missing, append:
```
Node.js가 설치되지 않았습니다. 먼저 Node.js를 설치하세요:

macOS: brew install node
또는: https://nodejs.org/
```

---

### serena action

Disable the serena plugin's web dashboard auto-open.

1. **Check config file**: run `test -f ~/.serena/serena_config.yml && echo "EXISTS" || echo "NOT_EXISTS"`.

2. **If file missing**: run `mkdir -p ~/.serena`, then Write `~/.serena/serena_config.yml`:
   ```yaml
   web_dashboard_open_on_launch: false
   ```

3. **If file exists**: check via Bash:
   ```bash
   grep 'web_dashboard_open_on_launch' ~/.serena/serena_config.yml 2>/dev/null || echo "NOT_FOUND"
   ```
   - If `true`: Edit to change `web_dashboard_open_on_launch: true` → `web_dashboard_open_on_launch: false`.
   - If `NOT_FOUND`: Edit to append `web_dashboard_open_on_launch: false` to the end of the file.
   - If already `false`: "이미 비활성화되어 있습니다."

4. **Result message**:
   ```
   serena 대시보드 자동 열기 비활성화 완료

   경로: ~/.serena/serena_config.yml
   설정: web_dashboard_open_on_launch: false
   ```

---

### plugins action

Inspect, toggle, and audit installed plugins and MCP servers. Sub-actions: `plugins list` (default) / `toggle` / `audit` / `install-docskills` / `mcp-list` / `mcp-toggle`.

**Common preflight**: Read `~/.claude/settings.json`. If missing, "~/.claude/settings.json이 존재하지 않습니다. Claude Code를 최소 1회 실행해 주세요." and abort.

---

#### plugins list (default)

1. Parse the `enabledPlugins` object in `settings.json`. Key format: `"<plugin-name>@<marketplace>": true|false`.
2. Parse each entry into `plugin-name` and `marketplace`.
3. Display as a table:

```
현재 설치된 플러그인 (~/.claude/settings.json)

| # | 플러그인 | 마켓플레이스 | 상태 |
|---|---------|--------------|------|
| 1 | leeloo-kit | leeloo-claude-setup | ✅ 활성 |
| 2 | leeloo-workflow | leeloo-claude-setup | ✅ 활성 |
| 3 | code-review | claude-plugins-official | ✅ 활성 |
| 4 | typescript-lsp | claude-plugins-official | ✅ 활성 |
| 5 | go-lsp | claude-plugins-official | ❌ 비활성 |
| ... | ... | ... | ... |

활성: N개 / 비활성: M개 / 총 N+M개

관련 명령:
- /lk-setup plugins toggle  — 대화형 on/off
- /lk-setup plugins audit   — 미사용 추정 플러그인 탐지
```

---

#### plugins toggle

1. Read the full `enabledPlugins` list from `settings.json`.
2. Build an AskUserQuestion as follows:
   - `header`: "플러그인 토글" (≤12 chars)
   - `question`: "활성화할 플러그인을 선택하세요. 선택하지 않은 플러그인은 비활성화됩니다."
   - `multiSelect`: `true`
   - `options`: one per plugin. `label` is `"<plugin name> [✅활성|❌비활성]"`, `description` is `"<marketplace>"`.
3. Receive user response (set of selected plugins).
4. Edit `enabledPlugins` in `settings.json`:
   - Selected → `true`
   - Unselected → `false` (keep keys, only flip values)
5. Show result table:

```
플러그인 토글 완료

| 플러그인 | 이전 | 이후 |
|---------|------|------|
| claude-api | ✅ | ❌ |
| go-lsp | ✅ | ❌ |
| code-review | ✅ | ✅ |

변경: 2개, 유지: N개

Claude Code 재시작 후 적용됩니다.
```

**Caveats**:
- AskUserQuestion `options` has an upper limit; for >20 entries, paginate (call twice) or first ask the user for a filter such as "show active only".
- If the user cancels the response, exit without changes.

---

#### plugins audit

Detect plugins that are likely **unused** in this repository among the currently active ones. Provide evidence from a Bash analysis but do NOT auto-disable (the user decides via `toggle`).

1. Extract entries with `enabledPlugins` value `true`.
2. For each plugin, classify "likely unused" by these rules:

| Plugin pattern | Likely-unused condition |
|---|---|
| `claude-api@*` or `claude-api` under `document-skills@*` | Bash `grep -r "@anthropic-ai/sdk" package.json 2>/dev/null` empty AND `grep -rE "^(import\|from) anthropic" --include="*.py" . 2>/dev/null | head -1` empty |
| `typescript-lsp@*` | `find . -name "*.ts" -o -name "*.tsx" 2>/dev/null | head -10 | wc -l` < 10 |
| `pyright-lsp@*` | `find . -name "*.py" 2>/dev/null | head -10 | wc -l` < 10 |
| `go-lsp@*` | `find . -name "*.go" 2>/dev/null | head -1` empty |
| `rust-lsp@*` | `test -f Cargo.toml || echo "missing"` = missing |
| `java-lsp@*` | `test -f pom.xml || test -f build.gradle || test -f build.gradle.kts || echo "missing"` = missing |
| `csharp-lsp@*` | `find . -name "*.cs" 2>/dev/null | head -1` empty |
| `swift-lsp@*` / `kotlin-lsp@*` / `elixir-lsp@*` / `c-lsp@*` / `php-lsp@*` / `lua-lsp@*` | corresponding language files absent |
| `claude-code-setup@*` / `claude-automation-recommender` | always likely unused (assume manual configuration completed) |
| Other LSPs | corresponding language files absent |

3. Present detected items in a table:

```
미사용 추정 플러그인 (현재 활성인 것 중)

| 플러그인 | 근거 |
|---------|------|
| claude-api@document-skills | @anthropic-ai/sdk 의존성 없음 / `anthropic` import 없음 |
| go-lsp@claude-plugins-official | *.go 파일 없음 |
| rust-lsp@claude-plugins-official | Cargo.toml 없음 |

→ 비활성화: /lk-setup plugins toggle (해당 항목 체크 해제)
```

If none are detected: "현재 활성 플러그인 중 미사용 추정 항목 없음."

---

#### plugins install-docskills

(Same as the legacy `plugins` action.) Register the anthropic-agent-skills marketplace + install the document-skills plugin.

1. **Marketplace registration check**: Bash:
   ```bash
   grep -q 'anthropic-agent-skills' ~/.claude/settings.json 2>/dev/null && echo "REGISTERED" || echo "NOT_REGISTERED"
   ```

2. **If marketplace not registered**: Read `~/.claude/settings.json`, then Edit to add the following entry to `extraKnownMarketplaces`:
   ```json
   "anthropic-agent-skills": {
     "source": {
       "source": "git",
       "url": "https://github.com/anthropics/skills.git"
     }
   }
   ```
   - Already registered: "anthropic-agent-skills 마켓플레이스가 이미 등록되어 있습니다."

3. **Document-skills plugin install check**: Bash:
   ```bash
   grep -q 'document-skills@anthropic-agent-skills' ~/.claude/settings.json 2>/dev/null && echo "INSTALLED" || echo "NOT_INSTALLED"
   ```

4. **If document-skills missing**: Edit to add to `enabledPlugins` in `~/.claude/settings.json`:
   ```json
   "document-skills@anthropic-agent-skills": true
   ```
   - Already installed: "document-skills 플러그인이 이미 설치되어 있습니다."

5. **Result message**:
   ```
   플러그인 설정 완료

   | 항목 | 상태 |
   |------|------|
   | anthropic-agent-skills 마켓플레이스 | ✅ 등록됨 |
   | document-skills 플러그인 | ✅ 설치됨 |

   Claude Code를 재시작하거나 /reload-plugins 로 적용하세요.
   ```

---

#### plugins mcp-list

1. Read `~/.claude/settings.json`.
2. Parse `mcpServers`. Determine status by `disabled` field (true/false/undefined): `disabled != true` → active.
3. Display as table:

```
현재 MCP 서버 (~/.claude/settings.json)

| # | 서버 | 상태 | 설명 |
|---|------|------|------|
| 1 | Context7 | ✅ 활성 | 라이브러리 문서 조회 |
| 2 | Google Drive | ❌ 비활성 | 드라이브 파일 접근 |
| 3 | Slack | ❌ 비활성 | 슬랙 메시지 |
| ... | ... | ... | ... |

활성: N개 / 비활성: M개

토글: /lk-setup plugins mcp-toggle
```

---

#### plugins mcp-toggle

Apply the same pattern as `plugins toggle` to MCP servers.

1. Read the full `mcpServers` list from `settings.json`.
2. Use AskUserQuestion (`multiSelect: true`) with current state in label:
   - `label`: `"<server> [✅활성|❌비활성]"`
   - `description`: server description or URL
3. After the user response, Edit each server's `disabled` field:
   - Selected → `disabled: false` or remove field
   - Unselected → `disabled: true`
4. Show result table.

**Caution**: do not remove MCP servers entirely. Toggle only the `disabled` field so re-enabling stays easy.

---

### model action

View and change the Claude Code default session model. Updates the `model` field in `~/.claude/settings.json` directly.

**Supported models:**

| Model ID | Name | Trait |
|----------|------|-------|
| `claude-opus-4-7` | Opus 4.7 | Top performance — Plan, complex reasoning, orchestration |
| `claude-sonnet-4-6` | Sonnet 4.6 | Balanced — default for general work |
| `claude-sonnet-4-6[1m]` | Sonnet 4.6 1M | Long context (large codebase, long documents) |
| `claude-haiku-4-5-20251001` | Haiku 4.5 | Fast — simple repetition, format conversion |

**Procedure:**

1. **Read current setting**: Read `~/.claude/settings.json`. Extract the `model` value (if missing, display `"설정 없음 (Claude Code 기본값 사용)"`).

2. **Model selection**: AskUserQuestion (single select):
   - `header`: "기본 모델 선택"
   - `question`: "Claude Code 세션에서 사용할 기본 모델을 선택하세요.\n현재: {current model value or '설정 없음'}"
   - `options` (each option includes `preview`):
     ```
     [
       {
         "label": "Opus 4.7  [최고 성능]",
         "description": "Plan·복잡한 추론·오케스트레이션",
         "preview": "모델: claude-opus-4-7\n컨텍스트: 200K tokens\n속도: 보통\n\n특성: 최고 성능 — 복잡한 추론·브레인스토밍\n       오케스트레이션·창의적 판단\n\n추천 작업:\n  /lk-plan, /lk-code-review --dual\n  복잡한 아키텍처 설계, 다단계 분석"
       },
       {
         "label": "Sonnet 4.6  [균형 ★기본 권장]",
         "description": "일반 작업 기본 권장",
         "preview": "모델: claude-sonnet-4-6\n컨텍스트: 200K tokens\n속도: 빠름\n\n특성: 균형 — 성능과 속도의 최적 조합\n       일반 개발 작업 전반에 권장\n\n추천 작업:\n  코드 작성·리뷰·디버깅, 일반 Q&A\n  /lk-commit, /lk-todo"
       },
       {
         "label": "Sonnet 4.6 1M  [긴 컨텍스트]",
         "description": "대형 코드베이스·긴 문서 작업",
         "preview": "모델: claude-sonnet-4-6[1m]\n컨텍스트: 1,000K tokens (1M)\n속도: 빠름\n\n특성: Sonnet 4.6 성능 + 초대형 컨텍스트\n       대규모 레포 전체 분석 가능\n\n추천 작업:\n  대규모 레포 분석, 긴 문서 처리\n  다수 파일 동시 비교·리팩터링"
       },
       {
         "label": "Haiku 4.5  [빠름]",
         "description": "단순 반복·포맷 변환 작업",
         "preview": "모델: claude-haiku-4-5-20251001\n컨텍스트: 200K tokens\n속도: 매우 빠름\n\n특성: 경량 고속 — 단순 작업 최적화\n       응답 속도 최우선 시 선택\n\n추천 작업:\n  간단한 포맷 변환, 짧은 질의\n  SubAgent 위임 작업 (lk-commit 등)"
       }
     ]
     ```
   - If the user cancels, exit without changes.

3. **Update settings.json**: Edit the `model` field in `~/.claude/settings.json` to the selected value.
   - If `model` exists: replace.
   - If `model` is absent: add at top level (e.g., before the `"env"` key).

4. **Result message**:
   ```
   기본 모델 변경 완료

   이전: {previous value or '설정 없음'}
   이후: {selected model ID}

   Claude Code를 재시작하면 적용됩니다.
   현재 세션 모델을 즉시 바꾸려면 /model 명령을 사용하세요.
   ```

---

### install action

Install missing items in batch. Skip already-installed items.
Proceeds **without user confirmation** (unlike per-item subcommands, no overwrite prompt).

1. **Status check**: query all items at once via Bash:
   ```bash
   echo "=== STATUS ==="
   echo "NODE=$(node --version 2>/dev/null || echo 'NOT_INSTALLED')"
   echo "GEMINI=$(command -v gemini 2>/dev/null && echo 'INSTALLED' || echo 'NOT_INSTALLED')"
   echo "STATUSLINE=$(test -f ~/.claude/statusline-leeloo.sh && echo 'INSTALLED' || echo 'NOT_INSTALLED')"
   echo "CLAUDEMD=$(test -f ~/.claude/CLAUDE.md && echo 'INSTALLED' || echo 'NOT_INSTALLED')"
   echo "SERENA=$(grep -q 'web_dashboard_open_on_launch: false' ~/.serena/serena_config.yml 2>/dev/null && echo 'CONFIGURED' || echo 'NOT_CONFIGURED')"
   echo "MARKETPLACE=$(grep -q 'anthropic-agent-skills' ~/.claude/settings.json 2>/dev/null && echo 'REGISTERED' || echo 'NOT_REGISTERED')"
   echo "DOCSKILLS=$(grep -q 'document-skills@anthropic-agent-skills' ~/.claude/settings.json 2>/dev/null && echo 'INSTALLED' || echo 'NOT_INSTALLED')"
   ```

2. **Install missing items sequentially**:

   **Step 0. Node.js** — if `NODE=NOT_INSTALLED`:
      - Detect OS, then auto-install:
        ```bash
        # OS detection
        if [[ "$(uname)" == "Darwin" ]]; then
          OS="macOS"
        elif [[ -f /etc/debian_version ]]; then
          OS="debian"
        elif [[ -f /etc/redhat-release ]]; then
          OS="rhel"
        else
          OS="unknown"
        fi
        ```
      - AskUserQuestion — "Node.js가 설치되지 않았습니다. 자동 설치할까요?"
        - Options: "자동 설치 (Recommended)" / "수동 설치"
      - On "자동 설치", run per OS:
        - **macOS**: `brew install node` (guide if brew missing)
        - **debian** (Ubuntu/Debian): `curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs`
        - **rhel** (RHEL/CentOS/Fedora): `curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash - && sudo dnf install -y nodejs`
        - **unknown**: nvm install guide — `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && source ~/.bashrc && nvm install 22`
      - Verify with `node --version`
      - On "수동 설치", just print install guide:
        ```
        Node.js 수동 설치 방법:
        - macOS: brew install node
        - Ubuntu/Debian: https://deb.nodesource.com/
        - 범용: https://nodejs.org/ 또는 nvm (https://github.com/nvm-sh/nvm)
        ```

   a. **statusline** — if `STATUSLINE=NOT_INSTALLED`:
      - Read `${CLAUDE_PLUGIN_ROOT}/resources/statusline-leeloo.sh`
      - Write to `~/.claude/statusline-leeloo.sh`
      - Bash `chmod +x ~/.claude/statusline-leeloo.sh`
      - Auto-register statusLine in settings.json (same as statusline action step 6)

   b. **CLAUDE.md** — if `CLAUDEMD=NOT_INSTALLED`:
      - Read `${CLAUDE_PLUGIN_ROOT}/resources/CLAUDE.md`
      - Write to `~/.claude/CLAUDE.md`

   c. **serena** — if `SERENA=NOT_CONFIGURED`:
      - Run the same procedure as the serena action (create or modify file)

   d. **plugins** — if `MARKETPLACE=NOT_REGISTERED` or `DOCSKILLS=NOT_INSTALLED`:
      - Run the same procedure as the plugins install-docskills action (marketplace registration + document-skills install)

   e. **gemini** — if `GEMINI=NOT_INSTALLED`:
      - If Node.js is installed, auto-install: `npm install -g @google/gemini-cli`
      - If not, only print install guide

3. **Result summary**: display as table:
   ```
   leeloo-kit 일괄 설치 완료

   | 항목 | 결과 |
   |------|------|
   | Node.js | ✅ 설치됨 (vXX) / ⏭️ 이미 설치됨 |
   | statusline-leeloo.sh | ✅ 설치됨 / ⏭️ 이미 설치됨 |
   | CLAUDE.md | ✅ 설치됨 / ⏭️ 이미 설치됨 |
   | serena 대시보드 | ✅ 비활성화 완료 / ⏭️ 이미 설정됨 |
   | anthropic-agent-skills | ✅ 등록됨 / ⏭️ 이미 등록됨 |
   | document-skills | ✅ 설치됨 / ⏭️ 이미 설치됨 |
   | gemini-cli | ✅ 자동 설치됨 / ⏭️ 이미 설치됨 |

   Claude Code를 재시작하면 모든 설정이 적용됩니다.
   ```

---

### reinstall action

Force-reinstall all items. **Overwrite existing files without confirmation.**

1. **User confirmation**: AskUserQuestion — "모든 leeloo-kit 설정 파일을 덮어쓰고 재설치합니다. 진행할까요?"
   - Options: "재설치" / "취소"
   - On "취소": abort.

2. **Full reinstall** (run unconditionally for each item):

   a. **statusline**:
      - Read `${CLAUDE_PLUGIN_ROOT}/resources/statusline-leeloo.sh`
      - Write to `~/.claude/statusline-leeloo.sh` (overwrite)
      - Bash `chmod +x ~/.claude/statusline-leeloo.sh`
      - Auto-register statusLine in settings.json (same as statusline action step 6)

   b. **CLAUDE.md**:
      - Read `${CLAUDE_PLUGIN_ROOT}/resources/CLAUDE.md`
      - Write to `~/.claude/CLAUDE.md` (overwrite)

   c. **serena**:
      - Run the serena action procedure (create or force-update value)

   d. **plugins**:
      - Run the plugins install-docskills action procedure (marketplace registration + document-skills install)

   e. **gemini**:
      - If gemini-cli missing, print install guide

3. **Result summary**:
   ```
   leeloo-kit 재설치 완료

   | 항목 | 결과 |
   |------|------|
   | statusline-leeloo.sh | 🔄 재설치됨 |
   | CLAUDE.md | 🔄 재설치됨 |
   | serena 대시보드 | 🔄 재설정됨 |
   | anthropic-agent-skills | ✅ 등록됨 |
   | document-skills | ✅ 설치됨 |
   | gemini-cli | ⚠️ 수동 설치 필요 / ✅ 이미 설치됨 |

   Claude Code를 재시작하면 모든 설정이 적용됩니다.
   ```
