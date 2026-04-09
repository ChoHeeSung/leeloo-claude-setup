---
name: lk-setup
description: "선택적 환경 강화 도구. /lk-setup [status|install|reinstall|statusline|claude-md|gemini|serena|plugins]"
user_invocable: true
argument-hint: "[status|install|reinstall|statusline|claude-md|gemini|serena|plugins]"
---

# /lk-setup — 선택적 환경 강화

leeloo-kit 환경의 개별 구성 요소를 선택적으로 설치하거나 상태를 확인합니다.
셸 스크립트 없이 SKILL.md Procedure에서 직접 도구를 호출하여 처리합니다.

## 서브커맨드

```
/lk-setup            — 현재 환경 상태 표시 (기본 동작 = status)
/lk-setup status     — 현재 환경 상태 표시
/lk-setup install    — 미설치 항목 일괄 설치 (이미 설치된 항목은 건너뜀)
/lk-setup reinstall  — 전체 재설치 (기존 설정 덮어쓰기)
/lk-setup statusline — statusline-leeloo.sh를 ~/.claude/에 복사
/lk-setup claude-md  — CLAUDE.md를 ~/.claude/CLAUDE.md에 설치
/lk-setup gemini     — gemini-cli 설치 가이드 표시
/lk-setup serena     — serena 플러그인 대시보드 자동 열기 비활성화
/lk-setup plugins    — 권장 마켓플레이스 등록 + document-skills 플러그인 설치
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
- `plugins` → **plugins** 동작

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

6. **설정 안내**:
   ```
   statusline-leeloo.sh 설치 완료

   경로: ~/.claude/statusline-leeloo.sh

   Claude Code에서 활성화하려면:
   ~/.claude/settings.json의 statusLine 항목에 다음을 추가하세요:

   "statusLine": "~/.claude/statusline-leeloo.sh"

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

anthropic-agent-skills 마켓플레이스를 등록하고 document-skills 플러그인을 설치합니다.

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
