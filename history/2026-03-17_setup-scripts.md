# 2026-03-17 — 설치 스크립트 개선

## uv (uvx) 자동 설치 추가

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

**비유**: 새 사무실에 만능 공구함(uv)을 기본 비품으로 비치해 두는 것과 같다.

---

## 초기 설치를 SessionStart 훅 → /leeloo-setup 스킬로 전환

**지시 요약**: Linux에서 SessionStart `prompt` 타입 훅 에러 발생, `command` 타입으로 변경해도 출력이 UI에 표시되지 않는 문제 → 훅 대신 스킬로 전환

**작업 내용**:
1. `skills/leeloo-setup/SKILL.md` 신규 생성 — install/uninstall/status 서브커맨드
2. `hooks/hooks.json`에서 SessionStart 훅 제거 (PostToolUse만 유지)
3. README.md, CLAUDE.md 업데이트 — 설치 방법을 `/leeloo-setup`으로 변경

**결과**: 크로스 플랫폼 호환성 확보, 사용자가 `/leeloo-setup`으로 명시적 설치/제거/상태확인

---

## Sub Agent 생성 스킬 + Agent Team 생성 스킬 추가

**지시 요약**: 대화형으로 Sub Agent와 Agent Team을 구성할 수 있는 스킬 2종 추가

**작업 내용**:
1. **`/leeloo-agent` 스킬 생성** — create/list/show/delete + 5종 프리셋
2. **`/leeloo-team` 스킬 생성** — create/list/message/broadcast/shutdown + 4종 팀 프리셋
3. README.md, CLAUDE.md 업데이트

**핵심 설계**:
```
질문 1회 (역할/목적) → AI 추론 (설정 전체) → 프리뷰 확인 → 생성
```

**결과**: `/leeloo-agent`로 Sub Agent를, `/leeloo-team`으로 Agent Team을 대화형으로 생성·관리 가능

---

## Agent Team 설정 추가

**지시 요약**: 초기 설정 시 Claude Code agent-team 플래그도 함께 설정되도록 추가

**작업 내용**:
1. `resources/settings-template.json`에 agent-team 관련 설정 추가
   - `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`: `"1"` (실험 기능 활성화)
   - `teammateMode`: `"auto"`
2. `README.md`에 Agent Team 설정 섹션 추가

**결과**: 플러그인 설치 후 설정 스크립트 실행 시 agent-team 기능이 자동 활성화됨
