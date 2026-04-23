# Plan: harness-tier3-memory-rotation-cache-audit

> 작성일: 2026-04-23 | 작성자: Claude(harness-claude-expert) + leeloo.chs@gmail.com

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | Failure Memory Rotation + Cache-Friendly Prefix Audit (Tier 3) |
| 목적 | ① Failure Memory 무한 축적·난잡화 해결 ② prompt cache 적중률 향상을 위한 prefix 안정성 진단 |
| 전제 | Tier 2의 `token-budget.jsonl` 데이터 축적(최소 2주) |
| 예상 기간 | 1일(#4) + 1일(#5) |
| 복잡도 | Low~Medium |
| 세션 자동 로드 비용 증가 | **0** (on-demand 조회 + SessionEnd 정리) |

## 1. 배경 및 목적

### #4 Failure Memory Rotation

- 현재 `.leeloo/failure-memory/{type}.md`는 append-only. 장기적으로 수백 건 축적 가능.
- CLAUDE.md의 요약 3건은 **가장 최근 3건**일 뿐 의미 있는 패턴 추출이 아님.
- 실제 예: 현재 `file-io.md` 기록은 Edit 실패 3건 모두 동일 유형이지만 경로만 달라서 3칸 차지.

### #5 Cache-Friendly Prefix Audit

- Claude Code는 내부적으로 prompt caching을 사용. **안정적 prefix**가 적중 전제.
- 매 세션 변하는 블록(예: `## Failure Memory`의 최근 3건, `HISTORY.md`의 최신 줄)이 자동 로드 prefix에 포함되면 cache miss 유발.
- 현재 CLAUDE.md 구조에 이런 "자주 바뀌는 블록"이 **상단/중단**에 위치하면 하위 안정 섹션의 캐시까지 깨뜨린다.

## 2. 범위

**In**
- `leeloo-kit/scripts/failure-memory-rotate.js`
  - 유형별 50건 초과 시 오래된 항목 → `archive/{type}-{YYYY-MM}.md`
  - 동일 에러 메시지 정규화(경로 변수 치환) → 클러스터링
  - CLAUDE.md 요약 3건을 "빈도 상위 3 패턴"으로 교체
- `leeloo-kit/scripts/cache-audit.js` (on-demand)
  - CLAUDE.md·SKILL.md를 블록 단위로 분해, git log로 최근 30일 변경 빈도 측정
  - "상단 변동성 점수" 리포트 + 재배치 권고
- `lk-setup cache-audit` 서브커맨드

**Out**
- 실제 Anthropic cache hit-rate 조회(접근 불가)
- 자동 파일 재배치(권고만, 실제 편집은 수동)

## 3. 설계

### 3.1 failure-memory-rotate.js

```
rotate(opts)
 ├─ loadTypeFiles()         .leeloo/failure-memory/*.md
 ├─ parseEntries(text)      날짜/명령/에러/해결 구조화
 ├─ clusterByPattern()      에러 메시지에서 경로·UUID·타임스탬프 마스킹 후 group
 ├─ archiveOld(entries)     유형당 50건 초과 시 오래된 것을 archive/
 └─ updateClaudeMdSummary() 빈도 상위 3 패턴으로 요약 교체
```

**정규화 규칙** (에러 클러스터링):
- 절대경로 → `{path}`
- `line \d+` → `{line}`
- UUID/SHA → `{id}`
- timestamp → `{ts}`

**CLAUDE.md 요약 전환**

Before:
```
file-io(3건):
- `Edit .../SKILL.md` — {...}
- `Edit .../session-start.js` — {...}
- `Edit .../HISTORY.md` — {...}
```

After:
```
file-io 상위 패턴:
- Edit old_string 불일치 (freq:2, last:2026-04-23)
- Edit 이미 수정된 영역 재편집 (freq:1, last:2026-04-22)
상세: .leeloo/failure-memory/file-io.md
```

Hook 통합 — SessionEnd에서 rotate() 실행. 결과는 이미 `.leeloo/`에 파일로 나가고 CLAUDE.md 요약은 일 1회만 갱신(rate limit로 잦은 git diff 방지).

### 3.2 cache-audit.js

**변동성 점수 공식**

```
volatility = 최근_30일_수정횟수 / 블록_크기_줄수
```

- 블록 단위: `##` 헤더 단위 또는 빈 줄 구분 단위
- 점수 높은 블록이 상단이면 위험. 재배치 권고.

**출력 예** (`/lk-setup cache-audit`):

```
CLAUDE.md 프로젝트 루트 (38줄):
  ## Failure Memory (5줄, volatility 0.84) ← 상단 주의
    → 하단 이동 권고. Plugins 표 위로 올리면 안정 prefix 확장

leeloo-kit/CLAUDE.md (43줄):
  ## Harness Engineering (10줄, volatility 0.02) ✓ 안정
  ## Architecture (12줄, volatility 0.15) ✓ 안정

전체 점수: 0.21 (양호). 상단 50% 볼라틸리티 0.08로 캐시 친화적.
```

### 3.3 SKILL.md 대상 감사 (확장)

`*/skills/*/SKILL.md`도 같은 분석. description 외 본문은 lazy-load라 우선순위 낮음 — 선택적.

## 4. 구현 단계

### #4 Failure Memory Rotation (1일)

1. `failure-memory-rotate.js` — 파싱·클러스터링 함수 4개 (각 30~50줄)
2. SessionEnd 통합 — 일 1회 실행 (`.leeloo/.last-rotate` 파일로 gate)
3. 기존 CLAUDE.md 요약 갱신 로직 교체
4. `lk-setup failure-memory` 서브커맨드(수동 rotate·조회)

### #5 Cache-Friendly Prefix Audit (1일)

1. `cache-audit.js` — git log 파서 + 블록 분해 + 점수 계산
2. `lk-setup cache-audit` 서브커맨드
3. 현 레포에 실행 → 즉각 권고 1~3건 확보
4. 권고 반영 여부는 **별도 커밋**으로 분리(자동화 아님)

### 공통

5. leeloo-kit patch bump + HISTORY
6. 2주 운용 후 효과 측정: Tier 2의 token-budget 데이터로 평균 감소 확인

## 5. 리스크 / 엣지케이스

| 리스크 | 대응 |
|--------|------|
| Rotate가 중요 에러 기록 유실 | 삭제 아닌 `archive/` 이동. `failure-memory` 서브커맨드로 역추적 가능 |
| 클러스터링 오분류 | 정규화 규칙을 보수적으로. 매칭 실패 시 개별 항목 유지 |
| git log 비용 | 최근 30일로 제한. 캐시 `.leeloo/cache-audit.cache.json` 1일 TTL |
| 재배치 권고가 실제 cache 적중률 향상을 보장 못함 | 추정 기반 명시. 검증은 Tier 2 데이터로 전후 비교. |
| SessionEnd hook 연쇄 실패 | silent-fail, 다음 세션에서 재시도 |

## 6. 테스트 절차

### #4
1. 가짜 `file-io.md`에 50건 이상 넣고 rotate → `archive/` 생성 + 원본 50건 남음 검증
2. 동일 패턴 3건 + 다른 패턴 2건 → CLAUDE.md 요약이 "상위 3 패턴" 형태로 변환되는지
3. Rate limit: 1분 내 두 번 실행해도 git add 트리거는 1회만

### #5
1. 현 레포 cache-audit 실행 → 점수 sanity 확인
2. CLAUDE.md 상단에 임시 "자주 바뀌는 블록" 삽입 → 점수 상승 확인
3. 블록 이동 후 재실행 → 점수 하락 확인
4. 1주 운용 후 토큰 평균이 전주 대비 안정/하락인지 Tier 2 데이터로 확인

## 7. 완료 기준

- [ ] `file-io` 유형 100건 생성·rotate 후 아카이브 + CLAUDE.md 요약 패턴 기반 전환
- [ ] `/lk-setup cache-audit` 실행 결과로 실제 1건 이상 재배치 반영
- [ ] 2주 후 Tier 2 token-budget 데이터 비교 — 세션 평균 유지 또는 감소
- [ ] HISTORY.md 기록 + leeloo-kit patch bump
