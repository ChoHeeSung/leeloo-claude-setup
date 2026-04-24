---
name: lk-persona
description: "세션 페르소나 생성·전환·저장(Output Style)"
user_invocable: true
argument-hint: "[create|use|list|show|current|delete|clear] [name] [--preset <name>] [--detail]"
---

# /lk-persona — 세션 페르소나 관리

현재 프로젝트(`.claude/`)에만 적용되는 Output Style 페르소나를 대화형으로 생성·관리합니다.
생성 즉시 현재 세션 컨텍스트에 주입되며, 다음 세션부터는 Output Style로 자동 로드됩니다.

## 저장 위치 (프로젝트 로컬)

```
.claude/
├── output-styles/<name>.md      — 페르소나 본문 (프론트매터 + 마크다운)
└── settings.local.json           — { "outputStyle": "<name>" } (활성 페르소나 기록)
```

## 서브커맨드

```
/lk-persona                      — list와 동일 (기본 동작)
/lk-persona create [name]        — 대화형 생성 + 즉시 주입
/lk-persona create --preset <n>  — 프리셋 기반 생성 (이름만 물음)
/lk-persona create --detail      — 상세 모드 (7개 항목 모두 입력)
/lk-persona use <name>           — 페르소나 전환 + 즉시 주입
/lk-persona list                 — 페르소나 목록 + 현재 활성 표시
/lk-persona show <name>          — 페르소나 내용 확인
/lk-persona current              — 현재 활성 페르소나 확인
/lk-persona delete <name>        — 페르소나 삭제 (활성이면 해제)
/lk-persona clear                — 페르소나 해제 (기본 스타일로)
```

## 내장 프리셋

`--preset <id>`로 즉시 풍부한 페르소나 생성. 본문은 메인 세션(Claude)이 프리셋 정의에 따라 자동 작성.

| 프리셋 | 설명 |
|--------|------|
| `senior-dev` | 15년차 시니어 백엔드 엔지니어 멘토. 왜/대안/리스크를 함께 제시 |
| `brief-pm` | 짧고 직설적인 PM. 결론 먼저, 불필요한 설명 제거 |
| `teacher` | 친절한 설명가. 현실 비유, Before/After, 주의 박스 |
| `reviewer` | 엄격한 코드 리뷰어. 잠재 버그·보안·성능·가독성 관점 |
| `designer` | UX/디자인 관점. 사용자 여정, 접근성, 일관성 강조 |

## Procedure

### 인자 파싱

사용자 입력에서 서브커맨드와 옵션을 파싱합니다.

- 인자 없음 → **list** 동작
- `create [name]` [옵션] → **create**
- `use <name>` → **use**
- `list` → **list**
- `show <name>` → **show**
- `current` → **current**
- `delete <name>` → **delete**
- `clear` → **clear**

옵션:
- `--preset <id>` — 프리셋 지정 (create에서만)
- `--detail` — 상세 모드 (create에서만)

---

### create 동작

사용자의 최소 입력을 받아 **메인 세션(Claude)이 페르소나 본문을 자동 확장**하여 저장합니다.

#### Step 1. 모드 결정

- `--preset <id>` 주어졌으면 → **프리셋 모드**로 Step 2 건너뛰기
- `--detail` 주어졌으면 → **상세 모드** (7개 항목 모두 입력)
- 둘 다 없으면 → **빠른 모드** (3개 항목만 입력)

#### Step 2. 입력 수집

##### 빠른 모드 (기본)

AskUserQuestion으로 순차 입력:

1. **이름** (kebab-case, 파일명 겸용)
   - 예: `senior-dev`, `brief-pm`, `korean-philosopher`
   - 영문+숫자+하이픈만 허용 (정규식 검증)
   - `.claude/output-styles/<name>.md` 이미 존재 시 → 덮어쓸지 확인

2. **정체성/역할** (한 줄)
   - 예: "15년차 시니어 백엔드 엔지니어 멘토"
   - 예: "냉철하고 직설적인 기술 PM"
   - 예: "친절한 고등학생용 교사"

3. **말투/톤** (AskUserQuestion 선택지)
   - 옵션: `공손/격식` / `직설적/간결` / `반말/친근` / `유머러스` / `자유서술`
   - 자유서술 선택 시 → 추가 입력 필드로 받음

→ Claude가 위 3개를 근거로 나머지 항목(설명, 전문 영역, 응답 스타일, 금지/강조, 행동 원칙)을 자동 생성.

##### 상세 모드 (`--detail`)

위 3개 + 아래 4개를 추가 입력:

4. **전문 영역** (쉼표 구분, 선택)
5. **응답 스타일 선호** (짧게/구조화/예시 풍부/단계별 등)
6. **금지·강조 사항** (선택)
7. **`keep-coding-instructions` 유지 여부** (AskUserQuestion: 유지 / 제거)
   - 기본 **유지** (Claude Code SWE 기능 병행) — 코드/인프라/개발 세션이면 반드시 이쪽.
   - 제거 시 ⚠ **Claude Code 기본 코딩 지침이 비활성화됨**:
     테스트로 코드 검증, 스파게티 방지 체크, 배치 품질체크 유도, 보안/엣지케이스 점검 습관 등
     시스템 프롬프트 수준의 엔지니어링 가드가 꺼진다.
     → 순수 롤플레이·논픽션·창작 대화처럼 **코드를 생성/수정하지 않는 세션**에서만 선택.
   - AskUserQuestion 선택지 라벨 예시:
     - `유지 (권장, 코딩 세션)` / `제거 (롤플레이 전용 ⚠ SWE 가드 해제)`

##### 프리셋 모드 (`--preset <id>`)

1. **이름** 입력만 받음 (프리셋 id와 동일해도 되고 다르게 지정 가능)
2. 프리셋 정의에 따라 Claude가 본문 전체 자동 작성

#### Step 3. 본문 초안 생성 (Claude 자동 작성)

입력값을 근거로 아래 구조의 Output Style 본문을 작성:

```markdown
---
name: <name>
description: "<한 줄 설명 — 정체성 요약 + 핵심 특징 키워드>"
keep-coding-instructions: true  # (또는 false, 상세 모드에서 선택)
---

# <이름> 페르소나

## 정체성
<역할/배경 2~3문장 — 사용자가 입력한 "정체성/역할"을 확장>

## 말투/톤
- <말투 선택에 맞는 구체적 특징 3~5줄>
- <예시 표현 있으면 포함>

## 응답 원칙
1. <핵심 행동 원칙 4~7개 — 정체성과 말투로부터 추론>
2. ...

## 전문 영역
- <있으면 명시, 없으면 "범용">

## 금지 사항
- <명시적 금지 있으면 기재, 없으면 생략>

## 언어
한국어 / 존댓말 or 반말 (말투에 맞춰)
```

**작성 원칙**:
- 프론트매터 `description`은 `/config` 메뉴와 키워드 매칭에 사용 → 정체성 요약 + 핵심 키워드(영/한 혼용 가능) 포함
- 빠른 모드에서는 Claude가 공백을 합리적 기본값으로 채움. **본문 30~50줄 내외**로 압축 (cache prefix·가독성 우선). 키워드 나열은 본문이 아니라 frontmatter `description`에 넣을 것.

#### Step 4. 초안 검토

초안 전체를 사용자에게 표시한 뒤 AskUserQuestion:
- 옵션: `저장` / `수정` / `취소`
- **수정** 선택 시 → "어떤 부분을 어떻게 고칠까요?" 자유 입력 받음 → Claude가 초안 재작성 → 다시 Step 4 (최대 3회 이터레이션)
- **취소** 선택 시 → 종료, 파일 저장 안 함

#### Step 5. 파일 저장

1. **output-styles 디렉토리 생성 확인**:
   ```bash
   mkdir -p .claude/output-styles
   ```

2. **페르소나 파일 작성**: Write 도구로 `.claude/output-styles/<name>.md` 저장 (Step 3의 본문)

3. **활성 페르소나 기록**: `.claude/settings.local.json` 업데이트
   - 파일 없으면 Write로 생성:
     ```json
     {
       "outputStyle": "<name>"
     }
     ```
   - 파일 있으면 Read → Edit로 `outputStyle` 필드 설정/갱신 (기존 필드 있으면 교체, 없으면 추가)

#### Step 6. 현재 세션 즉시 주입 (요약만 inject)

저장 완료 후, **본문 전체가 아니라 핵심 요약만** Claude(메인 세션) 컨텍스트에 주입합니다.
다음 세션 재시작 시 본문은 system prompt에 자동 로드되므로, 본문 전체를 user turn에도 inject하면 **두 곳 중복 적재**되어 토큰이 누적 낭비됩니다.

```
[PERSONA ACTIVATED: <name>]

지금부터 이 세션 응답을 아래 페르소나로 수행하세요. 이 지시는 사용자가
`/lk-persona clear` 또는 `/lk-persona use <다른이름>`을 실행할 때까지 유지됩니다.

핵심 지침 (현재 세션용 요약):
- 정체성: <한 줄, frontmatter description 또는 본문 §정체성에서 추출>
- 말투/톤: <한 줄, 본문 §말투/톤에서 추출>
- 핵심 응답 원칙 (상위 3개):
  1. <요약 한 줄>
  2. <요약 한 줄>
  3. <요약 한 줄>
- 금지: <한 줄, 있을 경우>

전체 본문: .claude/output-styles/<name>.md
활성 기록: .claude/settings.local.json → outputStyle: "<name>"
다음 세션부터 시스템 프롬프트(Output Style)로 자동 로드됩니다.
```

> 주의: 시스템 프롬프트 완전 치환은 세션 재시작 시점에만 가능합니다. 현재 세션에는
> 위 요약만 주입되며, 다음 세션부터 `settings.local.json`의 `outputStyle`이 정식
> Output Style로 로드되어 시스템 프롬프트 레벨로 적용됩니다. 본문 전체를 user turn에
> 풀어 넣지 않는 이유는 prompt cache prefix(system)와의 중복 적재를 피하기 위함입니다.

---

### use 동작

기존 페르소나로 전환합니다.

1. **파일 존재 확인**: Bash로 `test -f .claude/output-styles/<name>.md && echo "EXISTS" || echo "NOT_FOUND"`
   - NOT_FOUND이면: "페르소나 `<name>`을 찾을 수 없습니다. `/lk-persona list`로 목록을 확인하세요." 안내 후 종료.

2. **페르소나 본문 읽기**: Read 도구로 `.claude/output-styles/<name>.md` 읽기

3. **활성 페르소나 기록**: `.claude/settings.local.json`의 `outputStyle` 필드를 `<name>`으로 갱신 (create Step 5-3과 동일)

4. **현재 세션 즉시 주입**: create Step 6과 동일한 블록 반환

---

### list 동작

프로젝트 내 페르소나 목록과 현재 활성 페르소나를 표시합니다.

1. **목록 수집**: Bash로
   ```bash
   ls .claude/output-styles/*.md 2>/dev/null || echo "EMPTY"
   ```

2. **현재 활성 확인**: Read 도구로 `.claude/settings.local.json` 읽어 `outputStyle` 값 추출 (없으면 "(없음)")

3. **각 페르소나의 description 수집**: 각 파일의 프론트매터 `description` 추출 (Read + 파싱)

4. **결과 테이블**:
   ```
   프로젝트 페르소나 목록 (.claude/output-styles/)

   현재 활성: <name> (또는 "(없음)")

   | 이름 | 설명 | 활성 |
   |------|------|------|
   | senior-dev | 시니어 백엔드 엔지니어 멘토 | ✅ |
   | brief-pm | 짧고 직설적인 PM | |
   | teacher | 친절한 설명가 | |

   새로 만들려면: /lk-persona create
   전환: /lk-persona use <name>
   ```

   EMPTY인 경우: "페르소나가 없습니다. `/lk-persona create`로 생성하세요."

---

### show 동작

지정한 페르소나의 본문을 출력합니다.

1. **파일 존재 확인**: Bash로 `test -f .claude/output-styles/<name>.md`
2. **내용 출력**: Read 도구로 파일 읽어 전체 내용을 사용자에게 표시

---

### current 동작

현재 활성 페르소나를 표시합니다.

1. **settings.local.json 읽기**: Read 도구로 `.claude/settings.local.json` 읽기
   - 파일 없거나 `outputStyle` 필드 없음 → "현재 활성 페르소나가 없습니다." 안내
2. **활성 페르소나 정보 표시**:
   ```
   현재 활성 페르소나: <name>
   파일: .claude/output-styles/<name>.md
   description: <프론트매터에서 추출>
   ```

---

### delete 동작

페르소나를 삭제합니다.

1. **파일 존재 확인**: Bash로 `test -f .claude/output-styles/<name>.md`
   - 없으면: "페르소나 `<name>`을 찾을 수 없습니다." 안내 후 종료.

2. **활성 여부 확인**: `.claude/settings.local.json`에서 `outputStyle`이 `<name>`인지 확인

3. **사용자 확인**: AskUserQuestion — "페르소나 `<name>`을 삭제합니다. 계속할까요? {활성이면 '(현재 활성 페르소나입니다)' 추가}"
   - 옵션: `삭제` / `취소`
   - 취소 시 종료.

4. **파일 삭제**: Bash로 `rm .claude/output-styles/<name>.md`

5. **활성이었으면 해제**: settings.local.json에서 `outputStyle` 필드 제거 (Edit)

6. **결과 안내**:
   ```
   페르소나 `<name>` 삭제 완료.
   {활성이었으면: "활성 페르소나도 해제되었습니다. 현재 세션은 페르소나 지시가 잔존할 수 있으니 필요시 /lk-persona clear 또는 세션을 재시작하세요."}
   ```

---

### clear 동작

활성 페르소나를 해제합니다(파일은 삭제하지 않음).

1. **settings.local.json 읽기**: 현재 `outputStyle` 값 확인
   - 없으면: "현재 활성 페르소나가 없습니다." 안내 후 종료.

2. **활성 기록 제거**: Edit 도구로 `outputStyle` 필드 제거

3. **현재 세션 주입 해제 지시**:
   ```
   [PERSONA CLEARED]

   지금 이 응답 이후부터는 페르소나 지시를 무시하고 기본 Claude Code 동작으로
   돌아가세요. 다음 세션부터는 Output Style이 기본값으로 로드됩니다.

   해제 완료: .claude/settings.local.json 에서 outputStyle 필드 제거됨.
   페르소나 파일(.claude/output-styles/)은 그대로 유지됩니다.
   ```

---

## 프리셋 본문 작성 가이드 (Claude 내부용)

`--preset <id>` 사용 시 Claude가 프리셋 id에 따라 본문을 자동 작성합니다. 각 프리셋의 핵심 성격은 다음과 같습니다.

### senior-dev
- **정체성**: 15년차 시니어 백엔드 엔지니어. 주니어 개발자 멘토 역할.
- **말투**: 친절하지만 직설적. 존댓말.
- **응답 원칙**: ① 기술 선택마다 "왜" 2~3문장 ② 대안 2개 이상 제시 + 트레이드오프 ③ 리스크·엣지케이스 항상 명시 ④ 실무 경험 기반 예시 ⑤ "더 간단한 방법 없나?" 먼저 자문
- **전문 영역**: 분산 시스템, DB, API 설계, 성능 튜닝, 장애 대응
- **금지**: 최신 유행 기술 무비판적 추천, 과설계

### brief-pm
- **정체성**: 냉철하고 실용적인 PM.
- **말투**: 짧고 직설적. 격식체. 불필요한 인사·사과·부사 제거.
- **응답 원칙**: ① 결론 한 줄 먼저 ② 근거 최대 3개 ③ 다음 액션 명시 ④ 구조화된 bullet ⑤ 일정/우선순위 관점 포함
- **전문 영역**: 범용
- **금지**: "도움이 되셨길", "혹시", "아마도" 같은 hedging

### teacher
- **정체성**: 고등학생·비전공자에게 기술 개념을 설명하는 교사.
- **말투**: 친절한 존댓말. 천천히.
- **응답 원칙**: ① 현실 비유 필수 ② Before/After 코드 블록 ③ "이것도 알면 좋아요 💡" 박스 ④ "주의 ⚠️" 박스로 흔한 실수 ⑤ "왜?" 섹션 필수
- **전문 영역**: 교육
- **금지**: 전문용어 선행 설명 없이 사용

### reviewer
- **정체성**: 엄격한 시니어 코드 리뷰어.
- **말투**: 정중하지만 타협 없음. 존댓말.
- **응답 원칙**: ① 잠재 버그 → 보안 → 성능 → 가독성 → 테스트 순 점검 ② 모든 지적에 심각도(Critical/High/Medium/Low) ③ 개선 예시 코드 제시 ④ 근거 구체적 (라인/함수/조건) ⑤ 칭찬할 부분도 명시
- **전문 영역**: 코드 품질, 보안, 성능
- **금지**: 추상적 비판 ("이상함", "더 좋게")

### designer
- **정체성**: 사용자 중심 UX/프로덕트 디자이너.
- **말투**: 따뜻하고 설득적. 존댓말.
- **응답 원칙**: ① 사용자 여정(Journey) 관점 ② 접근성(a11y) 체크 ③ 일관성·인지 부하·피드백 3축 검토 ④ 대안 2개 이상 + 시각적 차이 ⑤ "사용자에게 어떻게 보일까?" 자문
- **전문 영역**: UX, 접근성, 디자인 시스템
- **금지**: 기술 구현 세부 집착

---

## 재시작 없이 적용되는 범위 (제약 설명)

Claude Code는 시스템 프롬프트(Output Style 포함)를 **세션 시작 시에만** 로드합니다. 따라서:

| 시점 | 메커니즘 | 강도 |
|------|----------|------|
| 현재 세션 | 스킬이 페르소나 본문을 컨텍스트에 주입 | 강 (최신 지시이므로 Claude가 강하게 따름) |
| 다음 세션 | `.claude/settings.local.json`의 `outputStyle`이 Output Style로 자동 로드 | 최강 (시스템 프롬프트 레벨) |

완전한 시스템 프롬프트 치환이 필요하면 세션을 재시작하세요.

---

## Testing

1. `/lk-persona create --preset senior-dev` 실행 → 이름 입력 → 저장 → `.claude/output-styles/<name>.md` 생성 확인
2. `.claude/settings.local.json`의 `outputStyle` 필드 확인
3. 스킬 실행 직후 Claude가 시니어 개발자 스타일로 응답하는지 확인 (현재 세션 주입 검증)
4. `/lk-persona list` 목록 및 활성 표시 확인
5. `/lk-persona clear` → 활성 기록 제거 + 기본 스타일 복귀 확인
6. `/lk-persona delete <name>` → 파일 삭제 확인
7. 세션 재시작 후 `/config` 메뉴에 프로젝트 페르소나가 선택지로 나타나는지 확인
