---
name: leeloo-setup
description: "Leeloo 사내 표준 Claude Code 환경을 설치/제거/상태확인합니다. /leeloo-setup [install|uninstall|status]"
user_invocable: true
argument-hint: "[install|uninstall|status]"
---

# /leeloo-setup — 사내 표준 환경 설정

Leeloo(이루기술) 사내 표준 Claude Code 환경을 설치, 제거, 상태 확인합니다.

## 서브커맨드

```
/leeloo-setup              — 설치 (기본 동작 = install)
/leeloo-setup install      — 사내 표준 환경 설치
/leeloo-setup uninstall    — 설치된 환경 제거 (백업 복원)
/leeloo-setup status       — 현재 설치 상태 확인
```

## Procedure

### 인자 파싱

사용자 입력에서 서브커맨드를 파싱합니다:
- 인자 없음 또는 `install` → **install** 동작
- `uninstall` → **uninstall** 동작
- `status` → **status** 동작

---

### install 동작

1. **사전 확인**: Bash로 마커 파일 확인
   ```bash
   cat ~/.claude/.leeloo-setup-done 2>/dev/null
   ```
   - 파일이 존재하면: "이미 설치되어 있습니다. 재설치하려면 먼저 `/leeloo-setup uninstall`을 실행하세요." 안내 후 종료.

2. **설치 안내**: 사용자에게 설치 내용을 미리 안내합니다:
   ```
   📋 설치 항목:
   - settings.json — 훅, 상태바, 플러그인, 마켓플레이스 (기존 설정에 딥 머지)
   - settings.local.json — 로컬 권한 설정 (없을 때만 생성)
   - statusline-leeloo.sh — Powerline 스타일 상태바
   - CLAUDE.md — 사내 표준 글로벌 CLAUDE.md (없을 때만 생성)
   - gemini-cli — Gemini 교차검증용 CLI (없을 때만 설치)

   ⚠️ 기존 파일은 ~/.claude/.leeloo-backup/에 자동 백업됩니다.
   ```

3. **확인**: AskUserQuestion — "설치를 진행할까요? (설치/취소)"

4. **설치 실행**: "설치" 선택 시 Bash로 설정 스크립트 실행:
   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/setup-claude-code.sh
   ```

5. **결과 출력**:
   - 성공 시: "✅ 사내 표준 환경 설치 완료. Claude Code를 재시작하면 모든 설정이 적용됩니다."
   - 실패 시: 에러 메시지 표시 + 수동 설치 안내

---

### uninstall 동작

1. **사전 확인**: Bash로 마커 파일 확인
   ```bash
   cat ~/.claude/.leeloo-setup-done 2>/dev/null
   ```
   - 파일이 없으면: "설치된 환경이 없습니다." 안내 후 종료.

2. **확인**: AskUserQuestion — "설치된 환경을 제거하고 백업에서 복원할까요? (제거/취소)"

3. **제거 실행**: "제거" 선택 시 Bash로 언인스톨 스크립트 실행:
   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/uninstall-claude-code.sh
   ```

4. **결과 출력**:
   - 성공 시: "🗑️ 환경 제거 완료. 백업에서 원래 설정이 복원되었습니다."
   - 실패 시: 에러 메시지 표시

---

### status 동작

1. Bash로 다음 항목을 확인합니다:
   ```bash
   # 마커 파일
   cat ~/.claude/.leeloo-setup-done 2>/dev/null || echo "NOT_INSTALLED"

   # 각 파일 존재 여부
   ls -la ~/.claude/settings.json ~/.claude/settings.local.json ~/.claude/statusline-leeloo.sh ~/.claude/CLAUDE.md 2>/dev/null

   # 백업 존재 여부
   ls ~/.claude/.leeloo-backup/ 2>/dev/null

   # gemini-cli 설치 여부
   command -v gemini 2>/dev/null || echo "gemini: NOT_INSTALLED"

   # jq 설치 여부
   command -v jq 2>/dev/null || echo "jq: NOT_INSTALLED"
   ```

2. 결과를 테이블로 표시합니다:
   ```
   📊 Leeloo Setup 상태

   설치 상태: ✅ 설치됨 (2026-03-17T09:17:00Z)  또는  ❌ 미설치

   | 항목 | 상태 |
   |------|------|
   | settings.json | ✅ 존재 |
   | settings.local.json | ✅ 존재 |
   | statusline-leeloo.sh | ✅ 존재 |
   | CLAUDE.md | ✅ 존재 |
   | gemini-cli | ✅ 설치됨 / ❌ 미설치 |
   | jq | ✅ 설치됨 / ❌ 미설치 |
   | 백업 | ✅ 있음 / ❌ 없음 |
   ```
