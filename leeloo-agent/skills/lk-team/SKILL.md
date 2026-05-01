---
name: lk-team
description: |
  Agent Team 구성·운영 — 메시지 전송·브로드캐스트·종료 등 팀 단위 작업 수행.
  에이전트 팀, 팀 구성, 팀 만들기, 팀 메시지, 브로드캐스트, 팀 종료, agent team, multi-agent, team broadcast, team shutdown
user_invocable: true
argument-hint: "[create|list|message|broadcast|shutdown] [--preset <name>]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-team — Agent Team Setup and Operation

Interactively configure and manage Agent Teams. Wraps TeamCreate, SendMessage, and TeamDelete tools for easy use. Ships with 5 built-in team presets for a fast start.

## Subcommands

```
/lk-team                          — interactive team setup (default = create)
/lk-team create                   — interactive team setup
/lk-team create --preset <name>   — preset-based team setup
/lk-team list                     — show current team status
/lk-team message <name> <msg>     — send message to a team member
/lk-team broadcast <msg>          — message all team members
/lk-team shutdown                 — shut down/clean up the team
```

## 5 Team Presets

| Preset | Composition (role/model) | Purpose |
|--------|--------------------------|---------|
| `fullstack` | frontend(sonnet) + backend(sonnet) + tester(haiku) | Full-stack feature development |
| `review-squad` | reviewer-1(sonnet) + reviewer-2(sonnet) + summarizer(haiku) | Multi-angle code review |
| `refactor` | analyzer(opus/plan) + implementer(sonnet) + tester(haiku) | Refactoring |
| `research` | explorer-1(haiku) + explorer-2(haiku) + synthesizer(opus) | Codebase research |
| `quality-check` | analyzer(opus/plan) + code-analyzer(opus/plan) + summarizer(haiku/plan) | Code quality verification |

## Preset Details

### fullstack

```
Team: fullstack (3 members)
1. frontend (acceptEdits, sonnet) — frontend implementation (UI components, styling, state)
2. backend (acceptEdits, sonnet) — backend implementation (API, business logic, data models)
3. tester (acceptEdits, haiku) — write/run frontend/backend tests
Tasks: #1, #2 in parallel → #3 sequential
```

### review-squad

```
Team: review-squad (3 members)
1. reviewer-1 (plan, sonnet) — review for correctness, security, performance
2. reviewer-2 (plan, sonnet) — review for architecture, design patterns, maintainability
3. summarizer (plan, haiku) — synthesize feedback from both reviewers and prioritize
Tasks: #1, #2 in parallel → #3 sequential
```

### refactor

```
Team: refactor (3 members)
1. analyzer (plan, opus) — analyze existing code, design refactoring strategy, scope impact
2. implementer (acceptEdits, sonnet) — execute refactoring, transform code
3. tester (acceptEdits, haiku) — verify pre/post behavioral equivalence
Tasks: #1 → #2 → #3 (sequential dependency)
```

### research

```
Team: research (3 members)
1. explorer-1 (plan, haiku) — explore codebase structure, file relationships, dependencies
2. explorer-2 (plan, haiku) — explore patterns, conventions, config files, docs
3. synthesizer (plan, opus) — synthesize both explorations into a structured report
Tasks: #1, #2 in parallel → #3 sequential
```

### quality-check

```
Team: quality-check (3 members)
1. analyzer (plan, opus) — analyze design-implementation alignment
2. code-analyzer (plan, opus) — analyze code quality/security/performance
3. summarizer (plan, haiku) — synthesize both analyses into a final report
Tasks: #1, #2 in parallel → #3 sequential
```

## Procedure

### Argument Parsing

Parse the subcommand from user input:
- No argument or `create` → **create** action
- `create --preset <name>` → **preset create** action
- `list` → **list** action
- `message <name> <msg>` → **message** action
- `broadcast <msg>` → **broadcast** action
- `shutdown` → **shutdown** action

---

### create action (purpose-based auto-design)

1. **Purpose question**: AskUserQuestion — "팀의 목적을 설명해주세요. (예: API 리팩토링, 새 기능 개발, 코드베이스 분석 등)"

2. **Auto-design**: Derive the following from the user's answer:
   - **Team name**: kebab-case name reflecting the purpose
   - **Member count**: 2–5 (proportional to complexity)
   - **Each member**:
     - `name`: name reflecting the role
     - `model`: pick by role complexity
       - architecture, comprehensive analysis, hard reasoning → `opus`
       - general implementation, code review, documentation → `sonnet`
       - simple exploration, search, test execution, summarization → `haiku`
     - `permissionMode`: pick by task type
       - read-only, analysis only → `plan`
       - code modification needed → `acceptEdits`
       - command execution included → `default`
     - role description (one line)
   - **Task distribution**: design each member's tasks and dependencies
     - independent → parallel (#1, #2 parallel)
     - sequential dependency → arrow (#1 → #2)

3. **TODO.md check**: Read the project root's `TODO.md` (if present).
   - If found, AskUserQuestion — "TODO.md에서 태스크를 자동 분배할까요? (분배/직접 설정)"
   - On "분배": auto-distribute ⬜ pending items to members.

4. **Preview confirmation**: Show the full team setup as preview via AskUserQuestion.
   ```
   팀 구성 프리뷰

   팀: {team-name} ({n}명)
   1. {name} ({permissionMode}, {model}) — {role description}
   2. {name} ({permissionMode}, {model}) — {role description}
   3. {name} ({permissionMode}, {model}) — {role description}
   태스크: {dependency description}

   이대로 생성할까요? (생성/수정)
   ```
   - "수정" → revise per feedback and re-preview
   - "생성" → proceed to next step

5. **Team creation**: Call tools in this order:
   - **TeamCreate** — create team (team name + member definitions)
   - **TaskCreate** — assign tasks to each member (with dependencies)
   - **Agent** — spawn each member (use the `name` parameter for the member name)

6. **Result output**:
   ```
   팀 생성 완료

   팀: {team-name}
   팀원:
   - {name} ({model}, {permissionMode}) — {status}
   - {name} ({model}, {permissionMode}) — {status}

   관리 명령어:
   - /lk-team list             — 팀 상태 확인
   - /lk-team message <name> <msg> — 팀원에게 메시지
   - /lk-team broadcast <msg>  — 전체 메시지
   - /lk-team shutdown         — 팀 종료
   ```

---

### preset create action

1. **Preset validation**: Verify the requested preset is one of the 5 (`fullstack`, `review-squad`, `refactor`, `research`, `quality-check`). Otherwise, error and list available presets.

2. **TODO.md check**: Read the project root's `TODO.md` (if present).
   - If found, AskUserQuestion — "TODO.md에서 태스크를 자동 분배할까요? (분배/직접 설정)"
   - On "분배": auto-distribute ⬜ pending items to members.

3. **Preview**: Show the preset team composition as preview.

4. **Confirmation**: AskUserQuestion — "이대로 생성할까요? (생성/수정)"
   - "수정" → revise per feedback and re-preview
   - "생성" → proceed to next step

5. **Team creation**: Same as step 5 of the create action (TeamCreate → TaskCreate → Agent spawn).

6. **Result output**: Same format as the create action.

---

### list action

1. Check the current team config.
2. Query each member's task status via the TaskList tool.
3. Display as a table:

```
팀 상태: {team-name}

| 팀원 | 모델 | 권한 | 태스크 | 상태 |
|------|------|------|--------|------|
| analyzer | opus | plan | 아키텍처 분석 | 🔨 진행중 |
| implementer | sonnet | acceptEdits | 리팩토링 구현 | ⬜ 대기 |
| tester | haiku | acceptEdits | 테스트 작성 | ⬜ 대기 |
```

If no team exists: "활성 팀이 없습니다. `/lk-team create`로 생성하세요."

---

### message action

1. Parse member name and message from arguments.
2. Send the message via SendMessage:
   ```
   SendMessage(to: "{name}", message: "{msg}")
   ```
3. Result: "`{name}`에게 메시지를 전송했습니다."

---

### broadcast action

1. **Cost warning**: "전체 팀원에게 메시지를 보냅니다. 각 팀원이 응답하므로 비용이 발생합니다."
2. Send to all members via SendMessage:
   ```
   SendMessage(to: "*", message: "{msg}")
   ```
3. Result: "전체 팀원에게 메시지를 전송했습니다."

---

### shutdown action

1. **Confirmation**: AskUserQuestion — "팀을 종료하시겠습니까? 진행 중인 작업이 있으면 중단됩니다. (예/아니오)"
2. On "예":
   - Send shutdown request to each member via SendMessage: `SendMessage(to: "*", message: "작업을 정리하고 종료해주세요.")`
   - Delete team via TeamDelete
3. Result: "팀이 종료되었습니다."
4. On "아니오": "팀 종료가 취소되었습니다."
