# 스파게티 코드 작성 금지 원칙 추가

- 일시(KST): 2026-04-22 14:44
- 범위: `~/.claude/CLAUDE.md` (글로벌), `CLAUDE.md` (프로젝트 로컬)

## 지시 요약

사용자가 "대원칙에 스파게티 코드 작성에 대한 원칙을 추가하고 싶다"고 요청. 웹 검색으로 원칙을 수집하고, CLAUDE가 매 코드 작성/수정 시점에 **확실히 인지**하도록 강조된 형태로 글로벌 + 프로젝트 두 CLAUDE.md에 반영.

## 작업 내용

### 1. 웹 검색으로 원칙 수집
- "how to avoid spaghetti code best practices"
- "SOLID Single Responsibility Principle"
- "cyclomatic complexity nested conditions early return"

수집된 핵심 원칙 8개를 프로젝트 맥락에 맞게 정제.

### 2. 글로벌 `~/.claude/CLAUDE.md`
- **필수 원칙 7번**으로 신설 ("스파게티 코드 작성 금지 원칙").
- 기존 권장 원칙 번호를 7→8, 8→9, 9→10, 10→11로 재배치.
- 구분선(`---`), `[절대 금지]` 라벨, `⚠` 표식, `> 경고` 인용 블록으로 가시성 강조.
- 위반 시 대응 절차 명시: 자작 위반 → 제출 전 리팩터 / 기존 위반 → 사용자 승인 후 리팩터.

### 3. 프로젝트 로컬 `CLAUDE.md`
- "Key Design Decisions" 앞에 **Coding Principles** 섹션 신설.
- 글로벌 원칙 7번을 단일 진실 원천으로 참조하고, 프로젝트 컨텍스트 진입 시점에 체크리스트를 재천명.

## 8개 체크리스트

1. **단일 책임(SRP)** — 함수/클래스는 하나의 역할만. 변경 이유 2개 이상이면 분리.
2. **중첩 3단계 제한** — `if`/`for`/`while` 중첩 ≤ 3. 예외는 Early Return / Guard Clause로 먼저 처리.
3. **함수 50~80줄 이내** — 화면 한 장 초과 시 분해.
4. **복잡도 게이트** — 분기 10개 이상 또는 중첩 4단계 도달 시 즉시 분해 (예외 없음).
5. **DRY & KISS** — 동일 로직 3회째엔 추출. 단, 추상화가 단순성을 해치면 중복을 용인.
6. **의미 있는 이름 우선** — 주석으로 모호한 이름을 보완하지 않는다.
7. **낮은 결합도** — 전역 상태·숨은 의존성·순환 참조 금지. 입출력은 명시적 인자/반환값으로만.
8. **스파게티 우회 금지** — 기존 스파게티에 덧씌우지 말 것. 수술 범위를 먼저 제안하고 사용자 승인 후 진행.

## 현실 비유: "국수 가닥과 주방 동선"

좋은 코드는 잘 정돈된 주방과 같다. 도마는 채소용, 고기용이 분리되어 있고(단일 책임), 냉장고·싱크대·가스레인지가 삼각 동선으로 짧게 연결된다(낮은 결합도, 중첩 제한). 반면 스파게티 코드는 **좁은 주방에 국수 가닥이 사방으로 늘어진 상태**다. 한 줄기를 당기면 옆 접시가 엎어지고, 새 요리를 놓을 자리조차 없다.

"Early Return"은 **주방 입구에서 상한 재료를 미리 돌려보내는 것**에 가깝다. 일단 다 들여와서 냄비 앞에서 검수하면 도마·싱크대·칼까지 전부 오염되지만, 문 앞에서 걸러내면 본 조리 공간은 깨끗하다.

## 결과

- 글로벌 CLAUDE.md: 필수 원칙 7번 신설 + 기존 8~11번으로 재배치.
- 프로젝트 CLAUDE.md: Coding Principles 섹션 신설 (15줄 추가).
- 본 커밋에는 프로젝트 CLAUDE.md 변경분만 포함됨 (글로벌 파일은 Git 추적 밖).

## 참조

- [How to Avoid Writing Spaghetti Code — Codefinity](https://codefinity.com/blog/How-to-Avoid-Writing-Spaghetti-Code)
- [Single-responsibility principle — Wikipedia](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- [Cyclomatic complexity — Wikipedia](https://en.wikipedia.org/wiki/Cyclomatic_complexity)
- [Minimize nesting — Wikibooks](https://en.wikibooks.org/wiki/Computer_Programming/Coding_Style/Minimize_nesting)
