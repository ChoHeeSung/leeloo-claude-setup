# Plan: harness-tier2-session-budget-observability

> 작성일: 2026-04-23 | 작성자: Claude(harness-claude-expert) + leeloo.chs@gmail.com

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | Session Budget Observability (Tier 2) |
| 목적 | 세션당 자동 로드 · 누적 소비 토큰을 **추정값**으로 측정·축적하여 최적화 결정의 근거 확보 |
| 전제 | Tier 1 완료 (`context-lint.js` 인프라 재사용) |
| 예상 기간 | 1~2일 |
| 복잡도 | Medium |
| 세션 자동 로드 비용 증가 | statusline 1줄 (~20자) 내 |

## 1. 배경 및 목적

### 문제 정의

- 현재 토큰 최적화는 **체감·추정** 기반. 커밋 233e263의 "세션당 7~9K 절감"도 수작업 계측.
- 세션 시작 시 자동 로드되는 CLAUDE.md·SKILL descriptions·hook 출력·MCP 스키마 총량이 **수치로 관찰되지 않음**.
- 장기 회귀(어느 날부터 토큰이 폭증) 감지 수단 없음.

### 측정 대상

| 카테고리 | 측정 방법 | 정확도 |
|----------|-----------|--------|
| 자동 로드 컨텍스트(고정분) | 파일 크기 합 · 토큰 근사(`chars/3.5`) | ±15% |
| 세션 실제 입력 누적 | SessionEnd에서 `.leeloo/sessions/*.jsonl` 샘플링 | 내부 로그 기반 |
| hook 출력 런타임 크기 | hook 래퍼로 stdout 캡처 후 바이트 수 기록 | 정확 |
| skill 실행당 추정 | skill-post에서 pre/post 컨텍스트 delta 근사 | ±20% |

주: 정확한 토큰은 Anthropic 쪽에만 존재. 여기서는 **추정값**으로 추세 관찰.

## 2. 범위

**In**
- `leeloo-kit/scripts/token-budget.js` 신규 — 추정 유틸(char→token approx, 파일 집계)
- `session-end.js`에 budget 집계 로직 추가 → `.leeloo/token-budget/{YYYY-MM-DD}.jsonl`
- `skill-post.js`에 단일 skill 실행당 delta 기록
- `statusline` 갱신: "오늘 avg N tok/session" 표시 (스크립트 확장)
- `lk-setup budget` 서브커맨드 — 일/주/월 리포트

**Out**
- 실시간 토큰 미터링 (불가능, 하네스 외부 정보)
- Anthropic API 쪽 실제 과금 조회 (스코프 외)
- 정확한 토큰 카운팅 (추정으로 충분)

## 3. 설계

### 3.1 집계 흐름

```
SessionStart → 자동 로드분 측정(파일 크기 합) → .leeloo/token-budget/<date>.jsonl append
                                                     { kind:"load", ts, chars, tokens_est }
skill 실행       → skill-post: { kind:"skill", name, chars_delta, tokens_est_delta }
hook 출력        → bash-post/skill-post/etc: { kind:"hook", name, chars, ts }
SessionEnd      → { kind:"end", duration, total_chars, total_tokens_est }
```

### 3.2 추정식

```
tokens_est = chars / 3.5        // 영어·한국어 혼합 평균
                                 // 근거: Anthropic tokenizer 실측 레인지 3.0~4.0
```

보정 가능성 — `.leeloo/context-budget.json`에 `tokens_per_char` 튜닝 필드 추가.

### 3.3 Statusline 통합

기존 statusline 스크립트에 1라인 병합:

```
[leeloo-kit 3.5.2] 세션 avg 12.4K tok · 7일 p95 18.1K tok
```

- 오늘 평균: `.leeloo/token-budget/<today>.jsonl` 집계
- 7일 p95: 직전 7일 파일 rolling
- 실패/파일 없음 시 조용히 생략(fail-open)

### 3.4 lk-setup budget 서브커맨드

```
/lk-setup budget              → 오늘 + 7일 요약
/lk-setup budget --week       → 7일 일별 테이블
/lk-setup budget --top-skills → skill별 소비 랭킹
/lk-setup budget --load       → 자동 로드 컨텍스트 현황(카테고리별)
```

출력 예:

```
오늘 세션 (2026-04-23):
  세션 수: 3
  자동 로드 평균: 8.2K tok
  세션 누적 평균: 14.7K tok (max 22.1K)
  최다 skill: lk-persona(3회, 2.1K tok est)

7일 추세:
  평균 13.8K tok · p95 18.1K tok · 회귀 없음
```

## 4. 구현 단계

1. `token-budget.js` 유틸 (추정식 + 파일 append + 집계)
2. `session-end.js` / `session-start.js` / `skill-post.js` 통합
3. statusline 스크립트 확장 (기존 파일 확인 후 1줄 추가)
4. `lk-setup` SKILL.md에 `budget` 서브커맨드 추가
5. `.leeloo/token-budget/` 롤링 정책 (30일 경과 파일 archive)
6. leeloo-kit patch bump + HISTORY

## 5. 리스크 / 엣지케이스

| 리스크 | 대응 |
|--------|------|
| 추정 오차로 오인 판단 | 절대값보다 **추세**를 강조. ±20% 주석 상시 표시. |
| jsonl 파일 폭주 | 30일 후 `archive/{year-month}.jsonl`로 합치기 |
| SessionEnd hook 실패 | silent-fail, 집계 누락만 발생 |
| statusline 지연 | 캐시: 5분 주기 precomputed 값 사용 |
| prompt caching 적중분 구분 불가 | Tier 3 #5 Cache Audit에서 간접 추론 |

## 6. 테스트 절차

1. 수동 세션 3회 실행 → `.leeloo/token-budget/<today>.jsonl` 라인 수·형식 검증
2. 하루치 데이터로 `/lk-setup budget` 실행 → 수치 sanity check
3. statusline 1줄 출력 확인(길이·포맷)
4. 30일 롤링 시뮬: 오래된 파일 생성 후 archive 동작 확인
5. hook 실패 시뮬: session-end.js 중단 → 이후 세션 정상 동작 확인

## 7. 완료 기준

- [ ] 세션 실행 시 `.leeloo/token-budget/<date>.jsonl` 라인 누적
- [ ] `/lk-setup budget` 4가지 뷰 정상
- [ ] statusline에 오늘 평균·7일 p95 표시
- [ ] 30일 archive 루틴 동작
- [ ] 1주일 실운용 후 회귀(전주 대비 +20% 이상) 감지 사례 1건 이상 관찰 검증
