---
name: lk-team
description: "Agent Team을 대화형으로 구성·관리하는 스킬. /lk-team [create|list|message|broadcast|shutdown] [--preset <name>]"
user_invocable: true
argument-hint: "[create|list|message|broadcast|shutdown] [--preset <name>]"
---

# /lk-team — Agent Team 구성 및 관리

Agent Team을 대화형으로 구성하고 관리합니다. TeamCreate, SendMessage, TeamDelete 도구를 래핑하여 쉽게 사용할 수 있습니다. 프리셋 5종을 내장하여 빠른 시작을 지원합니다.

## 서브커맨드

```
/lk-team                          — 대화형으로 팀 구성 (기본 동작 = create)
/lk-team create                   — 대화형으로 팀 구성
/lk-team create --preset <name>   — 프리셋 기반 팀 구성
/lk-team list                     — 현재 팀 상태 확인
/lk-team message <name> <msg>     — 팀원에게 메시지
/lk-team broadcast <msg>          — 전체 팀원에게 메시지
/lk-team shutdown                 — 팀 종료/정리
```

## 팀 프리셋 5종

| 프리셋 | 구성 (역할/모델) | 용도 |
|--------|-----------------|------|
| `fullstack` | frontend(sonnet) + backend(sonnet) + tester(haiku) | 풀스택 기능 개발 |
| `review-squad` | reviewer-1(sonnet) + reviewer-2(sonnet) + summarizer(haiku) | 다각도 코드 리뷰 |
| `refactor` | analyzer(opus/plan) + implementer(sonnet) + tester(haiku) | 리팩토링 |
| `research` | explorer-1(haiku) + explorer-2(haiku) + synthesizer(opus) | 코드베이스 조사 |
| `quality-check` | analyzer(opus/plan) + code-analyzer(opus/plan) + summarizer(haiku/plan) | 코드 품질 검증 |

## 프리셋 상세

### fullstack

```
팀: fullstack (3명)
1. frontend (acceptEdits, sonnet) — 프론트엔드 구현 (UI 컴포넌트, 스타일링, 상태 관리)
2. backend (acceptEdits, sonnet) — 백엔드 구현 (API, 비즈니스 로직, 데이터 모델)
3. tester (acceptEdits, haiku) — 프론트엔드/백엔드 테스트 작성 및 실행
태스크: #1, #2 병렬 → #3 순차
```

### review-squad

```
팀: review-squad (3명)
1. reviewer-1 (plan, sonnet) — 코드 정확성, 보안, 성능 관점 리뷰
2. reviewer-2 (plan, sonnet) — 아키텍처, 설계 패턴, 유지보수성 관점 리뷰
3. summarizer (plan, haiku) — 두 리뷰어의 피드백을 종합하여 우선순위 정리
태스크: #1, #2 병렬 → #3 순차
```

### refactor

```
팀: refactor (3명)
1. analyzer (plan, opus) — 기존 코드 분석, 리팩토링 전략 설계, 영향 범위 파악
2. implementer (acceptEdits, sonnet) — 리팩토링 구현, 코드 변환
3. tester (acceptEdits, haiku) — 리팩토링 전후 동작 동일성 테스트
태스크: #1 → #2 → #3 (순차 의존)
```

### research

```
팀: research (3명)
1. explorer-1 (plan, haiku) — 코드베이스 구조, 파일 관계, 의존성 탐색
2. explorer-2 (plan, haiku) — 패턴, 컨벤션, 설정 파일, 문서 탐색
3. synthesizer (plan, opus) — 두 탐색 결과를 종합하여 구조화된 분석 보고서 작성
태스크: #1, #2 병렬 → #3 순차
```

### quality-check

```
팀: quality-check (3명)
1. analyzer (plan, opus) — 설계-구현 일치도 분석
2. code-analyzer (plan, opus) — 코드 품질/보안/성능 분석
3. summarizer (plan, haiku) — 두 분석 결과를 종합하여 최종 리포트 작성
태스크: #1, #2 병렬 → #3 순차
```

## Procedure

### 인자 파싱

사용자 입력에서 서브커맨드를 파싱합니다:
- 인자 없음 또는 `create` → **create** 동작
- `create --preset <name>` → **preset create** 동작
- `list` → **list** 동작
- `message <name> <msg>` → **message** 동작
- `broadcast <msg>` → **broadcast** 동작
- `shutdown` → **shutdown** 동작

---

### create 동작 (목적 기반 자동 설계)

1. **목적 질문**: AskUserQuestion — "팀의 목적을 설명해주세요. (예: API 리팩토링, 새 기능 개발, 코드베이스 분석 등)"

2. **자동 설계**: 사용자의 답변에서 다음을 자동 설계합니다:
   - **팀 이름**: 목적을 나타내는 kebab-case 이름
   - **팀원 수**: 2~5명 (목적의 복잡도에 비례)
   - **각 팀원 설계**:
     - `name`: 역할을 나타내는 이름
     - `model`: 역할 복잡도에 따라 선택
       - 아키텍처 설계, 종합 분석, 고난이도 추론 → `opus`
       - 일반 구현, 코드 리뷰, 문서 작성 → `sonnet`
       - 단순 탐색, 검색, 테스트 실행, 요약 → `haiku`
     - `permissionMode`: 작업 특성에 따라 선택
       - 읽기 전용, 분석만 → `plan`
       - 코드 수정 필요 → `acceptEdits`
       - 명령어 실행 포함 → `default`
     - 역할 설명 (한 줄)
   - **태스크 분배**: 각 팀원의 태스크와 의존성 설계
     - 독립적 작업 → 병렬 (#1, #2 병렬)
     - 순차 의존 → 화살표 (#1 → #2)

3. **TODO.md 확인**: Read 도구로 프로젝트 루트의 `TODO.md` 읽기 (있는 경우).
   - TODO.md가 있으면 AskUserQuestion — "TODO.md에서 태스크를 자동 분배할까요? (분배/직접 설정)"
   - "분배" 선택 시: TODO.md의 ⬜ 대기 항목을 팀원들에게 자동 배분

4. **프리뷰 확인**: AskUserQuestion으로 전체 팀 구성을 프리뷰로 보여줍니다.
   ```
   팀 구성 프리뷰

   팀: {team-name} ({n}명)
   1. {name} ({permissionMode}, {model}) — {역할 설명}
   2. {name} ({permissionMode}, {model}) — {역할 설명}
   3. {name} ({permissionMode}, {model}) — {역할 설명}
   태스크: {의존성 설명}

   이대로 생성할까요? (생성/수정)
   ```
   - "수정" 선택 시 → 수정 사항을 반영하여 다시 프리뷰
   - "생성" 선택 시 → 다음 단계로 진행

5. **팀 생성**: 다음 순서로 도구를 호출합니다:
   - **TeamCreate** — 팀 생성 (팀 이름 + 팀원 정의)
   - **TaskCreate** — 각 팀원에게 태스크 할당 (의존성 포함)
   - **Agent** — 각 팀원을 spawn (name 파라미터로 팀원 이름 지정)

6. **결과 출력**:
   ```
   팀 생성 완료

   팀: {team-name}
   팀원:
   - {name} ({model}, {permissionMode}) — {상태}
   - {name} ({model}, {permissionMode}) — {상태}

   관리 명령어:
   - /lk-team list             — 팀 상태 확인
   - /lk-team message <name> <msg> — 팀원에게 메시지
   - /lk-team broadcast <msg>  — 전체 메시지
   - /lk-team shutdown         — 팀 종료
   ```

---

### preset create 동작

1. **프리셋 검증**: 요청된 프리셋 이름이 5종(`fullstack`, `review-squad`, `refactor`, `research`, `quality-check`) 중 하나인지 확인. 아니면 에러 + 사용 가능한 프리셋 목록 표시.

2. **TODO.md 확인**: Read 도구로 프로젝트 루트의 `TODO.md` 읽기 (있는 경우).
   - TODO.md가 있으면 AskUserQuestion — "TODO.md에서 태스크를 자동 분배할까요? (분배/직접 설정)"
   - "분배" 선택 시: TODO.md의 ⬜ 대기 항목을 팀원들에게 자동 배분

3. **프리뷰 표시**: 해당 프리셋의 팀 구성을 프리뷰로 표시합니다.

4. **확인**: AskUserQuestion — "이대로 생성할까요? (생성/수정)"
   - "수정" 선택 시 → 수정 사항을 반영하여 다시 프리뷰
   - "생성" 선택 시 → 다음 단계로 진행

5. **팀 생성**: create 동작의 5단계와 동일 (TeamCreate → TaskCreate → Agent spawn).

6. **결과 출력**: create 동작과 동일한 형식.

---

### list 동작

1. 현재 팀 설정(config)을 확인합니다.
2. TaskList 도구로 각 팀원의 태스크 상태를 조회합니다.
3. 테이블 형식으로 표시합니다:

```
팀 상태: {team-name}

| 팀원 | 모델 | 권한 | 태스크 | 상태 |
|------|------|------|--------|------|
| analyzer | opus | plan | 아키텍처 분석 | 🔨 진행중 |
| implementer | sonnet | acceptEdits | 리팩토링 구현 | ⬜ 대기 |
| tester | haiku | acceptEdits | 테스트 작성 | ⬜ 대기 |
```

팀이 없으면 "활성 팀이 없습니다. `/lk-team create`로 생성하세요." 안내.

---

### message 동작

1. 인자에서 팀원 이름과 메시지를 파싱합니다.
2. SendMessage 도구로 해당 팀원에게 메시지를 전송합니다.
   ```
   SendMessage(to: "{name}", message: "{msg}")
   ```
3. 결과: "`{name}`에게 메시지를 전송했습니다."

---

### broadcast 동작

1. **비용 경고**: "전체 팀원에게 메시지를 보냅니다. 각 팀원이 응답하므로 비용이 발생합니다."
2. SendMessage 도구로 전체 팀원에게 메시지를 전송합니다.
   ```
   SendMessage(to: "*", message: "{msg}")
   ```
3. 결과: "전체 팀원에게 메시지를 전송했습니다."

---

### shutdown 동작

1. **확인**: AskUserQuestion — "팀을 종료하시겠습니까? 진행 중인 작업이 있으면 중단됩니다. (예/아니오)"
2. "예" 선택 시:
   - SendMessage로 각 팀원에게 종료 요청: `SendMessage(to: "*", message: "작업을 정리하고 종료해주세요.")`
   - TeamDelete 도구로 팀 삭제
3. 결과: "팀이 종료되었습니다."
4. "아니오" 선택 시: "팀 종료가 취소되었습니다."
