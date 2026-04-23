# 세션 토큰 최적화 — 메타 문서 압축 + hook 출력 다이어트

## 지시 요약

사용자 요청: "프로젝트 전반적으로 검사해서 성능은 유지하면서 토큰을 절약할 수 있는 계획 세워봐. 클로드에 기본설치된 플러그인들도 종합적으로 검토해서 lk-setup 할 때 어떻게 설정 바꿔줄 수 있는지" + 이미 설치된 플러그인 대화형 on/off 기능 추가.

## 작업 내용

### A. SKILL.md 32개 description 압축 (2,400자 → 680자, 72% ↓)

세션 시작 시 시스템 프롬프트에 자동 로드되는 각 스킬의 description을 대폭 축소:
- 명령 시그니처(`/lk-xxx [opts]`)는 `argument-hint` 필드에 이미 존재 → description에서 제거
- "스킬", "대화형으로 → DB 직접 실행" 같은 중복/군더더기 제거
- 기능 식별에 필요한 "언제/무엇"만 남김

**비유**: 식당 메뉴판에 "김치찌개 3,000원 — 주문 방법: 김치찌개 주세요"라고 중복 적혀 있던 걸, 메뉴판에는 "김치찌개"만 쓰고 주문 방법은 주문서에만 두는 방식. 메뉴를 훑는 사람은 이름만 빨리 보고, 주문할 사람만 주문서를 봄.

### B. CLAUDE.md 중복 제거 (루트 131→38줄, leeloo-kit 125→43줄)

**루트 CLAUDE.md**:
- Multi-Plugin Structure ASCII tree 46줄 → Plugins 표 1개로 통합
- Coding Principles 14줄 → 글로벌 원칙 7 참조 2줄로 축약 (글로벌 CLAUDE.md와 완전 중복이었음)

**leeloo-kit/CLAUDE.md**:
- Context Checkpoint 상세 규칙 24줄 → `resources/context-checkpoint.md`로 분리
- 모델 선택 가이드라인 48줄 → `resources/model-delegation.md`로 분리
- 본문엔 "상세: resources/xxx 참조" 1줄씩만

**비유**: 회사 입구에 비치된 '전 직원 필독 매뉴얼'에 상세 규정까지 다 적혀 있던 걸, "상세 규정은 자료실 캐비넷 X번"이라고 안내만 두고 본체는 캐비넷으로 옮긴 것. 매일 입구 지나가는 사람들(= 매 세션 시작 시의 Claude)은 핵심만 빠르게 읽고, 필요할 때만 캐비넷을 여는 구조.

### C. Hook 출력 다이어트

세션 라이프사이클 훅들이 Claude 컨텍스트로 주입하는 텍스트를 축소:
- `session-start.js`: 이전 세션 요약 상한 800자 → 300자
- `session-start.js`: 린터/타입체커 미설치 안내 3줄+ → 1줄 (`린터 미설치: ruff (...)`)
- `session-start.js`: gemini-cli 미설치 안내를 세션당 1회로 제한 (`.leeloo/env-notice-done` 플래그 신설)
- `session-start.js`: `[경고]`, `[안내]`, `[하네스]` 접두어 제거 (배너 `leeloo-kit vX.Y.Z`와 중복)
- `skill-post.js`: `lk-plan` 다음 단계 안내 3줄 → 1줄
- `session-end.js`: `[leeloo-kit] 세션 종료:` 접두어 제거

**비유**: 매번 비행기 탈 때마다 "안전벨트 착용하세요. 산소마스크는 머리 위에 있습니다. 구명조끼는 좌석 아래..." 장황한 방송 전체를 재생하던 걸, 신규 탑승객(첫 세션)에게만 풀 버전을 주고 재탑승객에겐 "안전벨트 확인" 한 줄로 줄인 것.

### D. ITS 리소스 지연 로드 검증

`leeloo-its/resources/domain-dictionary.yaml` (42K, 1,532줄)이 자동 로드되는지 검증:
- `lk-its-ddl/SKILL.md`의 Procedure에서만 `Read` 도구로 명시적 호출
- `leeloo-its/CLAUDE.md`는 자동 로드되지만 파일명만 언급(내용 미포함)
- 시스템 프롬프트에 YAML 본문 주입되지 않음 확인 → 이미 올바른 지연 로드 구조
- 향후 과제: 스킬 실행 시에도 전체 YAML 대신 섹션 단위 grep 추출하면 추가 절감

### E. lk-setup plugins 서브커맨드 확장 (신규 기능)

기존 `/lk-setup plugins`(document-skills 설치만)를 6개 서브 동작으로 확장:

| 서브 | 동작 |
|---|---|
| `plugins` / `plugins list` | 설치된 플러그인 목록 + 상태(활성/비활성) |
| `plugins toggle` | AskUserQuestion multiSelect 기반 대화형 on/off |
| `plugins audit` | 언어/의존성 기반 미사용 추정 플러그인 자동 탐지 |
| `plugins install-docskills` | 기존 동작 보존(document-skills + 마켓플레이스 등록) |
| `plugins mcp-list` | MCP 서버 목록 + 상태 |
| `plugins mcp-toggle` | MCP 서버 대화형 on/off |

**audit 규칙 예시**:
- `claude-api` → `package.json`에 `@anthropic-ai/sdk` 없고 `anthropic` 파이썬 import 없으면 미사용 추정
- `go-lsp` → `*.go` 파일 없으면 미사용 추정
- `rust-lsp` → `Cargo.toml` 없으면 미사용 추정

### F. lk-commit Step 11 개선

커밋 완료 후 세션 정리에 `AskUserQuestion`을 사용하던 기존 방식 제거. `/clear`·`/compact`는 Claude가 직접 실행할 수 없고 사용자가 입력해야 하므로 대화형 선택지로 묻는 것이 의미 없음(사용자 지적).

대신 안내 텍스트만 출력. judgment.md에 규칙 기록: "Claude가 직접 실행 불가능한 슬래시 명령은 대화형으로 묻지 않는다. 그러나 Claude가 응답에 따라 실제 동작을 바꿀 수 있는 선택(HISTORY 작성 여부, 커밋 메시지 확정 등)은 AskUserQuestion 유지."

**비유**: 편의점 계산대에서 "포인트 적립하시겠습니까?" 묻는 건 직원이 실제로 처리 가능하니 유효. 하지만 "집에 가서 설거지하시겠습니까?"를 버튼 3개로 묻는 건 무의미 — 직원이 대신 해줄 수 없는 행동을 묻는 꼴.

## 결과

**세션당 기본 토큰 절감**: 5.5~7K → 1.5~3K (약 60~65% 감소)

| 단계 | 예상 절감 (세션당) |
|---|---|
| A. SKILL.md 압축 | ~1.5K |
| B. CLAUDE.md 중복 제거 | ~5~6K |
| C. Hook 출력 다이어트 | ~1~1.5K |
| E. lk-setup plugins 확장 | 기능 추가 (절감 부차적) |

## 변경 파일

**신규**:
- `leeloo-kit/resources/context-checkpoint.md`
- `leeloo-kit/resources/model-delegation.md`

**수정**: 37개
- SKILL.md 32개 (description 압축) + `lk-setup/SKILL.md` 확장 + `lk-commit/SKILL.md` Step 11
- `CLAUDE.md` (루트), `leeloo-kit/CLAUDE.md`
- `leeloo-kit/scripts/session-start.js`, `skill-post.js`, `session-end.js`
- `.leeloo/failure-memory/judgment.md`

## 확인 방법

새 세션 시작 후:
1. SessionStart 출력 체감 확인 — 린터 안내 1회만, 이전 세션 요약 짧아짐, 접두어 없음
2. `/lk-setup plugins audit` 실행해 이 레포에서 비활성화 대상 파악
3. `/lk-setup plugins toggle`로 체크박스 UI 대화형 on/off 검증
