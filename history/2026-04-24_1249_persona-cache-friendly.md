# lk-persona 캐시 친화 슬림화

## 지시 요약

- 사용자 질문: lk-persona가 만드는 페르소나 md가 과도한지 + prompt cache에 적용되는지 검토
- 검토 결과 채택 후 "모두 적용" 지시 → 본문 슬림화·가이드 하향·Step 6 재설계

## 배경 (왜)

Claude Code의 Output Style은 시스템 프롬프트 prefix에 그대로 주입된다. 즉 페르소나 본문 길이가 그대로 prompt cache write/read 비용으로 환산된다.

현재 활성 페르소나 `harness-claude-expert.md`는 52줄/4.2KB로, 같은 폴더의 기본 lk-* 페르소나(35줄 내외) 대비 약 1.5배. 게다가 본문에 모델 ID 블록이 들어 있어 시스템 environment의 모델 표와 **중복 적재**되고 있었다.

또 SKILL.md `Step 6`은 페르소나 생성/전환 시 **본문 전체를 user turn에도 inject**하도록 설계되어, 다음 세션에서 system prompt에 자동 로드되는 본문과 **두 곳 중복**이 발생했다.

## 작업 내용

### A. `harness-claude-expert.md` 슬림화

| 항목 | Before | After |
|---|---|---|
| 줄 수 | 52 | 36 |
| 크기 | 4.2KB | ~2.1KB |
| 응답 원칙 | 7개 (모델 ID 하드코딩 포함) | 6개 (모델 ID 제거) |
| 전문 영역 | 5블록 + 키워드 nesting | 4블록 + 키워드는 description으로 |

핵심 변화: 응답 원칙 5(모델 ID 5줄)를 통째로 제거. 모델 정보는 시스템 environment에 이미 들어오므로 페르소나 본문에 둘 이유가 없고, 모델 갱신 시 페르소나도 동기화해야 하는 부담만 만들었다.

### B. SKILL.md 본문 길이 가이드 하향

`leeloo-kit/skills/lk-persona/SKILL.md:153`

```diff
- 본문 60~120줄 내외
+ 본문 30~50줄 내외 (cache prefix·가독성 우선)
+ 키워드 나열은 본문이 아니라 frontmatter description에 넣을 것
```

기존 가이드 자체가 현실(lk-mentor 36줄, lk-dual-verify 33줄)과 어긋나 있어 신규 페르소나가 자연스럽게 비대해지는 원인이었다.

### C. SKILL.md Step 6 재설계 — 요약 inject

`leeloo-kit/skills/lk-persona/SKILL.md:180-205`

Before: 본문 전체(프론트매터 제외 마크다운 통째로) inject
After: 정체성 1줄 + 말투 1줄 + 응답 원칙 상위 3개 + 금지 1줄만 inject. 본문은 파일 경로로 안내.

### 버전 범프

`marketplace.json`의 leeloo-kit `3.5.9 → 3.5.10` (patch — 스킬 절차 변경, 호환성 유지)

## 결과

- 다음 세션 재시작 후 system prompt prefix가 약 50% 짧아져 cache write/read 모두 비례 절감
- 페르소나 신규 생성 시 본문이 자연스럽게 30~50줄로 수렴
- create/use 시 user turn 중복 적재 제거 (요약만 inject)

## 현실 비유

페르소나 본문을 **회사 사원증**에 비유한다.
- 사원증 본체(= system prompt)에 직무·연락처·소속이 모두 인쇄되어 있다.
- 그런데 매 회의실 입장 때마다 사원증을 보여주면서 같은 정보를 **다시 말로 읊는다면**(Step 6 본문 전체 inject) 시간 낭비다.
- 이번 변경은 회의 시작에 "저 마케팅팀 김OO입니다" 한 줄만 말하고, 자세한 건 사원증을 참조하라고 알려주는 것과 같다.

## 핵심 코드 스니펫

새 Step 6 inject 템플릿:

```
[PERSONA ACTIVATED: <name>]

핵심 지침 (현재 세션용 요약):
- 정체성: <한 줄>
- 말투/톤: <한 줄>
- 핵심 응답 원칙 (상위 3개):
  1. ...
  2. ...
  3. ...
- 금지: <한 줄>

전체 본문: .claude/output-styles/<name>.md
다음 세션부터 시스템 프롬프트로 자동 로드됩니다.
```
