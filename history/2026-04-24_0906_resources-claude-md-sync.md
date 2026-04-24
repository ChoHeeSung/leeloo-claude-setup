# resources/CLAUDE.md 동기화 — 스파게티 원칙·CLAUDE.local.md·스킬 목록 제거

## 지시 요약

`/lk-setup reinstall` 흐름 중 발견: 레포 배포 템플릿 `leeloo-kit/resources/CLAUDE.md`가 stale. 글로벌 `~/.claude/CLAUDE.md`에만 있고 템플릿에는 없는 변경 3건 식별 → reinstall 그대로 진행 시 사용자 커스텀 손실. 템플릿을 최신 상태로 끌어올리고 **스킬 목록 섹션도 제거**.

## 발견된 불일치

| 항목 | 글로벌 CLAUDE.md (121줄) | resources/CLAUDE.md (96줄, 변경 전) |
|---|---|---|
| 원칙 7 "스파게티 금지" | ✅ (필수) | ❌ |
| 권장 원칙 번호 | 8~11 | 7~10 |
| 스킬 명령어 표 | ✅ (9개, 구 버전) | ✅ (9개, 구 버전 — **`/lk-harness` 누락**) |
| Failure Memory 절차 대상 | `CLAUDE.md` | `CLAUDE.md` (오늘 v3.5.6 `CLAUDE.local.md` 이관 미반영) |

## 현실 비유

공장의 **제품 설명서 원본**(resources)이 창고에 있고, 고객이 받은 복사본에는 지난달 추가된 안전수칙(스파게티 원칙)이 손글씨로 덧붙어 있다. 원본을 갱신하지 않은 채 "원본으로 다시 배포"를 누르면 손글씨가 지워진다. reinstall 직전에 원본부터 최신화하는 게 순서.

## 결정 — 스킬 목록은 제거

사용자 질의 "CLAUDE.md에 스킬을 나열할 필요가 있니?"에 대해:

- **불필요**. Claude Code는 세션 시작 시 플러그인 스킬 `description`/`argument-hint`를 system-reminder로 **이미 자동 로드**. CLAUDE.md에 다시 쓰면 같은 정보 2회 로드(토큰 낭비).
- drift 원인: `/lk-harness` 신설·`/lk-team` 추가 같은 변경을 수동 동기화해야 함. 오늘도 이미 `/lk-harness` 누락이 확인됨.
- volatility 기여: 스킬 추가마다 CLAUDE.md 커밋 → cache-audit 점수 악화.

→ 섹션 통째로 제거하고 한 문단 안내로 대체:

> 사용 가능한 슬래시 커맨드와 스킬은 Claude Code가 세션 시작 시 자동 로드합니다. `/` 입력 시 자동완성 팝업에서 확인하거나 `/lk-harness budget --top-skills`로 사용 빈도를 조회하세요.

## 변경 내역

### `leeloo-kit/resources/CLAUDE.md` (96 → 108줄)

1. **원칙 7 신설** — 스파게티 코드 금지 + 8개 체크리스트 (글로벌에서 역 sync)
2. **권장 원칙 번호 재정렬** — 7·8·9·10 → 8·9·10·11 (Plan First·컨텍스트 위생·서브에이전트 위임·한국어 응답)
3. **스킬 명령어 표 섹션 제거** — 한 문단 안내로 대체
4. **Failure Memory 절차 3번** — `CLAUDE.md` → `CLAUDE.local.md`로 변경. `failure-memory-rotate.js`가 SessionEnd에서 일 1회 자동 갱신함을 명시. 루트 CLAUDE.md는 prompt cache 안정 prefix 보존 대상.
5. **하단 빈 `## Failure Memory` 섹션 제거** — 이제 CLAUDE.local.md가 전담.

### `marketplace.json`

- `leeloo-kit` 3.5.6 → 3.5.7

## 검증

- `context-lint`: 위반 0건 유지 (resources/CLAUDE.md는 검사 대상 외지만 다른 대상들 모두 통과)
- 파일 크기: 96 → 108줄 (+12줄, +24 스파게티 원칙 / -14 스킬 표 / +2 안내 등 net)

## 이후 조치

사용자가 `/lk-setup reinstall` 재시도하면 글로벌 `~/.claude/CLAUDE.md`도:
- 스파게티 원칙 유지
- 스킬 목록은 사라짐(의도된 결과)
- Failure Memory 절차가 `CLAUDE.local.md` 기준으로 갱신

글로벌 CLAUDE.md를 **직접** 수정하는 로직은 여전히 금지 상태. reinstall만이 합법적 갱신 경로.
