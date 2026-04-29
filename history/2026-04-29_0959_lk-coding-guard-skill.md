# lk-coding-guard skill 신규 + 글로벌 원칙 §5·6·8 보강

> 2026-04-29 09:59 (KST) — leeloo-kit 3.7.0

## 지시 요약

Andrej Karpathy의 [LLM 코딩 안티패턴 관찰](https://x.com/karpathy/status/2015883857489522876)을 정리한 [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) 레포와 우리 글로벌 `~/.claude/CLAUDE.md`를 비교하여, *효율성 차이*를 분석하고 표준 프로젝트에 통합 반영.

## 작업 내용

### 1. lk-coding-guard skill 신규 (`leeloo-kit/skills/lk-coding-guard/SKILL.md`)

카파시 4원칙 + 글로벌 원칙 7번 정량 게이트를 통합한 **단일 skill**.

| 섹션 | 출처 | 효과 |
|---|---|---|
| §1 Think Before Coding | 카파시 1 | 가정·해석 분기·트레이드오프 사전 표면화 |
| §2 Simplicity First + 정량 게이트 | 카파시 2 ⊕ 우리 7 | 과잉 추상화 차단 + SRP·중첩3·CC10 강제 |
| §3 Surgical Changes (범위 안/밖) | 카파시 3 ⊕ 우리 5 | drive-by refactor 면허 회수 |
| §4 Goal-Driven Execution | 카파시 4 | 명령형 → 선언형(verify:) 변환 |
| §5 KPI 자기 점검 | 카파시 README | 불필요 diff↓·재작성↓·사전 질문↑·미니 PR |

description은 한국어 + 영어 동사 키워드 혼용으로 trigger 정확도 확보:
> *"코드 작성/리뷰/리팩터링 시 자동 호출되는 코딩 행동 게이트 — 가정 명시·단순성·외과적 변경·검증 가능한 성공 기준 + 정량 게이트(SRP·중첩3·함수50-80·CC10). Use when writing, reviewing, or refactoring code."*

### 2. 글로벌 원칙 가이드 (`leeloo-kit/resources/CLAUDE.md`) 보강

- **§5 "범위 안/밖" 분리**: 기존 "발견된 문제는 즉시 수정"이 LLM에게 *drive-by refactor 면허*를 줄 위험을 차단. 범위 안 → 즉시 수정, 범위 밖 → 보고만.
- **§6 사전 가정 게이트 추가**: 기존 6번은 *사후* 재탐색만 다뤘으나, 카파시 1번을 흡수해 *사전* 가정 명시 게이트를 첫 항목으로 추가. 제목도 "가정 명시 및 사용자 지적 시 소스 코드 재탐색 원칙"으로 확장.
- **§8 verify 패턴 추가**: 기존 "계획 우선" 한 줄 → 다단계 검증 체크 + 명령형→선언형 변환 예시 2줄 추가. 카파시 4번 흡수.
- **§스킬 섹션**: lk-coding-guard 안내 한 줄 추가 (recency boost 채널 명시).

### 3. 버전 + 메타 갱신

- `leeloo-kit/plugin.json`, `.claude-plugin/marketplace.json` 3.6.0 → 3.7.0
- description에 "코딩 행동 게이트" 추가
- 루트 `CLAUDE.md` 표 (3.4.0/3개 → 3.7.0/5개)
- `leeloo-kit/CLAUDE.md` skills 목록 4 → 5

### 4. failure-memory-rotate.js 옛 표현 정리

이전 변경에서 갱신 타겟이 `CLAUDE.md`에서 `CLAUDE.local.md`로 이동했지만 함수명·변수명·주석·로그가 옛 표현 그대로 남아 있던 것을 동기화.

| 위치 | Before → After |
|---|---|
| 라인 5 주석 | `→ CLAUDE.md 요약` → `→ CLAUDE.local.md 요약` |
| 라인 110 함수명 | `updateClaudeMd` → `updateClaudeLocalMd` |
| 라인 150 리턴 키 | `claudeMdUpdated` → `claudeLocalMdUpdated` |
| 라인 160 로그 | `CLAUDE.md updated=` → `CLAUDE.local.md updated=` |

호출자(`session-end.js:209`)는 리턴값 미사용 — 외부 영향 0. 문법 검증 OK.

## 결과

7개 파일 변경 + 1개 신규 디렉토리(lk-coding-guard skill). Conventional Commits + 한국어 본문으로 단일 커밋 묶음.

## 현실 비유 — "코딩 행동 게이트"의 의미

**비행기 이륙 전 체크리스트**가 현실 비유로 가장 적합합니다.

- **글로벌 md (~/.claude/CLAUDE.md)** = *항공사 표준 운항 매뉴얼*. 모든 비행 전에 항상 펼쳐져 있음. 두껍고 자세하지만, 매번 처음부터 끝까지 읽지는 않음 → *attention drop*.
- **lk-coding-guard skill** = *이륙 직전 조종사가 손에 들고 항목별로 큰 소리로 읽는 "PRE-TAKEOFF" 카드*. 짧고 핵심만. 매뉴얼과 같은 내용이지만 *그 순간*에 다시 외치게 만든다.

매뉴얼만 있으면 베테랑 조종사가 "다 외웠다"며 건너뛸 수 있다 — 그게 LLM의 silent assumption·drive-by refactor 위험과 같다. 이륙 직전 카드를 *반드시* 외치게 하면, 같은 내용이라도 *그 turn*에는 빠질 수 없다.

또 카드는 매번 들고 있지 않는다 — *이륙 직전*에만. 그래서 trigger description이 "코드 작성/리뷰/리팩터링 시"로 좁게 잡혀 있다. 비행기가 활주로에 진입해야 카드를 꺼내 듣는 것과 같은 원리.

매뉴얼(글로벌) + 카드(skill) 이중 채널 = 잊을 가능성을 두 번 줄인다.

## 다음 단계

- `/lk-setup claude-md` (또는 `reinstall`)로 글로벌 `~/.claude/CLAUDE.md` 동기화 — 다음 세션부터 §5·6·8 새 원칙 적용.
- (별도 세션) `lk-harness` lint 룰 2개 추가: drive-by refactor 탐지(diff 범위 vs 요청 범위) + 사전 가정 누락 탐지.
