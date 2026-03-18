---
name: lk-setup
description: "선택적 환경 강화 도구. /lk-setup [status|statusline|claude-md|gemini]"
user_invocable: true
argument-hint: "[status|statusline|claude-md|gemini]"
---

# /lk-setup — 선택적 환경 강화

leeloo-kit 환경의 개별 구성 요소를 선택적으로 설치하거나 상태를 확인합니다.
셸 스크립트 없이 SKILL.md Procedure에서 직접 도구를 호출하여 처리합니다.

## 서브커맨드

```
/lk-setup            — 현재 환경 상태 표시 (기본 동작 = status)
/lk-setup status     — 현재 환경 상태 표시
/lk-setup statusline — statusline-leeloo.sh를 ~/.claude/에 복사
/lk-setup claude-md  — CLAUDE.md를 ~/.claude/CLAUDE.md에 설치
/lk-setup gemini     — gemini-cli 설치 가이드 표시
```

## Procedure

### 인자 파싱

사용자 입력에서 서브커맨드를 파싱합니다:
- 인자 없음 또는 `status` → **status** 동작
- `statusline` → **statusline** 동작
- `claude-md` → **claude-md** 동작
- `gemini` → **gemini** 동작

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

gemini-cli는 Gemini 교차검증(/lk-cross-validate, /lk-review)에 필요합니다.

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
