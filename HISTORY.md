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
