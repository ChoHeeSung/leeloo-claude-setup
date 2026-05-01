---
name: lk-todo
description: |
  Plan 모드에서 작성한 계획을 실행 가능한 TODO 리스트로 변환·진행 추적.
  TODO, 할일, 태스크, 작업 목록, 진행 관리, 체크리스트, todo, task list, checklist, progress
user_invocable: true
argument-hint: "[create|list|add|start|done|undo|clear] [path|item|number]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-todo — Plan → TODO Conversion and Management

Convert plans authored in Plan mode into actionable TODO lists, and track progress.
A design-document reference feature lets you quickly check related sections at any time during work.

## Subcommands

```
/lk-todo                  — generate a TODO list from a plan file (default = create)
/lk-todo create [path]    — generate TODOs from the specified plan file
/lk-todo list             — show the current TODO list
/lk-todo add <item>       — manually add a TODO item
/lk-todo start <number>   — start work (record start time)
/lk-todo done <number>    — complete an item (record end time + duration)
/lk-todo undo <number>    — revert completion
/lk-todo clear            — purge completed items
```

## TODO.md File Format

File location: `{project-root}/TODO.md`

```markdown
# TODO

> 생성 기준: {plan filename} | {date/time}
> 설계 문서: {plan absolute path}

## 작업 목록

| # | 상태 | 태스크 | 참조 | 시작 | 종료 | 소요 |
|---|------|--------|------|------|------|------|
| 1 | ⬜ | 태스크 제목 — 설명 | §Phase1:1-1 | - | - | - |
| 2 | 🔨 | 진행 중 태스크 — 설명 | §Phase2 | 03-17 14:30 | - | - |
| 3 | ✅ | 완료된 태스크 — 설명 | §Phase1:2 | 03-17 14:00 | 03-17 14:25 | 25분 |

## 진행 상황

완료: 1/3 (33%)
```

Status icons: ⬜ pending, 🔨 in progress, ✅ done

**Reference column**: section reference within the design document (e.g., `§Phase1:1-1` → Plan's Phase 1, item 1-1)

## Procedure

### Argument Parsing

Parse the subcommand from user input:
- No argument or `create` → **create** action
- `create [path]` → create using the specified plan file
- `list` → **list** action
- `add <item>` → **add** action
- `start <number>` → **start** action
- `done <number>` → **done** action
- `undo <number>` → **undo** action
- `clear` → **clear** action

---

### create action

1. **Acquire the plan**:
   - **If argument given**: use that path.
   - **If no argument and a plan is in the current context** (called right after plan mode):
     1. Run `mkdir -p .claude/plans/`
     2. Write the plan to `.claude/plans/{YYYY-MM-DD}-{plan-summary-kebab-case}.md`
     3. Use the saved file
   - **If neither argument nor context plan**: Glob the following paths in order:
     1. `{project-root}/docs/plan/*.plan.md`
     2. `{project-root}/.claude/plans/*.md` (excluding `.review.md`)
     - None: error. Multiple: AskUserQuestion to pick.

2. **Plan absolute path**: run `realpath {plan path}` via Bash to get the absolute path.

3. **Read plan content**: Read the plan file via the Read tool.

4. **Decompose tasks**: analyze the plan's change items / implementation steps and decompose into independent task units.
   - Assign each task: number, title, brief description
   - Reference section: extract the related plan section name (e.g., `§Phase1`, `§Step2`)
   - Initialize start/end/duration to `-`
   - Status: all ⬜

5. **Existing file check**: if `TODO.md` already exists in the project root, AskUserQuestion to confirm overwrite.

6. **Create file**: Write to `{project-root}/TODO.md`.
   - Header includes the design document absolute path (see file format above).

7. **Show result**: display the generated TODO list to the user.

---

### list action

1. Read the project root's `TODO.md`.
2. If missing: "TODO.md가 없습니다. `/lk-todo create`로 생성하세요."
3. Display the contents to the user.

---

### add action

1. Read `TODO.md`. Error if missing.
2. Identify the last item number.
3. Append a new item to the table:
   - Number: last + 1
   - Status: ⬜
   - Task: the item the user provided
   - Reference: `-` (manually added)
   - Start/end/duration: `-`
4. Update progress.
5. Modify TODO.md via the Edit tool.

---

### start action

1. Read `TODO.md`.
2. Find the specified item number.
3. Change status to 🔨.
4. Record start time as current Korea time (KST, UTC+9) (`MM-DD HH:MM`).
5. Modify TODO.md via the Edit tool.
6. **Design reference notice**: if the task's reference section is not `-`:
   - Read the design absolute path from the TODO.md header and notify:
   ```
   참조: {design absolute path}의 {reference section} 내용을 확인하세요.
   ```

---

### done action

1. Read `TODO.md`.
2. Find the specified item number.
3. Change status to ✅.
4. Record end time as current Korea time (KST, UTC+9) (`MM-DD HH:MM`).
5. If start time is `-`, set it equal to the end time.
6. Auto-compute duration (end − start, in minutes).
7. Update progress (completion ratio).
8. Modify TODO.md via the Edit tool.
9. **Progress-based suggestions**:
   - On reaching 50% completion (only the first time):
     ```
     절반 완료! /lk-commit 으로 중간 커밋을 권장합니다.
     ```
   - On reaching 100%:
     ```
     모든 태스크 완료!
     /lk-commit 으로 최종 커밋하세요.
     ```

---

### undo action

1. Read `TODO.md`.
2. Find the specified item number.
3. Revert status to ⬜.
4. Reset end time and duration to `-`.
5. Update progress.
6. Modify TODO.md via the Edit tool.

---

### clear action

1. Read `TODO.md`.
2. Remove items with status ✅.
3. Renumber the remaining items starting at 1.
4. Update progress.
5. Modify TODO.md via the Edit tool.
6. Tell the user how many items were removed.
