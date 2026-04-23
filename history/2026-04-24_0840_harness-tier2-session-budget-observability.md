# 하네스 Tier 2 — Session Budget Observability

## 지시 요약

하네스 Tier 2·3을 이어서 진행. Tier 2는 세션당 자동 로드·skill 사용·종료 이벤트를 추정 토큰으로 축적해 **추세 관찰 근거**를 확보.

## 배경

Tier 1로 회귀 가드(`context-lint`)를 확보했지만, 최적화 효과는 여전히 "체감·추정"이었다. "커밋 이후 세션당 몇 K가 줄었는지" 수치가 없으면 다음 최적화 판단 근거가 약하다. Tier 2는 **가시화 인프라**를 먼저 깔아두는 단계.

## 현실 비유

가계부를 안 쓰던 집이 갑자기 지출을 줄이려 하면 어디서 새는지 모른다. 이 Tier는 "영수증 스캔 앱"을 깔아 매일 자동으로 `.leeloo/token-budget/<날짜>.jsonl`에 세 종류 이벤트(들어올 때 = load, 쓸 때 = skill, 나갈 때 = end)를 기록한다. 절대값보다 **주 단위 추세선**이 목적.

## 작업 내용

### 1. `leeloo-kit/scripts/token-budget.js` (신규)

모듈 역할 분리:

- `estimateTokens(chars)` — `chars / 3.5` (영·한 혼합 평균)
- `kstDate(date)` — KST(UTC+9) 기준 YYYY-MM-DD 버킷
- `appendEvent({kind, session, ...})` — jsonl에 추가
- `listLastNDays(n)` — 최근 N일 이벤트
- `summarizeEvents(events)` — 세션별 group + avg/p95/skillFreq
- `archiveOldFiles()` — 30일 경과 파일 → `archive/<YYYY-MM>.jsonl` 병합
- `measureAutoLoad()` — 루트 + 플러그인 CLAUDE.md + SKILL.md frontmatter 크기 합

모두 silent-fail. 함수당 40줄 이하, 중첩 3단계 이내.

### 2. Hook 통합 (silent-fail)

| Hook | 이벤트 |
|---|---|
| `session-start.js` | `{kind:"load", session, chars, tokens_est}` + `archiveOldFiles()` |
| `session-end.js` | `{kind:"end", session, duration_ms}` + `archiveOldFiles()` |
| `skill-post.js` | `{kind:"skill", session, name}` |

새 hook event 추가 없음 — 기존 세 hook에 `try/catch`로만 첨가.

### 3. Statusline 확장

`leeloo-kit/resources/statusline-leeloo.sh` 끝에 보라 블록 추가:

```
... [기존 STATS] [  4.8K ]
```

- `jq`로 오늘 jsonl의 `load.tokens_est` 평균 계산
- `.leeloo/token-budget/<YYYY-MM-DD>.jsonl` 파일·jq 없으면 조용히 생략
- KST 기준 날짜로 파일 선택(`TZ='Asia/Seoul' date +%Y-%m-%d`)

설치·갱신은 기존 `/lk-setup statusline` 또는 `cp` 한 줄. 자동 재배포 범위 외.

### 4. `lk-harness budget` 서브커맨드

`leeloo-kit/scripts/budget-report.js` 신규 — 4가지 뷰:

| 뷰 | 명령 | 내용 |
|---|---|---|
| 오늘 요약(기본) | `budget-report.js` | 오늘 세션 수·자동 로드 평균/p95·최다 skill Top3 + 7일 추세 |
| 일별 | `--week` | 7일 일별 테이블 |
| skill 랭킹 | `--top-skills` | 14일 skill 사용 빈도 |
| 자동 로드 현황 | `--load` | 현재 측정값(파일 크기·추정 토큰·측정 대상) |

`lk-harness/SKILL.md`에 `budget` 섹션 + 서브커맨드 목록·인자 파싱 확장. Tier 3 예정(`failure-memory`, `cache-audit`)도 여기에 누적.

### 5. 데이터 성격 명시

- `tokens_est`는 **추정값** (±15% 오차). 절대 비교가 아닌 추세 관찰용.
- 글로벌 `~/.claude/CLAUDE.md`, MCP 스키마, 하네스 내부 프롬프트는 제외.
- 프로젝트가 제어 가능한 "자동 로드분"만 측정.

### 6. 배포

- `leeloo-kit` 3.5.3 → 3.5.4 (marketplace.json)

## 검증

- `token-budget.js` 모듈 smoke test: event append → readJsonl → summarize 정상
- KST 날짜 처리: UTC 23:25(KST 08:25) 테스트 — 파일 버킷이 2026-04-24로 정확히 생성
- `budget-report.js` 4개 뷰 실행 정상(데이터 0 상태)
- `context-lint`: 위반 0건 유지
- `generate-commands --sync`: `commands/lk-harness.md` 갱신

## 향후 (Tier 3)

Tier 3에서 `failure-memory-rotate.js` + `cache-audit.js`를 추가할 때 Tier 2의 데이터가 **효과 측정 근거**로 쓰인다:

- rotate 전후 `tokens_est` 추세 비교 → 실제 토큰 감소 관찰
- cache-audit 반영 전후 avg/p95 비교 → prefix 안정화 효과 정량화

2주 이상 축적 후 의미 있는 비교 가능.
