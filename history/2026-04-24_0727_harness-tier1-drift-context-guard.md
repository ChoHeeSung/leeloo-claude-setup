# 하네스 Tier 1 — Drift Guard + Context Budget Linter 적용

## 지시 요약

하네스 엔지니어링을 이 프로젝트에 효과적으로 적용하되 컨텍스트를 많이 차지하지 않는 방법으로 설계·구현. 3개 Tier plan 작성 후 Tier 1부터 즉시 착수.

## 배경

커밋 540ff44로 `commands/` wrapper 32개를 추가해 `/` 자동완성 chip을 복원했지만, **같은 회귀가 재발하는 것을 막는 구조적 가드는 없었다**.

1. **Drift**: 누가 `SKILL.md`의 `description` / `argument-hint`를 수정하고 `commands/*.md`를 같이 업데이트하지 않으면 chip이 다시 깨진다.
2. **Context 비만**: 커밋 233e263의 description 압축(2400 → 680자, 72%↓)도 누구든 다시 장문을 쓰면 원상 복귀된다. 세션 자동 로드 토큰이 무방비 증가.

두 문제 모두 **사람의 주의력**에 의존하고 있었다. Tier 1은 이 두 빈틈을 자동 감지 가드레일로 메운다.

## 현실 비유

공장 컨베이어 끝에 검수원이 서 있는 대신, 라인 위에 "이 크기 넘으면 부저 울리는 센서"를 달아둔 것. 센서는 Stop hook. 부저는 1줄 경고. 실제 제조는 누구도 막지 않고, 다만 규격을 넘으면 조용히 알린다. 기존 배치 품질체크(lint/typecheck) 옆에 나란히 센서 한 줄을 더 단 셈.

## 작업 내용

### 1. `leeloo-kit/resources/context-budget.default.json` (신규)

git 추적. 팀 공유되는 기본 임계.

```json
{
  "skill_description_max": 100,
  "skill_argument_hint_max": 120,
  "claude_md_plugin_max_lines": 70,
  "claude_md_root_max_lines": 60,
  "hook_output_max_chars": 300,
  "commands_drift_check": true,
  "ignore_paths": []
}
```

로컬 오버라이드는 `.leeloo/context-budget.json`에 동일 키로. 얕은 merge.

### 2. `leeloo-kit/scripts/context-lint.js` (신규, ~150줄)

세 가지 검사:

- **skill-description / skill-argument-hint** — 길이 임계
- **claude-md-root / claude-md-plugin** — 줄 수 임계
- **commands-drift** — `generate-commands.js`의 `checkDrift()` 재사용

CLI + 모듈 양면:
- `node context-lint.js` → 1줄 요약(Stop용)
- `node context-lint.js --verbose` → 위반 상세

스파게티 금지 원칙(SRP·40줄·중첩 3단계) 준수. 9개 함수로 분해.

### 3. `generate-commands.js` 리팩터

`checkDrift()`를 모듈 함수로 export. `require.main === module` 가드로 CLI와 라이브러리 양쪽 지원. 기존 `--check` / `--sync` / write 동작 변경 없음.

### 4. `stop-quality-check.js` 통합

`runContextLint()` 헬퍼 추가 (try/catch silent-fail). main()의 세 가지 분기:

| 품질체크 | context-lint | 동작 |
|---|---|---|
| 통과 | 통과 | `respond({})` — 침묵 |
| 통과 | 위반 | `stopApprove("[leeloo-kit] context-lint: Nn건 ...")` |
| 실패 | 통과 | 기존 실패 보고 |
| 실패 | 위반 | 기존 실패 보고 + context-lint 꼬리 붙임 |

새 hook event 추가 없이 Stop 한 곳에 묶었다(과설계 회피).

### 5. `lk-setup context-lint` 서브커맨드

on-demand 상세 리포트. 세션 자동 로드 컨텍스트는 SKILL.md 정의(~50자)만 증가. 실제 lint 결과는 `/lk-setup context-lint` 호출 시만 로드.

### 6. 검증

- 현 레포 baseline 실행 → **위반 0건** 확인(임계가 현 상태를 수용)
- 인위적 drift(`commands/lk-persona.md`에 잡라인 추가) → 감지 성공 → 복원 후 재검사 0건 확인

### 7. 배포

- `leeloo-kit` 3.5.1 → 3.5.2 (marketplace.json)

## 결과

- 새 hook event: **0개** (기존 Stop에 통합)
- 세션 자동 로드 추가 비용: **0** (Stop 시점만 실행)
- drift/임계 위반 시 출력: **1줄**, 상세는 명령으로 재요청
- 기존 상태 수용 baseline (0 위반으로 출발)

## 다음 Tier

- **Tier 2** (`docs/plan/harness-tier2-session-budget-observability.plan.md`) — 세션 토큰 추정 집계 + statusline
- **Tier 3** (`docs/plan/harness-tier3-memory-rotation-cache-audit.plan.md`) — Failure Memory 클러스터 rotate + 블록 변동성 감사

Tier 1의 `context-lint.js` 구조가 Tier 2·3 모두의 기반(설정 로딩·위반 리포트·Stop 통합 패턴)으로 재사용된다.
