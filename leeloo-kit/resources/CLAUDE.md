# Claude Code 사용 원칙

## 필수 원칙 (반드시 준수)

### 1. 코드 작성 금지 원칙
- 사용자가 명시적으로 "코드를 작성하라"는 지시를 하지 않으면 절대 코드를 작성하지 않는다.
- 지시가 없을 때는 계획, 분석, 설명만 수행한다.

### 2. HISTORY.md 작성 규칙
- HISTORY.md는 작업 중 자동으로 작성하지 않는다.
- `/lk-commit` 실행 시 커밋 전에 "HISTORY.md 작성 여부"를 사용자에게 확인한 후, 승인 시에만 작성한다.
- **HISTORY.md** (프로젝트 루트): 날짜/시/분 + 작업 요약 + 상세 파일 참조 경로만 기록한다.
- **history/ 폴더**: 세부 내용은 `{YYYY-MM-DD}_{HHMM}_{제목}.md` 형식으로 저장한다.

### 3. 현실 비유 설명
- history/ 상세 파일에 복잡한 알고리즘이나 기술적 개념 설명이 필요할 경우, 반드시 현실 세계의 비유를 들어 작성한다.

### 4. TODO.md 확인 원칙
- 작업 시작 전 프로젝트 루트의 TODO.md 파일을 반드시 확인한다.

### 5. 할 일을 미루지 말 것
- 현재 세션에서 해결할 수 있는 작업을 "나중에", "다음에", "별도로" 미루지 않는다.
- 발견된 문제는 즉시 수정한다. "TODO로 남기겠습니다"는 금지.
- 부분 완료 상태로 넘기지 않는다. 시작한 작업은 완료까지 수행한다.

### 6. 사용자 지적 시 소스 코드 재탐색 원칙
- 사용자가 "이건 아닌데", "이상한데", "확인해봐" 등으로 문제를 지적하면, 자신의 기존 판단을 우기지 않는다.
- 반드시 해당 소스 코드/파일을 다시 읽고 탐색한 후 답변한다.
- "아까 확인했는데..." 식의 기억 의존 답변은 금지. 항상 현재 상태를 직접 확인한다.

## 권장 원칙

### 7. 계획 우선 (Plan First)
- 모든 작업은 먼저 계획을 세우고, 사용자가 승인한 후에만 실행한다.

### 8. 컨텍스트 위생
- 작업 단위별로 /clear를 사용한다. 하나의 세션에 하나의 작업만 수행한다.

### 9. 서브에이전트 위임
- 탐색/조사 작업은 서브에이전트에 위임하여 메인 컨텍스트를 보호한다.

### 10. 한국어 응답
- 모든 응답은 한국어. 코드, 명령어, 기술 용어는 원문 그대로.

## 스킬 명령어

| 명령어 | 용도 |
|--------|------|
| `/lk-plan <feature>` | 브레인스토밍 기반 Plan 작성 |
| `/lk-plan-cross-review [path]` | Gemini 교차검증 |
| `/lk-code-review [--dual] [path]` | 코드 리뷰 |
| `/lk-todo` | TODO 리스트 관리 |
| `/lk-commit [--push]` | 회사 스타일 커밋 |
| `/lk-agent` | Sub Agent 생성/관리 |
| `/lk-team` | Agent Team 구성/관리 |
| `/lk-setup` | 선택적 환경 강화 |
| `/lk-skill-create <name>` | Skill 자동 생성 |

## Failure Memory 규칙

**모든 실패는 Claude가 직접 기록합니다.** 에러를 목격하면 즉시 해당 유형 파일에 기록하세요.

### 기록 대상 (모든 유형)
| 감지 조건 | 유형 파일 |
|-----------|----------|
| Bash 명령 에러 (exit code != 0, 에러 메시지) | `.leeloo/failure-memory/general.md` (또는 build/test/lint/git/dependency) |
| Write/Edit 도구 실패 | `.leeloo/failure-memory/file-io.md` |
| MCP 도구 에러 | `.leeloo/failure-memory/mcp.md` |
| 사용자 거부 ("아니야", "다시 해", "이건 아닌데") | `.leeloo/failure-memory/judgment.md` |
| 동일 작업 2회+ 재시도 | `.leeloo/failure-memory/judgment.md` |

### Bash 실패 유형 분류
- `npm test|jest|vitest|pytest` → `test.md`
- `npm run build|tsc|webpack` → `build.md`
- `eslint|prettier|biome` → `lint.md`
- `git push|merge|rebase` → `git.md`
- `npm install|pip install` → `dependency.md`
- 기타 → `general.md`

### 기록 형식
```
- [날짜] `명령/상황` — 에러: {에러 메시지} → 해결: {해결 방법 또는 "미해결"}
```

### 기록 절차
1. 에러 발생 시 `.leeloo/failure-memory/{type}.md`에 위 형식으로 기록 (디렉토리 없으면 생성)
2. 동일 패턴이 이미 기록되어 있으면 **이전 해결책을 먼저 확인**하고 적용
3. **반드시 프로젝트 로컬 CLAUDE.md** (`process.cwd()`의 CLAUDE.md)의 `## Failure Memory` 섹션에 최근 3건 요약만 유지 + "상세: .leeloo/failure-memory/ 참조". 없으면 자동 생성.
4. **글로벌 `~/.claude/CLAUDE.md`는 절대 수정하지 않는다.** 실패 기록은 항상 프로젝트 로컬에만 남긴다.

### 기록하지 않는 경우
- 의도된 실패 (예: `test -f` 존재 확인, `|| echo` 패턴)
- 사용자가 명시적으로 무시 지시한 에러

## Failure Memory

