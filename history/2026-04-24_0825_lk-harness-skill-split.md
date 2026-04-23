# lk-harness 스킬 분리 — 하네스 감사 책임을 lk-setup에서 이주

## 지시 요약

직전 커밋 ae7ac81에서 하네스 감사(`context-lint`)를 `lk-setup`에 얹은 것이 SRP 위반임을 사용자가 지적. 전용 스킬 `lk-harness`로 분리.

## 배경 — 왜 잘못 묶였는가

커밋 233e263에서 `lk-setup`은 원래 "환경 강화 도구(설치·statusline·플러그인 토글)"였는데 `plugins` 하위 7개 서브커맨드가 더해졌고, 이번 ae7ac81에서 `context-lint`까지 얹혀 **"환경 강화 + 플러그인 관리 + 하네스 감사"** 세 가지 책임이 한 스킬에 뭉쳐버렸다.

Tier 2·3이 예정돼 있는 상황에서 `budget`·`failure-memory`·`cache-audit`까지 같은 자리에 쌓으면 완전한 스파게티 확정. 지금이 분기점.

## 현실 비유

공구함 하나에 드라이버·전기 테스터·온도계를 같이 넣어두면 당장은 편하지만, 3개월 뒤 적외선 카메라·진동 측정기·절연 저항계가 추가되면 찾는 데 걸리는 시간이 기하급수적으로 늘어난다. "측정 장비 전용 박스"를 따로 마련해 지금 옮기는 게 가장 싸다.

## 작업 내용

### 1. `leeloo-kit/skills/lk-harness/SKILL.md` 신규

- name/description/argument-hint 프론트매터 (description 41자 — 100 임계 이내)
- 현재 서브커맨드: `context-lint` (with `--verbose`)
- Tier 2·3 확장 예정 서브커맨드(budget/failure-memory/cache-audit)를 **같은 스킬 안**에 누적 원칙 명시 — 분산 금지

### 2. `lk-setup/SKILL.md` 원복

- `argument-hint`: `[...|plugins|context-lint]` → `[...|plugins]`
- 서브커맨드 목록·인자 파싱·Procedure에서 `context-lint` 섹션 전부 제거
- 환경 강화 본 역할만 유지

### 3. Commands wrapper 동기화

`node generate-commands.js --sync`:
- `commands/lk-harness.md` 신규 생성 (chip 즉시 노출)
- `commands/lk-setup.md` argument-hint 원복 반영
- marketplaces + cache 일괄 반영 (33 wrapper 체제)

### 4. 공통 인프라는 건드리지 않음

- `context-lint.js` 본체 변경 **0**
- `stop-quality-check.js` Stop 통합 변경 **0** (스크립트 이름만 참조, 스킬 이름과 무관)
- `.leeloo/context-budget.json` 스키마 변경 **0**

### 5. Plan 문서 갱신

`docs/plan/harness-tier1-drift-context-guard.plan.md`에서 `lk-setup context-lint` 참조를 `lk-harness context-lint`로 일괄 치환.

### 6. 배포

- `leeloo-kit` 3.5.2 → 3.5.3 (marketplace.json)

## 결과

- 스킬 수: 32 → 33 (lk-harness 추가)
- `lk-setup`이 단일 책임(환경 강화)으로 축소
- 하네스 감사는 `lk-harness` 1곳에만 존재
- Stop hook 통합 경로 변경 없음 — 기존 자동 감사 그대로 유지
- `context-lint` 현 레포 위반 0건 유지

## 이번 이주가 막아준 것

Tier 2(`budget`) / Tier 3(`failure-memory`, `cache-audit`)가 `lk-setup`에 더해졌다면 lk-setup은 **10+ 서브커맨드 · 4개 책임**의 스파게티였을 것. 3개의 Tier 2·3 기능은 이제 모두 `lk-harness` 아래 자연스럽게 누적된다.
