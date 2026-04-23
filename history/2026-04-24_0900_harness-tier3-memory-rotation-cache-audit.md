# 하네스 Tier 3 — Failure Memory Rotation + Cache-Friendly Prefix Audit

## 지시 요약

하네스 Tier 3 구현. Failure Memory 기록을 노후화·클러스터링하고, CLAUDE.md 계열 파일의 prefix 변동성을 감사.

## 배경

- **Failure Memory 무한 축적**: `.leeloo/failure-memory/*.md`가 append-only로 커져 왔고, CLAUDE.md 요약도 "가장 최근 3건"에 그쳐 의미 있는 패턴 추출이 없었다.
- **Prefix 캐시 적중 손실 잠재**: 매 세션 바뀌는 `## Failure Memory` 섹션이 CLAUDE.md 상단/중단에 있으면 그 아래 안정 섹션 prompt cache도 같이 깨진다. 감사 도구가 없어 체감만으로 판단.

## 현실 비유

Failure Memory는 **서랍장의 영수증 묶음** 같다. 쌓이면 찾기도 어렵고 아래쪽이 눌려 안 보인다. rotate는 "50장 넘어가면 달력 월별 폴더로 아카이브하고, 최근 목록에는 가장 자주 나오는 3가지 패턴만 요약해 뽑아두기." — 공간도 정돈되고 패턴도 바로 보인다.

Cache-audit은 **책 편집 원칙**과 같다. 책 앞장(prefix)에는 자주 바뀌지 않는 목차·서문을 두고, 매일 갱신되는 이벤트 로그는 책 뒤에 부록으로 둬야 독자(캐시)가 앞부분을 "기억"한 상태로 빠르게 찾아간다. 감사 도구는 "앞 50%에 자주 바뀌는 큰 블록이 있는지"를 알려주는 교정자다.

## 작업 내용

### 1. `leeloo-kit/scripts/failure-memory-rotate.js` (신규)

함수 분해(SRP, 모두 40줄 이하):

- `normalize(s)` — 절대경로·파일경로·hash·ts·line 마스킹
- `parseEntries(text)` — `- [YYYY-MM-DD] ...` 라인 추출
- `clusterEntries(entries)` — 정규화 80자를 키로 frequency·last 집계
- `topPatterns(clusters, n)` — 빈도순 상위 n
- `archiveOldEntries(file, entries, cwd)` — 50건 초과분 → `archive/<type>-<YYYY-MM>.md`
- `renderSummarySection(typeEntries)` — CLAUDE.md `## Failure Memory` 섹션 문자열
- `updateClaudeMd(cwd, section)` — 파일 내 섹션 치환
- `checkGate(cwd)` — `.leeloo/.last-rotate` KST 날짜 gate
- `rotate(cwd, opts)` — 진입점

CLI:
```
node failure-memory-rotate.js          # 일 1회 gate
node failure-memory-rotate.js --force  # 강제 재실행
```

### 2. `session-end.js` 통합

SessionEnd에서 `rotate()` try/catch silent-fail 호출. gate로 일 1회만 실제 수행.

### 3. `leeloo-kit/scripts/cache-audit.js` (신규)

On-demand 전용. SessionStart/End hook 통합 없음(git log 비용 감안).

- `collectTargets(cwd)` — 루트 + 8개 플러그인 CLAUDE.md
- `splitByHeader(text)` — `##` 헤더 기준 블록 분해
- `gitFileModCount(file, daysBack)` — `git log --since=N.days.ago` commit 수
- `auditOne(target, cwd)` — `{volatility, topShare, blocks}` 계산
- `loadCache`/`saveCache` — `.leeloo/cache-audit.cache.json`, 24h TTL
- `runAudit` — 진입점(캐시 → 재계산)
- `reportSummary`/`reportVerbose`/`reportFile` — 3가지 뷰

**변동성 등급**

| 점수 | 라벨 |
|---|---|
| ≥ 0.5 | 🔴 매우 불안정 |
| ≥ 0.2 | 🟡 주의 |
| < 0.2 | ✓ 안정 |

CLI:
```
cache-audit.js                 # 요약
cache-audit.js --verbose       # 파일별 블록
cache-audit.js --file <path>   # 단일
cache-audit.js --no-cache      # 캐시 우회
```

### 4. `lk-harness` 서브커맨드 확장

- argument-hint: `[context-lint|budget|failure-memory|cache-audit] [...]`
- SKILL.md에 `failure-memory`/`cache-audit` 섹션 추가
- 인자 파싱 섹션에 신규 서브커맨드 + 플래그 항목 추가
- `commands/lk-harness.md` 동기화

### 5. 배포

- `leeloo-kit` 3.5.4 → 3.5.5 (marketplace.json)

## 검증

- **rotate 동작**: CLAUDE.md 백업 후 `--force` 실행 → 10/3 유형 패턴으로 요약 갱신 확인 → 백업 복원, gate 파일 삭제
- **cache-audit 실제 결과**:
  - 루트 `CLAUDE.md`: **volatility 1.05 🔴** (mods=43/lines=41) — 실측 기준 재배치 검토 대상
  - `leeloo-kit/CLAUDE.md`: 0.44 🟡
  - 이는 **Failure Memory 자동 주입이 루트 CLAUDE.md에 직접 기록**되어 매 세션마다 커밋을 유발하기 때문 — rotate로 상위 패턴 요약만 유지해도 여전히 매 커밋 수정 발생. 근본 대책은 **섹션을 파일 하단으로 이동**(별도 작업).
- **context-lint**: 위반 0건 유지
- **generate-commands --sync**: commands/lk-harness.md 반영

## 즉각 관찰된 개선 여지 (감사 도구가 발견)

루트 `CLAUDE.md`의 `## Failure Memory` 섹션 위치가 현재 파일 맨 끝에 있지만, 전체 볼라틸리티가 1.05로 극단적. 이유:

1. Failure Memory 자동 주입 hook이 `## Failure Memory` 섹션을 매번 재작성
2. 파일 전체가 41줄로 작아서 상대적 변동성이 커보임

향후 개선안(별도 작업):
- 루트 CLAUDE.md에서 Failure Memory를 제거하고 `CLAUDE.local.md`로 분리(git ignore)
- 또는 Failure Memory 주입을 파일 최하단으로 **명시적 marker 고정**(지금도 끝에 있지만 파일 전체를 재작성하는 경우가 있을 수 있음)

## Tier 전체 완주

| Tier | 범위 | 상태 |
|---|---|---|
| 1 | Drift Guard + Context Budget Linter | ✅ (v3.5.2) |
| 2 | Session Budget Observability | ✅ (v3.5.4) |
| 3 | Failure Memory Rotation + Cache Audit | ✅ (v3.5.5) |

총 추가 새 hook event: **0**. 기존 SessionStart/SessionEnd/Stop/PostToolUse:Skill에만 silent-fail로 통합.

2주 이상 축적 후 Tier 2의 token-budget jsonl 데이터로 rotate·cache-audit 반영 효과를 정량 비교 가능.
