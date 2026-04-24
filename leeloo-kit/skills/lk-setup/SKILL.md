---
name: lk-setup
description: "환경 강화 도구(설치·statusline·플러그인 토글·기본 모델 설정)"
user_invocable: true
argument-hint: "[status|install|reinstall|statusline|claude-md|gemini|serena|plugins|model]"
---

# /lk-setup — 선택적 환경 강화

leeloo-kit 환경의 개별 구성 요소를 선택적으로 설치하거나 상태를 확인합니다.
셸 스크립트 없이 SKILL.md Procedure에서 직접 도구를 호출하여 처리합니다.

## 서브커맨드

```
/lk-setup                         — 현재 환경 상태 표시 (기본 동작 = status)
/lk-setup status                  — 현재 환경 상태 표시
/lk-setup install                 — 미설치 항목 일괄 설치 (이미 설치된 항목은 건너뜀)
/lk-setup reinstall               — 전체 재설치 (기존 설정 덮어쓰기)
/lk-setup statusline              — statusline-leeloo.sh를 ~/.claude/에 복사
/lk-setup claude-md               — CLAUDE.md를 ~/.claude/CLAUDE.md에 설치
/lk-setup gemini                  — gemini-cli 설치 가이드 표시
/lk-setup serena                  — serena 플러그인 대시보드 자동 열기 비활성화
/lk-setup plugins                 — 설치된 플러그인 목록 + 상태 (기본 동작 = list)
/lk-setup plugins list            — 설치된 플러그인 목록 + 상태
/lk-setup plugins toggle          — 플러그인 대화형 on/off
/lk-setup plugins audit           — 미사용 추정 플러그인 탐지 (레포 분석)
/lk-setup plugins install-docskills — document-skills + anthropic-agent-skills 마켓플레이스 등록
/lk-setup plugins mcp-list        — MCP 서버 목록 + 상태
/lk-setup plugins mcp-toggle      — MCP 서버 대화형 on/off
/lk-setup model                   — 기본 세션 모델 조회 및 변경
```

## Procedure

### 인자 파싱

사용자 입력에서 서브커맨드를 파싱합니다:
- 인자 없음 또는 `status` → **status** 동작
- `install` → **install** 동작
- `reinstall` → **reinstall** 동작
- `statusline` → **statusline** 동작
- `claude-md` → **claude-md** 동작
- `gemini` → **gemini** 동작
- `serena` → **serena** 동작
- `plugins` 단독 또는 `plugins list` → **plugins list** 동작
- `plugins toggle` → **plugins toggle** 동작
- `plugins audit` → **plugins audit** 동작
- `plugins install-docskills` → **plugins install-docskills** 동작 (기존 `plugins` 동작)
- `plugins mcp-list` → **plugins mcp-list** 동작
- `plugins mcp-toggle` → **plugins mcp-toggle** 동작
- `model` → **model** 동작

---

### status 동작

Bash로 다음 항목들을 확인합니다:

```bash
# Node.js 버전
node --version 2>/dev/null || echo "NOT_INSTALLED"

# gemini-cli 설치 여부
command -v gemini 2>/dev/null || echo "NOT_INSTALLED"

# statusline 존재 여부
test -f ~/.claude/statusline-leeloo.sh && echo "INSTALLED" || echo "NOT_INSTALLED"

# CLAUDE.md 존재 여부
test -f ~/.claude/CLAUDE.md && echo "INSTALLED" || echo "NOT_INSTALLED"

# jq 설치 여부
command -v jq 2>/dev/null || echo "NOT_INSTALLED"

# serena 대시보드 자동 열기 설정 확인
grep -q 'web_dashboard_open_on_launch: false' ~/.serena/serena_config.yml 2>/dev/null && echo "CONFIGURED" || echo "NOT_CONFIGURED"

# anthropic-agent-skills 마켓플레이스 등록 여부
grep -q 'anthropic-agent-skills' ~/.claude/settings.json 2>/dev/null && echo "REGISTERED" || echo "NOT_REGISTERED"

# document-skills 플러그인 설치 여부
grep -q 'document-skills@anthropic-agent-skills' ~/.claude/settings.json 2>/dev/null && echo "INSTALLED" || echo "NOT_INSTALLED"

# 기본 모델 설정
python3 -c "import json; d=json.load(open(os.path.expanduser('~/.claude/settings.json'))); print(d.get('model','NOT_SET'))" 2>/dev/null || grep -o '"model"[[:space:]]*:[[:space:]]*"[^"]*"' ~/.claude/settings.json 2>/dev/null | head -1 | sed 's/.*: *"\(.*\)"/\1/' || echo "NOT_SET"
```

결과를 테이블로 표시합니다:

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

### statusline 동작

1. **소스 파일 확인**: Bash로 다음 명령 실행:
   ```bash
   test -f "${CLAUDE_PLUGIN_ROOT}/resources/statusline-leeloo.sh" && echo "EXISTS" || echo "NOT_FOUND"
   ```
   - NOT_FOUND이면: "statusline-leeloo.sh 소스 파일을 찾을 수 없습니다." 안내 후 중단.

2. **소스 파일 읽기**: Read 도구로 `${CLAUDE_PLUGIN_ROOT}/resources/statusline-leeloo.sh` 읽기.

3. **대상 경로 확인**: Bash로 `test -f ~/.claude/statusline-leeloo.sh && echo "EXISTS" || echo "NOT_EXISTS"` 실행.
   - 이미 존재하면 AskUserQuestion — "~/.claude/statusline-leeloo.sh가 이미 존재합니다. 덮어쓸까요? (덮어쓰기/취소)"
   - "취소" 선택 시 중단.

4. **파일 복사**: Write 도구로 `~/.claude/statusline-leeloo.sh`에 소스 파일 내용 저장.

5. **실행 권한 부여**: Bash로 `chmod +x ~/.claude/statusline-leeloo.sh` 실행.

6. **settings.json에 statusLine 등록**: Read 도구로 `~/.claude/settings.json` 읽은 후:
   - `statusLine` 필드가 이미 `statusline-leeloo.sh`를 포함하면: 건너뜀.
   - `statusLine` 필드가 없거나 다른 값이면: Edit 도구로 `statusLine` 필드를 다음으로 설정:
     ```json
     "statusLine": {
       "type": "command",
       "command": "bash ~/.claude/statusline-leeloo.sh"
     }
     ```
   - `statusLine` 필드가 아예 없으면: `"hooks": {}` 또는 다른 최상위 키 뒤에 추가.

7. **결과 안내**:
   ```
   statusline-leeloo.sh 설치 완료

   경로: ~/.claude/statusline-leeloo.sh
   설정: ~/.claude/settings.json → statusLine 자동 등록됨

   Claude Code를 재시작하면 적용됩니다.
   ```

---

### claude-md 동작

1. **대상 파일 확인**: Bash로 `test -f ~/.claude/CLAUDE.md && echo "EXISTS" || echo "NOT_EXISTS"` 실행.

2. **이미 존재하는 경우**: AskUserQuestion — "~/.claude/CLAUDE.md가 이미 존재합니다. 어떻게 처리할까요? (덮어쓰기/취소)"
   - "취소" 선택 시 중단.

3. **소스 파일 읽기**: Read 도구로 `${CLAUDE_PLUGIN_ROOT}/resources/CLAUDE.md` 읽기.

4. **파일 설치**: Write 도구로 `~/.claude/CLAUDE.md`에 소스 파일 내용 저장.

5. **결과 안내**:
   ```
   CLAUDE.md 설치 완료

   경로: ~/.claude/CLAUDE.md

   이 파일은 모든 프로젝트에 적용되는 글로벌 지침입니다.
   프로젝트별 커스터마이징은 프로젝트 루트의 CLAUDE.md를 수정하세요.
   ```

---

### gemini 동작

Node.js 설치 여부 먼저 확인:
```bash
node --version 2>/dev/null || echo "NOT_INSTALLED"
```

다음 내용을 출력합니다:

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

Node.js가 설치되지 않은 경우 추가 안내:
```
Node.js가 설치되지 않았습니다. 먼저 Node.js를 설치하세요:

macOS: brew install node
또는: https://nodejs.org/
```

---

### serena 동작

serena 플러그인의 웹 대시보드 자동 열기를 비활성화합니다.

1. **설정 파일 확인**: Bash로 `test -f ~/.serena/serena_config.yml && echo "EXISTS" || echo "NOT_EXISTS"` 실행.

2. **파일이 없는 경우**: Bash로 `mkdir -p ~/.serena` 후 Write 도구로 `~/.serena/serena_config.yml` 생성:
   ```yaml
   web_dashboard_open_on_launch: false
   ```

3. **파일이 있는 경우**: Bash로 현재 설정 확인:
   ```bash
   grep 'web_dashboard_open_on_launch' ~/.serena/serena_config.yml 2>/dev/null || echo "NOT_FOUND"
   ```
   - `true`인 경우: Edit 도구로 `web_dashboard_open_on_launch: true` → `web_dashboard_open_on_launch: false` 변경.
   - `NOT_FOUND`인 경우: Edit 도구로 파일 끝에 `web_dashboard_open_on_launch: false` 추가.
   - 이미 `false`인 경우: "이미 비활성화되어 있습니다." 안내.

4. **결과 안내**:
   ```
   serena 대시보드 자동 열기 비활성화 완료

   경로: ~/.serena/serena_config.yml
   설정: web_dashboard_open_on_launch: false
   ```

---

### plugins 동작

설치된 플러그인과 MCP 서버를 조회·토글·감사합니다. 서브 동작은 `plugins list`(기본) / `toggle` / `audit` / `install-docskills` / `mcp-list` / `mcp-toggle`.

**공통 사전 작업**: Read 도구로 `~/.claude/settings.json`을 읽습니다. 파일이 없으면 "~/.claude/settings.json이 존재하지 않습니다. Claude Code를 최소 1회 실행해 주세요." 안내 후 중단.

---

#### plugins list (기본)

1. `settings.json`의 `enabledPlugins` 객체를 파싱합니다. 키 형식: `"<plugin-name>@<marketplace>": true|false`.
2. 각 항목을 파싱하여 `plugin-name`과 `marketplace`를 분리.
3. 결과를 테이블로 표시:

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

1. `settings.json`의 `enabledPlugins` 전체 목록을 Read로 읽습니다.
2. AskUserQuestion 도구로 다음 형식의 질문을 구성합니다:
   - `header`: "플러그인 토글" (12자 이내)
   - `question`: "활성화할 플러그인을 선택하세요. 선택하지 않은 플러그인은 비활성화됩니다."
   - `multiSelect`: `true`
   - `options`: 각 플러그인마다 하나의 옵션. `label`은 `"플러그인명 [✅활성|❌비활성]"`, `description`은 `"<marketplace>"`.
3. 사용자 응답(선택된 플러그인 집합) 수신.
4. Edit 도구로 `settings.json`의 `enabledPlugins` 객체를 업데이트:
   - 선택된 플러그인 → `true`
   - 선택되지 않은 플러그인 → `false` (키는 유지, 값만 변경)
5. 변경 결과 테이블 표시:

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

**주의**:
- AskUserQuestion의 `options` 상한이 있으므로, 20개 초과 시 페이지를 나눠서 두 번 호출하거나 "활성화된 것만 표시" 등 필터 옵션을 사용자에게 먼저 물어보세요.
- 사용자가 응답을 취소하면 변경 없이 종료.

---

#### plugins audit

현재 활성 플러그인 중 이 레포에서 **사용 가능성이 낮은** 플러그인을 탐지합니다. Bash로 레포를 분석한 결과를 근거로 제시하되, 자동으로 비활성화하지 않습니다 (사용자가 `toggle`로 직접 결정).

1. `enabledPlugins`의 `true` 항목 목록을 추출.
2. 각 플러그인에 대해 아래 규칙으로 "미사용 추정 여부"를 판단:

| 플러그인 패턴 | 미사용 추정 조건 |
|---|---|
| `claude-api@*` 또는 `document-skills@*`의 `claude-api` | Bash `grep -r "@anthropic-ai/sdk" package.json 2>/dev/null` 결과 없음 + `grep -rE "^(import\|from) anthropic" --include="*.py" . 2>/dev/null | head -1` 결과 없음 |
| `typescript-lsp@*` | `find . -name "*.ts" -o -name "*.tsx" 2>/dev/null | head -10 | wc -l` 결과 < 10 |
| `pyright-lsp@*` | `find . -name "*.py" 2>/dev/null | head -10 | wc -l` 결과 < 10 |
| `go-lsp@*` | `find . -name "*.go" 2>/dev/null | head -1` 결과 없음 |
| `rust-lsp@*` | `test -f Cargo.toml || echo "missing"` = missing |
| `java-lsp@*` | `test -f pom.xml || test -f build.gradle || test -f build.gradle.kts || echo "missing"` = missing |
| `csharp-lsp@*` | `find . -name "*.cs" 2>/dev/null | head -1` 결과 없음 |
| `swift-lsp@*` / `kotlin-lsp@*` / `elixir-lsp@*` / `c-lsp@*` / `php-lsp@*` / `lua-lsp@*` | 해당 언어 파일 없음 |
| `claude-code-setup@*` / `claude-automation-recommender` | 항상 미사용 추정 (수동 구성 완료 가정) |
| 기타 LSP | 언어별 대응 파일 없음 |

3. 탐지된 항목을 테이블로 제시:

```
미사용 추정 플러그인 (현재 활성인 것 중)

| 플러그인 | 근거 |
|---------|------|
| claude-api@document-skills | @anthropic-ai/sdk 의존성 없음 / `anthropic` import 없음 |
| go-lsp@claude-plugins-official | *.go 파일 없음 |
| rust-lsp@claude-plugins-official | Cargo.toml 없음 |

→ 비활성화: /lk-setup plugins toggle (해당 항목 체크 해제)
```

미사용 추정 플러그인이 없으면: "현재 활성 플러그인 중 미사용 추정 항목 없음." 안내.

---

#### plugins install-docskills

(기존 `plugins` 동작과 동일) anthropic-agent-skills 마켓플레이스 등록 + document-skills 플러그인 설치.

1. **마켓플레이스 등록 확인**: Bash로 확인:
   ```bash
   grep -q 'anthropic-agent-skills' ~/.claude/settings.json 2>/dev/null && echo "REGISTERED" || echo "NOT_REGISTERED"
   ```

2. **마켓플레이스 미등록 시**: Read 도구로 `~/.claude/settings.json` 읽은 후, Edit 도구로 `extraKnownMarketplaces` 객체에 다음 항목 추가:
   ```json
   "anthropic-agent-skills": {
     "source": {
       "source": "git",
       "url": "https://github.com/anthropics/skills.git"
     }
   }
   ```
   - 이미 등록됨이면: "anthropic-agent-skills 마켓플레이스가 이미 등록되어 있습니다." 안내.

3. **document-skills 플러그인 설치 확인**: Bash로 확인:
   ```bash
   grep -q 'document-skills@anthropic-agent-skills' ~/.claude/settings.json 2>/dev/null && echo "INSTALLED" || echo "NOT_INSTALLED"
   ```

4. **document-skills 미설치 시**: Edit 도구로 `~/.claude/settings.json`의 `enabledPlugins` 객체에 다음 추가:
   ```json
   "document-skills@anthropic-agent-skills": true
   ```
   - 이미 설치됨이면: "document-skills 플러그인이 이미 설치되어 있습니다." 안내.

5. **결과 안내**:
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

1. Read 도구로 `~/.claude/settings.json` 읽기.
2. `mcpServers` 객체 파싱. 각 서버의 `disabled` 필드(true/false/undefined) 기준으로 상태 판정 (`disabled != true` → 활성).
3. 테이블로 표시:

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

`plugins toggle`과 동일한 패턴을 MCP 서버에 적용합니다.

1. `settings.json`의 `mcpServers` 전체 목록을 Read로 읽습니다.
2. AskUserQuestion 도구 (`multiSelect: true`)로 현재 상태를 라벨에 표시한 옵션을 제공:
   - `label`: `"<server> [✅활성|❌비활성]"`
   - `description`: 서버 설명 또는 URL
3. 사용자 응답 수신 후 Edit 도구로 각 서버의 `disabled` 필드를 갱신:
   - 선택됨 → `disabled: false` 또는 필드 제거
   - 선택되지 않음 → `disabled: true`
4. 변경 결과 테이블 표시.

**주의**: MCP 서버 전체를 제거하지 말 것. `disabled` 필드만 토글하여 재활성화가 쉽도록 유지.

---

### model 동작

Claude Code 기본 세션 모델을 조회하고 변경합니다. `~/.claude/settings.json`의 `model` 필드를 직접 업데이트합니다.

**지원 모델 목록:**

| 모델 ID | 이름 | 특성 |
|---------|------|------|
| `claude-opus-4-7` | Opus 4.7 | 최고 성능 — Plan·복잡한 추론·오케스트레이션 |
| `claude-sonnet-4-6` | Sonnet 4.6 | 균형 — 일반 작업 기본 권장 |
| `claude-sonnet-4-6[1m]` | Sonnet 4.6 1M | 긴 컨텍스트 필요 시 (대형 코드베이스·긴 문서) |
| `claude-haiku-4-5-20251001` | Haiku 4.5 | 빠름 — 단순 반복·포맷 변환 작업 |

**절차:**

1. **현재 설정 확인**: Read 도구로 `~/.claude/settings.json` 읽기. `model` 필드 값을 추출 (없으면 `"설정 없음 (Claude Code 기본값 사용)"` 표시).

2. **모델 선택**: AskUserQuestion 도구로 단일 선택:
   - `header`: "기본 모델 선택"
   - `question`: "Claude Code 세션에서 사용할 기본 모델을 선택하세요.\n현재: {현재 model 값 또는 '설정 없음'}"
   - `options`:
     ```
     [
       { "label": "Opus 4.7  [최고 성능]", "value": "claude-opus-4-7", "description": "Plan·복잡한 추론·오케스트레이션" },
       { "label": "Sonnet 4.6  [균형 ★기본 권장]", "value": "claude-sonnet-4-6", "description": "일반 작업 기본 권장" },
       { "label": "Sonnet 4.6 1M  [긴 컨텍스트]", "value": "claude-sonnet-4-6[1m]", "description": "대형 코드베이스·긴 문서 작업" },
       { "label": "Haiku 4.5  [빠름]", "value": "claude-haiku-4-5-20251001", "description": "단순 반복·포맷 변환 작업" }
     ]
     ```
   - 사용자가 취소하면 변경 없이 종료.

3. **settings.json 업데이트**: Edit 도구로 `~/.claude/settings.json`의 `model` 필드를 선택된 값으로 변경.
   - `model` 필드가 이미 존재하면: 기존 값을 선택된 값으로 교체.
   - `model` 필드가 없으면: 최상위 레벨에 추가 (예: `"env"` 키 앞).

4. **결과 안내**:
   ```
   기본 모델 변경 완료

   이전: {이전 값 또는 '설정 없음'}
   이후: {선택된 모델 ID}

   Claude Code를 재시작하면 적용됩니다.
   현재 세션 모델을 즉시 바꾸려면 /model 명령을 사용하세요.
   ```

---

### install 동작

미설치 항목을 일괄 설치합니다. 이미 설치된 항목은 건너뜁니다.
**사용자 확인 없이** 자동으로 진행합니다 (개별 서브커맨드와 달리 덮어쓰기 확인을 하지 않음).

1. **상태 확인**: Bash로 모든 항목 상태를 한 번에 확인:
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

2. **미설치 항목만 순차 설치** (각 항목에 대해):

   **0단계. Node.js** — `NODE=NOT_INSTALLED`이면:
      - OS 감지 후 자동 설치:
        ```bash
        # OS 감지
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
      - "자동 설치" 선택 시 OS별 실행:
        - **macOS**: `brew install node` (brew 없으면 안내)
        - **debian** (Ubuntu/Debian): `curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs`
        - **rhel** (RHEL/CentOS/Fedora): `curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash - && sudo dnf install -y nodejs`
        - **unknown**: nvm 설치 안내 — `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && source ~/.bashrc && nvm install 22`
      - 설치 후 `node --version`으로 확인
      - "수동 설치" 선택 시: 설치 가이드 텍스트만 표시
        ```
        Node.js 수동 설치 방법:
        - macOS: brew install node
        - Ubuntu/Debian: https://deb.nodesource.com/
        - 범용: https://nodejs.org/ 또는 nvm (https://github.com/nvm-sh/nvm)
        ```

   a. **statusline** — `STATUSLINE=NOT_INSTALLED`이면:
      - Read 도구로 `${CLAUDE_PLUGIN_ROOT}/resources/statusline-leeloo.sh` 읽기
      - Write 도구로 `~/.claude/statusline-leeloo.sh`에 저장
      - Bash로 `chmod +x ~/.claude/statusline-leeloo.sh`
      - settings.json에 statusLine 자동 등록 (statusline 동작 6단계와 동일)

   b. **CLAUDE.md** — `CLAUDEMD=NOT_INSTALLED`이면:
      - Read 도구로 `${CLAUDE_PLUGIN_ROOT}/resources/CLAUDE.md` 읽기
      - Write 도구로 `~/.claude/CLAUDE.md`에 저장

   c. **serena** — `SERENA=NOT_CONFIGURED`이면:
      - serena 동작과 동일한 절차 수행 (파일 생성 또는 수정)

   d. **plugins** — `MARKETPLACE=NOT_REGISTERED` 또는 `DOCSKILLS=NOT_INSTALLED`이면:
      - plugins 동작과 동일한 절차 수행 (마켓플레이스 등록 + document-skills 설치)

   e. **gemini** — `GEMINI=NOT_INSTALLED`이면:
      - Node.js가 설치되어 있으면 자동 설치: `npm install -g @google/gemini-cli`
      - Node.js가 없으면 설치 가이드만 표시

3. **결과 요약**: 설치 결과를 테이블로 표시:
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

### reinstall 동작

모든 항목을 강제로 재설치합니다. 기존 파일을 **확인 없이 덮어씁니다**.

1. **사용자 확인**: AskUserQuestion — "모든 leeloo-kit 설정 파일을 덮어쓰고 재설치합니다. 진행할까요?"
   - Options: "재설치" / "취소"
   - "취소" 선택 시 중단.

2. **전체 재설치** (각 항목에 대해 무조건 실행):

   a. **statusline**:
      - Read 도구로 `${CLAUDE_PLUGIN_ROOT}/resources/statusline-leeloo.sh` 읽기
      - Write 도구로 `~/.claude/statusline-leeloo.sh`에 저장 (덮어쓰기)
      - Bash로 `chmod +x ~/.claude/statusline-leeloo.sh`
      - settings.json에 statusLine 자동 등록 (statusline 동작 6단계와 동일)

   b. **CLAUDE.md**:
      - Read 도구로 `${CLAUDE_PLUGIN_ROOT}/resources/CLAUDE.md` 읽기
      - Write 도구로 `~/.claude/CLAUDE.md`에 저장 (덮어쓰기)

   c. **serena**:
      - serena 동작과 동일한 절차 수행 (파일 생성 또는 값 강제 변경)

   d. **plugins**:
      - plugins 동작과 동일한 절차 수행 (마켓플레이스 등록 + document-skills 설치)

   e. **gemini**:
      - gemini-cli 미설치 시 설치 가이드 표시

3. **결과 요약**: 재설치 결과를 테이블로 표시:
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
