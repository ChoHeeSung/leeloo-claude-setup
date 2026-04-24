---
name: lk-harness
description: "하네스 감사 — context-lint·budget·failure-memory·cache-audit 리포트"
user_invocable: true
argument-hint: "[context-lint|budget|failure-memory|cache-audit] [--verbose|--week|--load|--force|--file <p>]"
---

# /lk-harness — 하네스 엔지니어링 감사

leeloo-kit 하네스의 건강성을 감사하고 위반 항목을 상세 리포트로 출력합니다. Stop hook이 1줄 요약만 제공하므로, 상세 조사는 본 스킬로 수행합니다.

## 서브커맨드

```
/lk-harness                         — context-lint와 동일 (기본)
/lk-harness context-lint            — 컨텍스트 예산 감사 요약
/lk-harness context-lint --verbose  — 위반 항목 상세
/lk-harness budget                  — 오늘 + 7일 토큰 추정 요약
/lk-harness budget --week           — 7일 일별 테이블
/lk-harness budget --top-skills     — 14일 skill 사용 랭킹
/lk-harness budget --load           — 현재 자동 로드 컨텍스트 현황
/lk-harness failure-memory          — 유형별 기록 수·상위 패턴 요약
/lk-harness failure-memory --force  — 일 1회 gate 무시하고 즉시 rotate
/lk-harness cache-audit             — CLAUDE.md prefix 변동성 요약
/lk-harness cache-audit --verbose   — 파일별 블록 구조
/lk-harness cache-audit --file <p>  — 단일 파일 상세
```

> 모든 감사 서브커맨드는 **이 스킬 안에만** 존재합니다. 다른 스킬로 분산 금지 (SRP).

## Procedure

### 인자 파싱

사용자 입력에서 서브커맨드를 파싱합니다.

- 인자 없음 또는 `context-lint` → **context-lint** 동작
- `budget` → **budget** 동작
- `failure-memory` → **failure-memory** 동작 (rotate + 요약)
- `cache-audit` → **cache-audit** 동작
- 플래그 `--verbose` → context-lint / cache-audit 상세
- 플래그 `--week` / `--top-skills` / `--load` → budget 뷰 선택
- 플래그 `--force` → failure-memory 일 1회 gate 무시
- 플래그 `--file <path>` → cache-audit 단일 파일

---

### context-lint 동작

하네스 컨텍스트 예산을 감사합니다.

**감사 대상**

| 카테고리 | 대상 | 임계 기본값 |
|---------|------|------------|
| skill-description | `*/skills/*/SKILL.md` frontmatter `description` 길이 | 100자 |
| skill-argument-hint | 동 frontmatter `argument-hint` 길이 | 120자 |
| claude-md-root | 루트 `CLAUDE.md` 줄 수 | 60줄 |
| claude-md-plugin | 각 플러그인 `CLAUDE.md` 줄 수 | 70줄 |
| commands-drift | `commands/*.md` ↔ `SKILL.md` frontmatter 일치 | 완전 일치 |

**실행**

기본(요약):
```bash
node leeloo-kit/scripts/context-lint.js
```

상세(--verbose):
```bash
node leeloo-kit/scripts/context-lint.js --verbose
```

출력 예(상세):

```
context-lint: 2건
  [skill-description] leeloo-doc/skills/lk-doc-parse/SKILL.md — 142 > 100
  [commands-drift] leeloo-kit/commands/lk-persona.md (out-of-sync)
```

**임계 조정**

기본값은 `leeloo-kit/resources/context-budget.default.json` (git 추적). 프로젝트별 오버라이드는 `.leeloo/context-budget.json`에 동일 키로 작성합니다(얕은 merge).

```json
{
  "skill_description_max": 100,
  "skill_argument_hint_max": 120,
  "claude_md_plugin_max_lines": 70,
  "claude_md_root_max_lines": 60,
  "hook_output_max_chars": 300,
  "commands_drift_check": true
}
```

**Stop hook 자동 감사**

세션 종료(Stop 이벤트) 시 동일 검사가 자동 실행되며, 위반 시 1줄 요약만 표시됩니다. 상세는 본 커맨드(`--verbose`)로 재조회하세요. 자동 실행이 실패해도(silent-fail) 기존 Stop 동작을 막지 않습니다.

**drift 자동 수정**

`commands-drift` 위반은 다음으로 즉시 재생성됩니다.

```bash
node leeloo-kit/scripts/generate-commands.js --sync
```

SKILL.md `description`·`argument-hint` 변경 후 반드시 실행하세요.

---

### budget 동작

세션당 자동 로드 추정치·skill 실행 빈도를 집계해 출력합니다. 원시 데이터는 `.leeloo/token-budget/<YYYY-MM-DD>.jsonl`에 hook(SessionStart/SessionEnd/skill-post)이 silent-fail로 축적합니다.

**데이터 성격**

| 항목 | 측정 방법 | 정확도 |
|------|-----------|--------|
| 자동 로드 chars | 루트 CLAUDE.md + 플러그인 CLAUDE.md + 모든 SKILL.md frontmatter 파일 크기 합 | ±5% |
| tokens_est | `chars / 3.5` (영·한 혼합 평균) | ±15% |
| skill 사용 빈도 | PostToolUse:Skill event 카운트 | 정확 |

**추세** 관찰용입니다. 절대값은 Anthropic 측 실제 과금과 다를 수 있으며 비교는 항상 전주 대비 등 상대값으로 하세요.

**실행**

```bash
# 오늘 + 7일 요약 (기본)
node leeloo-kit/scripts/budget-report.js

# 7일 일별 테이블
node leeloo-kit/scripts/budget-report.js --week

# 14일 skill 사용 랭킹
node leeloo-kit/scripts/budget-report.js --top-skills

# 현재 자동 로드 컨텍스트 현황
node leeloo-kit/scripts/budget-report.js --load
```

**statusline 표시**

`leeloo-kit/resources/statusline-leeloo.sh`가 오늘 자동 로드 평균(`X.XK` tok)을 보라 블록으로 표시합니다. 설치·갱신은 `/lk-setup statusline` 또는 `cp leeloo-kit/resources/statusline-leeloo.sh ~/.claude/`.

**보관 정책**

- `.leeloo/token-budget/<YYYY-MM-DD>.jsonl` — 30일 보관
- 30일 경과 파일은 `.leeloo/token-budget/archive/<YYYY-MM>.jsonl`로 자동 병합 (SessionStart/SessionEnd hook이 수행)

**tokens_per_char 튜닝**

프로젝트 문자 분포에 따라 추정 계수를 조정하려면 `.leeloo/context-budget.json`에 `tokens_per_char` 필드를 추가하세요(기본 `0.2857` ≈ 1/3.5). 현재는 token-budget 모듈 기본값 사용.

---

### failure-memory 동작

`.leeloo/failure-memory/<type>.md` 기록을 **노후화·클러스터링**합니다.

**동작 순서**

1. 유형별 기록(`<type>.md`)을 날짜순 정렬
2. `KEEP_RECENT=50` 초과분을 `.leeloo/failure-memory/archive/<type>-<YYYY-MM>.md`로 이동
3. 남은 기록의 에러 본문을 정규화(절대경로·hash·timestamp·Edit JSON payload 마스킹) 후 빈도 클러스터링
4. 프로젝트 로컬 `CLAUDE.local.md`의 `## Failure Memory` 섹션을 유형별 요약으로 교체
   - 유형별 기록 **≥ 5건**: 상위 3 패턴 클러스터링으로 표기
   - 유형별 기록 **< 5건**: 최근순 원문 그대로 덤프 (payload만 치환) — 통계적 신뢰가 낮은 단계에서 원문 유지

**실행**

```bash
# 일 1회 gate로 자동 실행됨(SessionEnd). 수동 재실행:
node leeloo-kit/scripts/failure-memory-rotate.js --force
```

**정규화 규칙**

| 원본 | 치환 |
|---|---|
| Edit 툴 실패 JSON payload (`{"filePath":...` ~ 줄 끝) | `{payload}` |
| 절대경로(`/Users/...`, `/home/...`) | `{path}` |
| 파일경로(`foo/bar.js`) | `{path}` |
| 16진 hash(8자 이상) | `{hash}` |
| 타임스탬프(ISO) | `{ts}` |
| `line \d+` | `line {n}` |

정규화된 앞 80자를 클러스터 키로 사용합니다. JSON payload 치환은 `< 5건` 원문 덤프에도 동일 적용되어 요약 섹션의 잡음을 제거합니다.

**gate 동작**

- `.leeloo/.last-rotate` 파일에 마지막 실행일(KST) 기록
- 같은 날 재실행 시 `skipped: gated-today`로 조용히 반환
- `--force`로 gate 우회 가능

**archive 복원**

```bash
cat .leeloo/failure-memory/archive/<type>-<YYYY-MM>.md >> .leeloo/failure-memory/<type>.md
```

---

### cache-audit 동작

CLAUDE.md의 **prefix 안정성**을 감사합니다. prompt cache는 안정된 prefix를 전제로 적중하므로, 상단 50%에 자주 바뀌는 블록이 있으면 cache miss를 유발합니다.

**측정식**

```
volatility = 최근 30일 파일 commit 수 / 파일 줄 수
```

| 점수 | 해석 |
|---|---|
| ≥ 0.5 | 🔴 매우 불안정 — 재배치 우선 검토 |
| ≥ 0.2 | 🟡 주의 — 상단 블록 확인 |
| < 0.2 | ✓ 안정 |

**대상 파일**

- 루트 `CLAUDE.md`
- 각 플러그인 `<plugin>/CLAUDE.md`

**실행**

```bash
# 요약
node leeloo-kit/scripts/cache-audit.js

# 파일별 블록 구조
node leeloo-kit/scripts/cache-audit.js --verbose

# 단일 파일
node leeloo-kit/scripts/cache-audit.js --file CLAUDE.md

# 캐시 무시(24h TTL)
node leeloo-kit/scripts/cache-audit.js --no-cache
```

**재배치 지침**

`## Failure Memory` 같이 매 세션 바뀌는 블록은 **파일 하단**으로 이동합니다. 상단에는 안정된 개요·아키텍처·명령 테이블 등을 배치하세요. 재배치는 감사 도구가 자동으로 하지 않으며, 권고만 제공합니다.

**캐시**

- `.leeloo/cache-audit.cache.json` — 24시간 TTL
- git log 비용을 줄이기 위한 것이며, `--no-cache`로 우회 가능

---

## Notes

- 본 스킬은 **읽기 전용 감사**입니다. 파일을 자동 수정하지 않습니다.
- 위반을 허용하려면 임계를 조정하거나 `.leeloo/context-budget.json`의 `ignore_paths`에 경로를 추가하세요.
- `context-lint.js`는 CLI와 모듈 양면으로 동작하며, Tier 2·3 신규 감사(`token-budget`, `cache-audit`, `failure-memory-rotate`)가 같은 패턴으로 병렬 누적될 예정입니다.
