---
name: leeloo-cross-validate
description: "gemini-cli로 현재 plan을 교차검증합니다. Usage: /leeloo-cross-validate [plan-file-path]"
user_invocable: true
argument-hint: "[plan-file-path]"
license: MIT
---

# Gemini 교차검증 스킬

이 스킬은 Claude가 작성한 plan을 gemini-cli를 통해 독립적으로 교차검증합니다.

## Plan 저장 경로

Plan 파일은 프로젝트 루트의 `.claude/plans/` 디렉토리에 저장됩니다.
- 파일명 규칙: `{YYYY-MM-DD}-{요약-kebab-case}.md`
- 예: `.claude/plans/2026-03-17-api-refactoring.md`

## Procedure

### Step 1: 인자 파싱

사용자가 plan 파일 경로를 인자로 제공했는지 확인하세요.
- 인자가 있으면 해당 경로를 plan 파일로 사용합니다.
- 인자가 없으면 Step 3에서 자동 탐색합니다.

### Step 2: gemini-cli 존재 확인

Bash 도구로 `command -v gemini`를 실행하여 gemini-cli가 설치되어 있는지 확인하세요.

설치되어 있지 않으면 다음 메시지를 출력하고 **중단**하세요:

```
gemini-cli가 설치되어 있지 않습니다.
설치 방법: npm install -g @google/gemini-cli 또는 https://github.com/google-gemini/gemini-cli 참고
```

### Step 3: Plan 파일 탐색

인자로 경로가 제공된 경우 해당 파일을 사용합니다.

인자가 없는 경우:
1. Glob 도구로 `{프로젝트루트}/.claude/plans/*.md` 패턴을 검색하세요 (`.review.md`로 끝나는 파일은 제외).
2. 파일이 없으면 다음 메시지를 출력하고 중단하세요:
   ```
   plan 파일을 찾을 수 없습니다.
   plan mode에서 plan을 먼저 작성하거나, 파일 경로를 직접 지정하세요.
   Usage: /leeloo-cross-validate [plan-file-path]

   Plan 파일 저장 경로: .claude/plans/
   ```
3. 파일이 1개면 해당 파일을 사용합니다.
4. 파일이 여러 개면 목록을 표시하고 AskUserQuestion으로 어떤 파일을 검증할지 사용자에게 확인하세요.

### Step 4: Plan 내용 읽기

Read 도구로 선택된 plan 파일의 내용을 읽으세요.

### Step 5: Gemini 실행

1. Read 도구로 `${CLAUDE_PLUGIN_ROOT}/resources/gemini-review-prompt.md` 파일을 읽어 리뷰 프롬프트 템플릿을 가져오세요.
2. 다음 Bash 명령으로 gemini-cli를 실행하세요:

```bash
timeout 120 gemini -p "$(cat <<'PROMPT_EOF'
{gemini-review-prompt.md 내용}

---

# 검증 대상 Plan

{plan 파일 내용}
PROMPT_EOF
)" -o text
```

**에러 처리:**
- timeout (종료코드 124) → "Gemini 응답 시간이 초과되었습니다 (120초). 네트워크 연결을 확인하세요."
- 빈 응답 → "Gemini가 빈 응답을 반환했습니다. API 키 설정을 확인하세요. (`gemini auth login`)"
- 기타 에러 → 에러 메시지를 그대로 표시

### Step 6: 결과 표시

다음 형식으로 결과를 사용자에게 출력하세요:

```
## Gemini 교차검증 결과

- **검증 대상**: {plan 파일 경로}
- **검증 시각**: {현재 날짜/시간}

---

{gemini 응답 내용}
```

### Step 7: 리뷰 파일 저장

gemini 응답을 plan 파일과 같은 디렉토리(`.claude/plans/`)에 저장하세요.

**리뷰 파일명 규칙**: `{plan파일명에서 .md 제거}.review.md`
- 예: plan이 `.claude/plans/2026-03-17-api-refactoring.md`
- → 리뷰: `.claude/plans/2026-03-17-api-refactoring.review.md`

Write 도구를 사용하여 다음 형식으로 저장:

```markdown
# Gemini 교차검증 리뷰

- **원본 Plan**: {plan 파일 경로}
- **검증 시각**: {현재 날짜/시간}

---

{gemini 응답 내용}
```

저장 완료 후 리뷰 파일 경로를 사용자에게 알려주세요.
