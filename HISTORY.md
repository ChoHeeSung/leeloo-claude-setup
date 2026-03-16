# HISTORY.md

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
