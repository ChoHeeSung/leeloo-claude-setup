---
name: lk-skill-create
description: |
  Git 히스토리·프로젝트 구조 분석으로 Claude Code SKILL.md를 자동 생성.
  스킬 생성, 스킬 만들기, SKILL.md 생성, 스킬 자동화, skill create, skill generator, auto skill
user_invocable: true
argument-hint: "<skill-name> [--quick]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-skill-create — Skill Auto-Generator

Analyzes git history and project structure to auto-generate a Claude Code skill (SKILL.md) capturing the team's recurring patterns.

## Subcommands

```
/lk-skill-create <skill-name>           — full process (analyze + ask + generate)
/lk-skill-create <skill-name> --quick   — skip questions and auto-generate
```

## Output File

- `skills/{skill-name}/SKILL.md`

## Procedure

### Argument Parsing

Parse from user input:
- `<skill-name>`: skill name to create (required, lowercase-hyphenated)
- `--quick`: quick mode flag (optional)

If `<skill-name>` is missing:
```
사용법: /lk-skill-create <skill-name> [--quick]
예: /lk-skill-create code-review-java
예: /lk-skill-create deploy-checklist --quick
```
Print and abort.

---

### Phase 1: Project Analysis

1. **Git history analysis**: run `git log --oneline -50` to identify recent commit patterns.
2. **File structure scan**: Glob `**/*.{ts,js,py,java,go,rs,erl,ex}` to identify primary languages/frameworks.
3. **Existing skill check**: Glob `skills/*/SKILL.md` to prevent duplication.

Analysis summary:
```
## 프로젝트 분석 완료

- 주요 언어: {detected language}
- 커밋 패턴: {top 3 patterns}
- 기존 스킬: {list}
- 감지된 반복 작업: {pattern}
```

---

### Phase 2: Skill Definition (interactive, skip on `--quick`)

AskUserQuestion in sequence:

1. **Skill purpose**: "이 스킬이 해결할 문제는 무엇인가요?"
2. **Trigger condition**: "어떤 상황에서 이 스킬이 활성화되어야 하나요? (예: PR 생성 시, 특정 파일 수정 시)"
3. **Output form**: "스킬의 출력은 어떤 형식이어야 하나요? (코드 수정 / 문서 생성 / 검증 리포트 / 대화형 가이드)"

---

### Phase 3: SKILL.md Body Generation (Sonnet Task)

Read one existing SKILL.md to obtain a structural example, then delegate body authoring to a Sonnet sub-agent.

**Agent tool invocation:**
- `subagent_type`: `task`
- `task_model`: `sonnet`
- `prompt`:

```
아래 정보를 기반으로 Claude Code 스킬 SKILL.md를 작성하라.

## 입력
### 스킬 이름
{skill_name}

### Phase 1 프로젝트 분석 결과
{phase1_summary}

### Phase 2 스킬 정의 (--quick 모드면 일부 비어있음)
- 목적: {purpose}
- 트리거 조건: {trigger}
- 출력 형식: {output_form}

### 구조 참조 예시 (기존 SKILL.md 한 개)
{example_skill_md}

## 출력 형식 (정확히 이 구조의 마크다운만)
```markdown
---
name: {skill-name}
description: "{한 줄 설명 — 120자 이내, / 로 시작하는 사용법 포함}"
user_invocable: true
argument-hint: "{인자 힌트}"
---

# /{skill-name} — {제목}

{스킬 설명 1~2문장}

## 사용법

\`\`\`
/{skill-name} {인자}
\`\`\`

## 활성화 조건

- {트리거 조건들}

## Procedure

### Phase 1: ...
### Phase 2: ...

## Anti-Patterns

- ...
```

## 규칙
- frontmatter description은 한 줄, / 사용법 포함.
- Procedure의 각 Phase는 AskUserQuestion/Read/Write/Bash 같은 Claude Code 도구 이름으로 구체적 단계 명시.
- 참조 예시의 스타일(한국어, 체크리스트, 마크다운 코드블록 사용)을 따를 것.
- 없는 도구/MCP/외부 서비스를 hallucination 하지 말 것.
- 입력에 주어진 목적/트리거/출력과 모순되는 내용 금지.
```

**Result verification (main session):**
- [ ] all 4 frontmatter fields (name, description, user_invocable, argument-hint) present
- [ ] name matches the skill-name argument
- [ ] Procedure section contains concrete tool-call steps
- [ ] no hallucinated tools/MCPs

**Fallback on quality failure:** author directly in the main session (Opus).

---

### Phase 4: Save and Notify

1. `mkdir -p skills/{skill-name}/`
2. Write → `skills/{skill-name}/SKILL.md`

Completion message:
```
스킬 생성 완료

파일: skills/{skill-name}/SKILL.md

다음 단계:
- plugin.json의 skills 목록에 추가 필요 시 수동 등록
- /lk-code-review skills/{skill-name}/SKILL.md — 스킬 품질 리뷰
```
