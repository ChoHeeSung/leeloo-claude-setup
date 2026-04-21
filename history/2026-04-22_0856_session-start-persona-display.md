# 세션 시작 시 활성 페르소나 표시 (leeloo-kit v3.4.0)

- **날짜**: 2026-04-22 08:56 (KST)
- **대상 플러그인**: leeloo-kit 3.3.0 → 3.4.0 (minor bump — 신규 기능)

## 지시 요약

사용자: "세션 시작할 때 현재 주입된 페르소나의 간략한 요약도 함께 보여줬으면 좋겠는데"

이어서 "플러그인 버전 변경해야 다른 데서 업데이트할 수 있는 거 아닌가?" 지적에 따라 버전 범프 포함.

## 작업 내용

### 1. `leeloo-kit/scripts/session-start.js`

- `loadActivePersona()` 함수 신설
  - `.claude/settings.local.json` 에서 `outputStyle` 필드 추출
  - 값이 있으면 `.claude/output-styles/<name>.md` 읽어 프론트매터 `description` 추출
  - description은 120자 초과 시 말줄임
  - 파일이 없으면 `{ name, orphan: true }` 반환
- 메인 흐름 4단계로 삽입: 이전 세션 요약(→5) 앞, gemini-cli 안내(3) 뒤
  - 활성 페르소나 있음: `페르소나: <name> — <description>`
  - Orphan: `페르소나: <name> (파일 없음 — /lk-persona list 확인)`
  - 없음: 메시지 미출력 (조용한 skip)
- 기존 단계 번호 주석 4~7 → 5~8 재번호

### 2. 버전 동기화

- `leeloo-kit/plugin.json`: `3.3.0` → `3.4.0`
- `.claude-plugin/marketplace.json` leeloo-kit 항목: `3.3.0` → `3.4.0`
- `CLAUDE.md` Plugins 섹션: `leeloo-kit (v3.3.0)` → `(v3.4.0)`

## 검증

임시 디렉토리 3 케이스 실측:

```
# case 1: 정상
{"systemMessage":"leeloo-kit v3.4.0\n페르소나: senior-dev — 15년차 시니어 백엔드 엔지니어 멘토. 왜/대안/리스크 함께 제시"}

# case 2: orphan
{"systemMessage":"leeloo-kit v3.4.0\n페르소나: senior-dev (파일 없음 — /lk-persona list 확인)"}

# case 3: 페르소나 없음
{"systemMessage":"leeloo-kit v3.4.0 세션 시작"}
```

## 현실 비유 — 왜 "프론트매터 description" 한 줄인가

책장에서 책을 꺼낼 때 모든 챕터를 다 읽고 파악하지 않고, 책등(spine)의 제목만 보고 어떤 책인지 알아봅니다. 페르소나 파일의 프론트매터 `description`이 바로 그 책등 역할입니다. 본문 전체를 파싱해 "정체성 섹션 첫 문장"을 뽑는 방식도 가능했지만, 사용자가 페르소나 생성 시 이미 `description`에 "정체성 요약 + 핵심 키워드"를 압축해 넣도록 설계돼 있어 중복 가공은 불필요했습니다.

## 영향 범위

- 단일 훅 스크립트(`session-start.js`)에 함수 1개 + 호출부 7줄 추가
- 하위 호환성 OK — 페르소나 미설정 환경에서는 출력 차이 없음
- 버전 범프로 마켓플레이스 업데이트 감지 가능
