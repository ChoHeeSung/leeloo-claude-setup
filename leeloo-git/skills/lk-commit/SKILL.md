---
name: lk-commit
description: |
  회사 스타일 Conventional Commits 메시지 자동 생성 후 커밋·푸시.
  커밋, 커밋해, 커밋 메시지, 푸시, 깃 커밋, conventional commits, commit, git commit, push
user_invocable: true
argument-hint: "[--push] [commit message]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

Analyze the git diff to auto-generate a Conventional Commits + Korean-style commit message and commit. If TODO.md exists, sync progress before/after the commit.

## Usage

```
/lk-commit                    — auto-generate commit message, commit only
/lk-commit --push             — auto-generate + commit + push
/lk-commit fix: 버그 수정     — use provided message as-is
/lk-commit --push feat: 기능  — use provided message + push
```

The argument after `lk-commit` (excluding `--push`) is an optional commit message override.

## Procedure

### 1. Parse arguments

Extract from arguments:
- `--push` → push after commit
- Remaining text → user-provided commit message (optional)

### 2. TODO.md check (pre-commit)

Read the project root's `TODO.md` via the Read tool (skip this step if absent).

If TODO.md exists, display current 🔨 in-progress items:
```
현재 진행 중인 TODO 항목:
- #2: 진행 중 태스크명
- #5: 진행 중 태스크명
```

### 3. Check for changes

```bash
git status --short
```

If no changes (no output), output:
```
커밋할 변경사항이 없습니다.

현재 상태:
- 브랜치: [branch]
- 마지막 커밋: [last commit message]
```
→ Stop.

### 4. Generate commit message (Haiku Task)

**Skip this step if the user provided a message directly.**

Delegate diff analysis + commit message generation to a Haiku sub-agent.

**Agent tool invocation:**
- `subagent_type`: `task`
- `task_model`: `haiku`
- `prompt`: insert git command output into the template below

```
Analyze the git changes below and generate a commit message.

## Commit Message Standard (based on commit-messages-guide)

### Structure
A commit message has 3 parts:

<type>: <subject> — <core summary>
                                        ← blank line (required)
<body>
                                        ← blank line
<footer>

- **subject**: ≤ 50 chars. Briefly describe the impact of the change.
- **body**: ≤ 72 chars per line. Explain *why* changed, *what* changed, and *side effects*.
- **footer**: related issue refs (optional, e.g., Refs: #123, Closes: #456).

### Type (Conventional Commits)
feat (new feature), fix (bug fix), refactor (structural improvement), docs (docs only),
test, chore (build/config), style (format), perf (performance).

### Subject rules
1. ≤ 50 chars.
2. **Write in Korean.** Keep technical terms (function names, file names, package names) in their original form.
3. No trailing period.
4. Describe what the change *does* (no past tense: "추가했음" ✗ → "추가" ✓).
5. Understandable without reading the code.

### Body rules
1. Wrap each line at ≤ 72 chars.
2. Use `- ` bullet list for concrete changes.
3. Each bullet carries concrete info (file name, value, before/after).
4. Explain **why** the change was made (context the diff cannot show).
5. Note **side effects** if any.
6. Omit body when the change is single-file or trivial (subject only).

### Messages to avoid
- Generic messages like "수정", "변경", "업데이트" — banned.
- "Fix this", "뭔가 고침", "이제 잘 작동할거임" — banned.
- Listing only file names without context — banned.

### Good examples (Korean — output language)

Simple (no body):
chore: Docker 타임존 서울 설정 — TZ=Asia/Seoul 환경변수 추가

Standard (with body):
fix: 직렬화 오류 수정 — JSON 전환으로 경로 의존성 제거

기존 방식이 클래스 파일 경로에 의존하여 리팩토링 시
로직이 깨질 수 있어 JSON 직렬화로 전환.

- Backend.serialize()에서 직렬화 방식 변경
- 기존 데이터 마이그레이션 스크립트 추가
- 역직렬화 실패 시 fallback 로직 제거 (더 이상 불필요)

Composite (multi-file change):
feat: 사용자 결제 모듈 추가 — Credit 모델에 use 메소드 구현

기존에는 결제 처리가 컨트롤러에 직접 구현되어 있어
단위 테스트와 재사용이 어려웠음. 모델 레이어로 이동.

- Credit 모델에 use(), refund(), balance() 메소드 추가
- PaymentController에서 Credit.use() 호출로 변경
- 결제 실패 시 자동 롤백 트랜잭션 처리 추가

Refs: #321

## Input data

### git diff --stat
{diff_stat result}

### git diff
{diff result}

### git log --oneline -5
{recent commit style reference}

## Output
Output **only the commit message in Korean** — no other explanation, no markdown code fences.
```

Use the text returned by the sub-agent as the commit message.

### 5. HISTORY.md write decision

Before committing, AskUserQuestion — "HISTORY.md에 이번 작업을 기록할까요?"

**Options**:
1. label: "작성" — generate HISTORY.md + history/ detail file
2. label: "건너뛰기" — proceed without writing HISTORY.md

**On "작성" (Haiku Task):**

Delegate HISTORY.md authoring to a Haiku sub-agent. The main session only builds the prompt and verifies the result.

**Agent tool invocation:**
- `subagent_type`: `task`
- `task_model`: `haiku`
- `prompt`: insert commit message and diff summary into the template below

```
아래 커밋 정보를 바탕으로 HISTORY.md와 history/ 상세 파일을 작성하라.

## 작업 절차

1. `mkdir -p history` 실행 (없으면 생성)
2. 현재 한국 시각(KST, UTC+9)을 `TZ='Asia/Seoul' date +'%Y-%m-%d %H:%M'` 로 획득
3. 상세 파일 작성: `history/{YYYY-MM-DD}_{HHMM}_{제목}.md`
   - 제목은 커밋 메시지의 type 제외 핵심 키워드로 자동 생성 (예: `kordoc-integration`)
   - 내용: 지시 요약, 작업 내용, 결과, 핵심 코드 스니펫(있으면), 현실 비유(복잡한 개념이 있으면)
4. HISTORY.md 테이블에 한 줄 추가 (파일이 없으면 테이블 헤더 포함 신규 생성):
   ```
   | {YYYY-MM-DD HH:MM} | {작업 요약 한 줄} | [상세](history/{파일명}) |
   ```
   - 최신 항목이 테이블 맨 위에 오도록 삽입
5. 생성한 HISTORY.md + history/ 파일을 `git add`로 스테이징에 포함
6. 생성한 파일 경로만 출력 (다른 설명 없이)

## 입력 데이터

### 커밋 메시지
{confirmed_commit_message}

### git diff --stat
{diff_stat result}

### git diff (핵심 부분)
{diff summary — for very large diffs use file names + key changes}

## 출력
생성한 파일 경로 2개만 출력:
- history/{filename}.md
- HISTORY.md (갱신)
```

After the sub-agent finishes, the main session only verifies the returned file paths (no need to re-read).

**On "건너뛰기":** skip this step and go straight to commit confirmation.

### 6. Confirm with user

Present the generated message using AskUserQuestion with **preview** to show the full multi-line message:

**Question**: "커밋 메시지를 확인하세요:"
**Header**: "Commit"
**Options**:
1. label: "커밋" (Recommended), preview: full generated commit message (subject + body)
2. label: "수정", description: "직접 메시지 입력"

If user selects "수정" (Other), use their custom input.

### 7. Stage and commit

```bash
# Stage all changes
git add -A

# Commit with confirmed message (use HEREDOC for formatting)
# Get git user info
GIT_USER_NAME=$(git config user.name)
GIT_USER_EMAIL=$(git config user.email)

git commit -m "$(cat <<EOF
<confirmed message>

Co-Authored-By: ${GIT_USER_NAME} <${GIT_USER_EMAIL}>
EOF
)"
```

### 8. TODO.md sync (post-commit)

If TODO.md exists, AskUserQuestion — "완료된 TODO 항목이 있나요? (항목 번호를 입력하거나 없음 선택)"

- If numbers entered: change those items' status to ✅
  - Modify TODO.md via the Edit tool
  - End time: current Korea time (KST, UTC+9) (`MM-DD HH:MM`)
  - Duration: compute if start time exists, else `-`
  - Update progress
- On "없음": skip

### 9. Push (if --push)

If `--push` flag was provided:

```bash
# Check if remote tracking branch exists
git push 2>&1 || git push --set-upstream origin $(git branch --show-current) 2>&1
```

**Push failure:**
```
Push 실패

원인:
  [error message]

수동 해결:
  git pull --rebase && git push
```
→ Stop.

### 10. Output

**Commit only (no --push):**
```
커밋 완료

  [commit hash] [commit message]
  브랜치: [branch]
  변경 파일: [N]개

Push 하려면:
  git push
  또는: /lk-commit --push (다음 커밋 시)
```

**Commit + Push:**
```
커밋 & Push 완료

  [commit hash] [commit message]
  브랜치: [branch] → origin/[branch]
  변경 파일: [N]개
```

### 11. Session cleanup guide (after commit completes)

After commit (or commit+push) completes, output session cleanup guidance **as plain text only**. Since `/clear` and `/compact` cannot be executed by Claude (they require user input), do not use AskUserQuestion or any interactive selection (the decision belongs to the user).

**Output format** (emit as one block, no options):

```
다음 작업 맥락에 따라 필요 시 직접 입력하세요:
- 같은 맥락 이어서 작업: 아무것도 하지 않아도 됨
- 연관 작업 계속하되 컨텍스트 축약: /compact
- 작업 단위 종료 → 새 세션: /clear  (원칙 8 권장, TODO.md·HISTORY.md·Failure Memory·auto memory는 파일로 보존되어 자동 복원)
```

No additional prompts: never use interactive nudges like "어느 쪽을 고르시겠습니까?".

## Notes

- Always use `git add -A` to stage all changes (tracked + untracked)
- Never commit `.env`, credentials, or secret files — warn if detected
- If on a detached HEAD, warn the user before committing
- For `Co-Authored-By`, use the commit user info fetched via `git config user.name/email`
- If the diff is very large, focus analysis on file names and key changes rather than reading every line

## Forbidden Commands (never run)

The following commands MUST NOT be executed under any circumstance:

- `git push --force` / `git push -f` — overwrites remote history. Risk of losing others' work
- `git push --force-to-lease` — force-push variant. Same risk
- `git reset --hard` — permanently discards uncommitted changes
- `git clean -f` / `git clean -fd` — permanently deletes untracked files/directories
- `git checkout .` / `git restore .` — reverts all modifications (loss of uncommitted work)
- `git branch -D` — force-deletes unmerged branches
- `git rebase` (including interactive) — rewrites history. Out of this skill's scope
- `git commit --amend` — modifies the previous commit. Risk of unintended changes
- `git stash drop` / `git stash clear` — permanently deletes stash
- `git config` (write) — never modify the user's git config (read is allowed)
