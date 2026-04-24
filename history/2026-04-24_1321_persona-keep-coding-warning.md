# lk-persona 상세 모드 `keep-coding-instructions` 경고 추가 — v3.5.11

## 지시 요약
사용자 요청: output-style 기반 페르소나 설계에 대한 외부 조사 결과를 검토한 결과, 유일하게 정당한 개선 지점은 "상세 모드에서 `keep-coding-instructions: false` 선택 시 Claude Code SWE 가드가 비활성화된다는 경고"를 사용자에게 명시하는 것. 해당 경고 문구만 추가하고 버전 범프 + HISTORY 기록 후 푸시.

## 배경 — 왜 필요했나
lk-persona 설계 자체는 방어 가능한 구조다. `.claude/output-styles/<name>.md` + `settings.local.json`의 outputStyle 기록으로 Claude Code 공식 Output Style 체계를 그대로 활용하며, `keep-coding-instructions: true`를 기본값으로 둬서 SWE 기능을 병행한다. v3.5.10에서는 system/user 턴 중복 적재를 피하기 위해 본문 슬림화 + 요약만 inject하도록 바꿨다.

그러나 상세 모드(`--detail`)에서 사용자가 7번째 질문("`keep-coding-instructions` 유지 여부")에서 **제거**를 선택하면, 시스템 프롬프트 수준의 엔지니어링 가드가 실제로 꺼진다. 기존 SKILL.md는 "제거는 순수 롤플레이·논픽션 대화용" 한 줄로만 설명해, 어떤 기능이 꺼지는지 구체적으로 알 수 없었다. 코드 세션에서 무심코 false를 선택하면 테스트 검증·스파게티 방지·보안 점검 같은 가드가 모두 사라지는 사고가 발생할 수 있다.

## 핵심 설계 결정

### 1. 경고 범위는 상세 모드 7번 항목에만 국한
- 빠른 모드(기본)·프리셋 모드는 `keep-coding-instructions: true`로 자동 채워지므로 리스크 없음.
- 상세 모드 7번 항목은 사용자의 **명시적 선택**이므로, 그 결정 시점에서만 경고.

### 2. 경고 내용은 "꺼지는 것들"을 나열
- 테스트로 코드 검증
- 스파게티 방지 체크
- 배치 품질체크 유도
- 보안/엣지케이스 점검 습관

"시스템 프롬프트 수준의 엔지니어링 가드"라고 총칭하면서도, 구체 항목을 들어 사용자가 무엇을 잃는지 명확히 인지하게 함.

### 3. AskUserQuestion 라벨 자체에 경고 강조
- `유지 (권장, 코딩 세션)` / `제거 (롤플레이 전용 ⚠ SWE 가드 해제)`
- 라벨 자체에 ⚠ 기호를 넣어 선택 UI에서도 위험을 시각적으로 인지.

### 4. 현실 비유
이 경고는 "자동차 수동 모드 전환 스위치 옆의 ⚠ 라벨"에 해당한다. 기본 오토매틱(유지) 상태에서는 차량이 스스로 안전 장치를 관리한다. 수동 모드(제거)는 특정 상황(드리프트·오프로드)에서는 필요하지만, 일반 도로에서 실수로 전환하면 ABS·트랙션 컨트롤이 꺼지는 것과 같다. 전환 스위치에 "일반 주행 시 끄지 말 것" 라벨을 붙여 두는 것이 이번 변경의 취지.

## 구현 내역

### 수정 파일
- `leeloo-kit/skills/lk-persona/SKILL.md:108-116` — 상세 모드 7번 항목 확장(4줄 → 9줄)
- `leeloo-kit/plugin.json` — 3.5.0 → 3.5.11 (marketplace.json과 sync drift 복구 겸용)
- `.claude-plugin/marketplace.json` — leeloo-kit 3.5.10 → 3.5.11

### SKILL.md 변경 비교

Before:
```
- 기본 **유지** (Claude Code SWE 기능 병행)
- 제거는 순수 롤플레이·논픽션 대화용
```

After:
```
- 기본 **유지** (Claude Code SWE 기능 병행) — 코드/인프라/개발 세션이면 반드시 이쪽.
- 제거 시 ⚠ **Claude Code 기본 코딩 지침이 비활성화됨**:
  테스트로 코드 검증, 스파게티 방지 체크, 배치 품질체크 유도, 보안/엣지케이스 점검 습관 등
  시스템 프롬프트 수준의 엔지니어링 가드가 꺼진다.
  → 순수 롤플레이·논픽션·창작 대화처럼 **코드를 생성/수정하지 않는 세션**에서만 선택.
- AskUserQuestion 선택지 라벨 예시:
  - `유지 (권장, 코딩 세션)` / `제거 (롤플레이 전용 ⚠ SWE 가드 해제)`
```

### 버전 sync drift 복구
이번 작업 전 plugin.json은 3.5.0에 멈춰 있었고 marketplace.json은 3.5.10까지 올라와 있었다. 두 파일이 범프 정책상 동일 버전을 유지해야 하므로 이번 기회에 둘 다 3.5.11로 맞춤.

## 결과
- 상세 모드 사용자가 `keep-coding-instructions: false` 선택 전, 어떤 기능이 꺼지는지 구체적으로 인지.
- AskUserQuestion UI 라벨에도 ⚠ 마커가 노출되어 선택 시점의 오인 방지.
- plugin.json ↔ marketplace.json 버전 sync 복구(3.5.11).

## 관련 파일
- `leeloo-kit/skills/lk-persona/SKILL.md` (Step 2 상세 모드 7번 항목)
- `leeloo-kit/plugin.json` (버전)
- `.claude-plugin/marketplace.json` (leeloo-kit 버전)
