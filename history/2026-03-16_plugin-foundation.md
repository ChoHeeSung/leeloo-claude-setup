# 2026-03-16 — 플러그인 기반 구조 설계

## Git 레포지토리 명 결정

**지시 요약**: Claude Code 초기 설정용 폴더의 Git 레포지토리 이름 추천 요청 (사내 폐쇄 용도, 회사명 leeloo/이루기술 반영)

**결과**: **`leeloo-claude-setup`** 으로 확정

**비유**: 새 사무실을 열 때 건물 간판 이름을 정하는 것과 같다.

---

## Git Remote 설정

**작업 내용**:
- `git remote add origin https://ChoHeesung@bitbucket.org/leeloocoltd/leeloo-claude-setup.git`

**결과**: origin remote 설정 완료

---

## 플러그인 구조 전환 (셸 스크립트 → Claude Code 플러그인)

**지시 요약**: 플러그인 설치 시 환경 설정이 즉각 실행되도록 Claude Code 플러그인 구조로 전환.

**작업 내용**:
1. `plugin.json` 생성 — `SessionStart` 훅으로 셋업 스크립트 자동 트리거
2. `resources/` 디렉토리 생성 — 설정 템플릿 분리
3. `setup-claude-code.sh` 재작성 — 마커 파일로 멱등성, jq로 settings.json 딥 머지

**핵심 코드**:
```json
// plugin.json — SessionStart 훅
{
  "hooks": {
    "SessionStart": [{"hooks": [{"type": "command", "command": "bash ${CLAUDE_PLUGIN_ROOT}/setup-claude-code.sh"}]}]
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

---

## Git Commit Skill 내장

**지시 요약**: 기존 `leeloo-flow` 마켓플레이스의 `/commit` 스킬을 플러그인에 내장

**결과**: 플러그인 설치만으로 `/commit` 스킬 사용 가능. 별도 마켓플레이스 인증 불필요.

---

## Gemini 교차검증 스킬 및 훅 추가

**지시 요약**: Claude plan mode에서 작성한 설계를 gemini-cli로 교차검증하는 기능 추가.

**작업 내용**:
1. `skills/cross-validate/SKILL.md` 신규 생성 — gemini-cli 실행 7단계 프로시저
2. `resources/gemini-review-prompt.md` — 시니어 아키텍트 역할 프롬프트
3. `plugin.json`에 `PostToolUse` 훅 추가 — plan mode 종료 시 자동 제안

**결과**: `/cross-validate` 스킬로 수동 교차검증 가능, plan mode 종료 시 자동 제안

---

## gemini-cli 자동 설치 추가

**작업 내용**: `setup-claude-code.sh`에 gemini-cli 자동 설치 단계 추가

```bash
if ! command -v gemini &> /dev/null; then
    if command -v npm &> /dev/null; then
        npm install -g @google/gemini-cli 2>/dev/null \
            || echo "gemini-cli 자동 설치 실패" >&2
    fi
fi
```

---

## 마켓플레이스 매니페스트 추가

**작업 내용**: `.claude-plugin/marketplace.json` 신규 생성 — anthropics/claude-plugins-official 형식 준수

---

## Linux 호환성 수정 — OS별 분기 처리

**발견된 문제점**: osascript(macOS 전용), brew 명령어 안내

**작업 내용**: `OS_TYPE="$(uname -s)"` OS 감지 → macOS/Linux 분기 처리

---

## 안전 설치 가이드 + 백업/언인스톨 + TODO 스킬

**작업 내용**:
1. SessionStart 훅: `type: "command"` → `type: "prompt"` (자동 실행 → 가이드 표시)
2. 백업 로직: `~/.claude/.leeloo-backup/` 자동 백업
3. 언인스톨 스크립트: `uninstall-claude-code.sh`
4. TODO 스킬: `skills/leeloo-todo/SKILL.md`

---

## 플러그인 구조 수정 — 훅 인식 + settings.json 파괴 버그 수정

**발견된 문제점**:
1. SessionStart 훅이 자동 실행되지 않음
2. `plugin.json`을 `.claude-plugin/`으로 이동하면 플러그인 로드 안 됨
3. sed로 알림 명령어 치환 시 특수문자가 settings.json을 파괴

**작업 내용**:
1. `hooks/hooks.json` 신규 생성 (훅 auto-discovery 구조)
2. `plugin.json` 위치: 루트에 유지 확정
3. sed → jq 안전 치환: `jq --arg`로 특수문자 자동 이스케이프

**핵심 코드**:
```bash
TEMPLATE_RESOLVED=$(echo "$TEMPLATE_RESOLVED" | jq \
    --arg stop_cmd "$NOTIFY_STOP" \
    --arg input_cmd "$NOTIFY_INPUT" \
    '.hooks = {
        "Stop": [{"hooks": [{"type": "command", "command": $stop_cmd}]}],
        "Notification": [{"hooks": [{"type": "command", "command": $input_cmd}]}]
    }')
```

**결과**: SessionStart 훅 자동 실행, settings.json 정상 생성, 상태바 적용 확인

**비유**: 집(플러그인)을 지을 때, 대문(plugin.json)은 반드시 정문(루트)에 있어야 택배(Claude Code)가 찾아올 수 있다.
