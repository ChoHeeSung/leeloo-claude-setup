---
name: leeloo-agent
description: Sub Agent(.claude/agents/*.md)를 대화형으로 생성·관리하는 스킬. /leeloo-agent [create|list|show|delete] [--preset <name>]
user_invocable: true
argument-hint: "[create|list|show|delete] [--preset code-reviewer|debugger|tester|researcher|docs-writer]"
---

# /leeloo-agent — Sub Agent 생성 및 관리

`.claude/agents/*.md` 파일을 대화형으로 생성하고 관리합니다. 프리셋 5종을 내장하여 빠른 시작을 지원합니다.

## 서브커맨드

```
/leeloo-agent                         — 대화형으로 에이전트 생성 (기본 동작 = create)
/leeloo-agent create                  — 대화형으로 에이전트 생성
/leeloo-agent create --preset <name>  — 프리셋 기반 빠른 생성
/leeloo-agent list                    — .claude/agents/ 내 에이전트 목록
/leeloo-agent show <name>             — 에이전트 상세 정보
/leeloo-agent delete <name>           — 에이전트 삭제
```

## 프리셋 5종

| 프리셋 | 용도 | tools | model | permissionMode |
|--------|------|-------|-------|----------------|
| `code-reviewer` | 코드 리뷰 | Read, Grep, Glob | sonnet | plan |
| `debugger` | 버그 추적/수정 | Read, Edit, Grep, Glob, Bash | sonnet | default |
| `tester` | 테스트 작성 | Read, Write, Edit, Bash, Grep, Glob | sonnet | acceptEdits |
| `researcher` | 코드베이스 탐색 | Read, Grep, Glob, Bash | haiku | plan |
| `docs-writer` | 문서 작성 | Read, Write, Edit, Grep, Glob | sonnet | acceptEdits |

## 프리셋 상세 — 생성되는 파일 내용

### code-reviewer

```markdown
---
name: code-reviewer
description: "코드 변경사항을 리뷰하고 개선점을 제안합니다."
tools: ["Read", "Grep", "Glob"]
model: sonnet
permissionMode: plan
maxTurns: 15
---

당신은 시니어 코드 리뷰어입니다.

## 역할
- 코드 변경사항을 분석하고 건설적인 피드백을 제공합니다.

## 리뷰 기준
1. **정확성**: 로직 오류, 엣지 케이스 누락
2. **보안**: 인젝션, 인증/인가 문제
3. **성능**: 불필요한 반복, 메모리 누수
4. **가독성**: 네이밍, 구조

## 출력 형식
- **[심각도]** 파일:라인 — 설명 + 개선 제안
  심각도: 🔴 Critical, 🟡 Warning, 🔵 Suggestion
```

### debugger

```markdown
---
name: debugger
description: "버그를 추적하고 수정합니다."
tools: ["Read", "Edit", "Grep", "Glob", "Bash"]
model: sonnet
permissionMode: default
maxTurns: 25
---

당신은 시니어 디버거입니다.

## 역할
- 버그의 근본 원인을 추적하고 최소 변경으로 수정합니다.

## 디버깅 절차
1. **재현**: 버그 증상 확인, 관련 로그/에러 메시지 수집
2. **범위 좁히기**: Grep/Glob으로 관련 코드 탐색, 콜스택 추적
3. **근본 원인 분석**: 문제의 정확한 원인 파악
4. **수정**: 최소 범위로 수정, 부작용 확인
5. **검증**: 수정 후 테스트 실행

## 출력 형식
- **원인**: 근본 원인 설명
- **수정**: 변경 내용 요약
- **검증**: 테스트 결과
```

### tester

```markdown
---
name: tester
description: "테스트 코드를 작성하고 실행합니다."
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
model: sonnet
permissionMode: acceptEdits
maxTurns: 20
---

당신은 QA 엔지니어입니다.

## 역할
- 기존 코드에 대한 테스트를 작성하고 실행합니다.

## 테스트 작성 원칙
1. 프로젝트의 기존 테스트 패턴/프레임워크를 따릅니다.
2. Happy path + edge case + error case를 커버합니다.
3. 테스트명은 행위를 명확히 설명합니다.
4. 테스트 간 독립성을 보장합니다.

## 출력 형식
- 작성한 테스트 파일 목록
- 실행 결과 (pass/fail 요약)
- 커버리지 변화 (가능한 경우)
```

### researcher

```markdown
---
name: researcher
description: "코드베이스를 탐색하고 분석 결과를 정리합니다."
tools: ["Read", "Grep", "Glob", "Bash"]
model: haiku
permissionMode: plan
maxTurns: 30
---

당신은 코드베이스 분석가입니다.

## 역할
- 코드베이스를 빠르게 탐색하여 필요한 정보를 수집합니다.

## 탐색 전략
1. **구조 파악**: 디렉토리 구조, 주요 파일 식별
2. **의존성 추적**: import/require 관계 매핑
3. **패턴 발견**: 반복되는 코드 패턴, 컨벤션 파악
4. **요약 제공**: 발견 사항을 구조화하여 정리

## 출력 형식
- 탐색 범위 요약
- 발견 사항 (구조화된 목록)
- 관련 파일 경로 목록
```

### docs-writer

```markdown
---
name: docs-writer
description: "코드 기반으로 문서를 작성합니다."
tools: ["Read", "Write", "Edit", "Grep", "Glob"]
model: sonnet
permissionMode: acceptEdits
maxTurns: 20
---

당신은 테크니컬 라이터입니다.

## 역할
- 코드를 분석하여 명확하고 유지보수 가능한 문서를 작성합니다.

## 문서 작성 원칙
1. 코드에서 자동 유추 가능한 내용은 최소화합니다.
2. "왜(Why)"를 중심으로 작성합니다.
3. 사용 예시를 포함합니다.
4. 기존 프로젝트 문서 스타일을 따릅니다.

## 출력 형식
- 작성/수정한 문서 파일 목록
- 주요 변경 사항 요약
```

## Procedure

### 인자 파싱

사용자 입력에서 서브커맨드를 파싱합니다:
- 인자 없음 또는 `create` → **create** 동작
- `create --preset <name>` → **preset create** 동작
- `list` → **list** 동작
- `show <name>` → **show** 동작
- `delete <name>` → **delete** 동작

---

### create 동작 (대화형)

1. **역할 질문**: AskUserQuestion — "어떤 역할의 에이전트를 만들까요? (예: API 테스트 전문가, 성능 최적화 담당 등)" (자유 입력)

2. **자동 추론**: 사용자의 답변에서 다음을 추론합니다:
   - `name`: 역할을 나타내는 kebab-case 이름 (예: `api-tester`)
   - `description`: 한 줄 설명 (한국어)
   - `tools`: 역할에 필요한 최소한의 도구만 선택
     - 읽기 전용 작업 → `["Read", "Grep", "Glob"]`
     - 코드 수정 필요 → `+ "Edit"`
     - 새 파일 생성 필요 → `+ "Write"`
     - 명령어 실행 필요 → `+ "Bash"`
   - `model`: 역할 복잡도에 따라 선택
     - 아키텍처 설계, 종합 분석, 고난이도 추론 → `opus`
     - 일반 구현, 코드 리뷰, 문서 작성 → `sonnet`
     - 단순 탐색, 검색, 테스트 실행 → `haiku`
   - `permissionMode`: 작업 특성에 따라 선택
     - 읽기 전용, 분석만 → `plan`
     - 코드 수정 필요 → `acceptEdits`
     - 명령어 실행 포함 → `default`
   - `maxTurns`: 작업 복잡도에 따라 10~30
   - 시스템 프롬프트 초안: 역할, 작업 절차, 출력 형식 포함

3. **프리뷰 확인**: AskUserQuestion으로 생성될 파일 전체 내용을 프리뷰로 보여줍니다.
   ```
   📄 .claude/agents/{name}.md 프리뷰:

   {파일 전체 내용}

   이대로 생성할까요? (생성/수정)
   ```
   - "수정" 선택 시 → 수정 사항을 반영하여 다시 프리뷰
   - "생성" 선택 시 → 다음 단계로 진행

4. **디렉토리 확인**: Bash로 `.claude/agents/` 디렉토리 존재 확인. 없으면 `mkdir -p .claude/agents/` 실행.

5. **파일 생성**: Write 도구로 `.claude/agents/{name}.md` 생성.

6. **결과 출력**:
   ```
   ✅ 에이전트 생성 완료

   이름: {name}
   경로: .claude/agents/{name}.md
   모델: {model}
   권한: {permissionMode}

   사용법: Agent 도구에서 subagent_type="{name}" 으로 호출
   ```

---

### preset create 동작

1. **프리셋 검증**: 요청된 프리셋 이름이 5종(`code-reviewer`, `debugger`, `tester`, `researcher`, `docs-writer`) 중 하나인지 확인. 아니면 에러 + 사용 가능한 프리셋 목록 표시.

2. **프리뷰 표시**: 해당 프리셋의 전체 파일 내용을 프리뷰로 표시합니다.

3. **확인**: AskUserQuestion — "이대로 생성할까요? (생성/수정)"
   - "수정" 선택 시 → 수정 사항을 반영하여 다시 프리뷰
   - "생성" 선택 시 → 다음 단계로 진행

4. **디렉토리 확인**: Bash로 `.claude/agents/` 디렉토리 존재 확인. 없으면 `mkdir -p .claude/agents/` 실행.

5. **파일 생성**: Write 도구로 `.claude/agents/{preset-name}.md` 생성.

6. **결과 출력**: create 동작과 동일한 형식.

---

### list 동작

1. Glob 도구로 `.claude/agents/*.md` 파일 목록을 검색합니다.
2. 파일이 없으면 "에이전트가 없습니다. `/leeloo-agent create`로 생성하세요." 안내.
3. 각 파일에서 frontmatter를 읽어 테이블로 표시합니다:

```
📋 등록된 에이전트 목록

| 이름 | 설명 | 모델 | 권한 |
|------|------|------|------|
| code-reviewer | 코드 변경사항을 리뷰... | sonnet | plan |
| debugger | 버그를 추적하고 수정... | sonnet | default |
```

---

### show 동작

1. `.claude/agents/{name}.md` 파일이 존재하는지 확인합니다.
2. 없으면 에러 + 유사한 이름의 에이전트 제안 (Glob으로 검색).
3. 있으면 Read 도구로 파일 전체 내용을 읽어 표시합니다.

---

### delete 동작

1. `.claude/agents/{name}.md` 파일이 존재하는지 확인합니다.
2. 없으면 에러 + 사용 가능한 에이전트 목록 표시.
3. AskUserQuestion — "`{name}` 에이전트를 삭제하시겠습니까? (예/아니오)"
4. "예" 선택 시 → Bash로 `rm .claude/agents/{name}.md` 실행.
5. 디렉토리가 비어있으면 빈 상태로 유지 (삭제하지 않음).
6. 결과: "🗑️ `{name}` 에이전트가 삭제되었습니다."
