# Failure Memory를 CLAUDE.local.md로 분리 — 루트 CLAUDE.md prefix 안정화

## 지시 요약

Tier 3의 `cache-audit`이 지적한 **루트 CLAUDE.md volatility 1.05 🔴** 해결. Failure Memory 자동 주입 대상을 `CLAUDE.md` → `CLAUDE.local.md`로 이관.

## 배경

- 루트 `CLAUDE.md`는 Claude Code 세션 시작 시 자동 로드되어 시스템 프롬프트의 일부가 된다.
- Anthropic prompt caching은 `cache_control` breakpoint **이전의 연속 텍스트**가 완전 동일해야 hit. 한 글자라도 바뀌면 그 지점부터 miss.
- 기존 구조: SessionEnd hook이 `updateClaudeMdSummary()`로 루트 CLAUDE.md의 `## Failure Memory` 섹션을 매 세션 재작성 → 파일 전체 mtime/hash 변경 → cache prefix 안정성 저해.
- 최근 30일 commit 수 = 43회. 파일 41줄. volatility = 1.05 🔴.

## 현실 비유

책 맨 끝장에 "오늘 발견된 오탈자 목록"을 매일 새로 붙인다면, 책 자체가 "매일 다른 버전"이 된다. 도서관 사서(prompt cache)는 이 책을 "새 판"으로 처리하고 색인을 다시 만든다. 해결은 오탈자 목록을 **딸린 별책 부록**(`CLAUDE.local.md`)으로 분리해서, 본책은 고정하고 부록만 매일 교체. 사서는 본책 색인을 재사용하고 부록만 새로 본다.

Claude Code는 `CLAUDE.local.md`를 **공식적으로 자동 로드**하되 gitignore에 넣을 수 있으므로, 팀 공유 본문(`CLAUDE.md`)은 안정화하고 로컬 변경분(Failure Memory)은 별도 관리하기에 이상적.

## 작업 내용

### 1. `leeloo-kit/scripts/lib/failure-log.js` — `updateClaudeMdSummary()` 대상 변경

```diff
- const claudeMdPath = path.join(process.cwd(), 'CLAUDE.md');
+ const claudeMdPath = path.join(process.cwd(), 'CLAUDE.local.md');
```

파일 없을 때 자동 생성하는 seed도 수정 — 로컬 전용 설명 주석 포함.

### 2. `leeloo-kit/scripts/failure-memory-rotate.js` — `updateClaudeMd()` 대상 변경

동일하게 `CLAUDE.local.md`로 전환. 파일 없으면 seed로 자동 생성.

### 3. 루트 `CLAUDE.md` Failure Memory 섹션 정리

기존(4줄 × N회 재작성):

```
## Failure Memory
file-io(3건) — 상세: .leeloo/failure-memory/ 참조
- `Edit /Users/.../file.js` — {...}
- ...
```

변경(2줄 고정):

```
## Failure Memory

실패 기록 요약은 프로젝트 로컬 `CLAUDE.local.md`에 기록됩니다
(gitignore, Claude Code 자동 로드). 상세는 `.leeloo/failure-memory/`
및 `/lk-harness failure-memory` 참조.
```

이제 이 섹션은 **자동 갱신 대상이 아님** — 문서로만 남아 변동 없음.

### 4. `.gitignore`에 `CLAUDE.local.md` 추가

팀 공유 대상이 아니므로 로컬 전용. 기존 `.claude/settings.local.json`과 같은 계열.

### 5. 검증

- `cache-audit --no-cache`: 과거 git log가 이미 누적되어 있어 당장 점수는 유지(volatility 1.10 🔴). **앞으로 Failure Memory 관련 커밋이 더 이상 루트 CLAUDE.md를 건드리지 않으므로 시간이 지나며 자연 감소** — 30일 후 재측정 예정.
- `failure-memory-rotate.js --force`: `CLAUDE.local.md` 신규 생성 확인, 상위 3 패턴 섹션 작성 확인, 테스트 후 삭제(다음 세션이 실 생성).
- `context-lint`: 0 위반 유지.

### 6. 배포

- `leeloo-kit` 3.5.5 → 3.5.6 (marketplace.json)

## 후속 관찰 지점

**2~4주 후 재측정**:

- `/lk-harness cache-audit --no-cache`
- 기대: 루트 CLAUDE.md volatility가 0.1~0.2 수준으로 수렴 (✓)
- Tier 2의 `token-budget` jsonl에서 세션 자동 로드 평균이 감소·안정화되는지 확인

현재 cache-audit이 🔴이라도 **구조적 원인이 제거되었기 때문에 추세는 하락**. volatility 메트릭은 30일 rolling이라 과거 커밋이 빠져나가야 반영.

## 원칙 준수

- 세션 자동 로드 비용: **감소 예정** (루트 CLAUDE.md가 더 이상 매 세션 재작성 되지 않음)
- 새 hook 추가: 0 (기존 SessionEnd 경로만 대상 파일 변경)
- 함수 40줄 이하·SRP·중첩 3단계 이내 유지
- silent-fail 유지
