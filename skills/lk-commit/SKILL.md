---
name: lk-commit
description: "레포 변경사항 → 회사 스타일 커밋 메시지 생성 + 커밋/푸시. /lk-commit [--push] [message]"
user_invocable: true
argument-hint: "[--push] [commit message]"
---

git diff를 분석해 Conventional Commits + 한국어 스타일 커밋 메시지를 자동 생성하고 커밋합니다.
TODO.md가 있으면 커밋 전후로 진행 상황을 연동합니다.

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

### 2. TODO.md 확인 (커밋 전)

Read 도구로 프로젝트 루트의 `TODO.md` 읽기 (없으면 이 단계 건너뜀).

TODO.md가 있으면 현재 🔨 진행중 항목을 표시:
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

**유저가 메시지를 직접 제공한 경우 이 단계를 건너뛴다.**

Haiku 서브 에이전트에게 diff 분석 + 커밋 메시지 생성을 위임한다.

**Agent tool 호출:**
- `subagent_type`: `task`
- `task_model`: `haiku`
- `prompt`: 아래 템플릿에 git 명령 결과를 삽입

```
아래 git 변경사항을 분석하고 커밋 메시지를 생성하라.

## 규칙

### 형식
제목(subject)과 본문(body)을 분리:

```
type: 한국어 제목 — 핵심 요약

- 변경사항 1
- 변경사항 2
```

- 제목 (1행): `type: 제목 — 요약` (50자 이내)
- 빈 줄 (2행): 반드시 빈 줄로 분리
- 본문 (3행~): `- ` bullet 목록으로 구체적 변경사항 나열

### Type
feat(새 기능), fix(버그), refactor, docs, test, chore(설정/빌드), style(포맷), perf(성능)

### 본문 규칙
- 각 bullet은 구체적인 변경 내용 (파일명, 값, 전후 비교 등)
- 변경 파일 1개이거나 단순하면 본문 생략 (제목만)

### 예시

단순:
```
chore: Docker 타임존 서울 설정 — TZ=Asia/Seoul 환경변수 추가
```

복합:
```
docs: README 갱신 — 폴더명·MCP 도구·테스트 수치 최신화

- server/ → leeloo-flow-backend, leeloo-flow-board → leeloo-flow-frontend
- MCP 도구 28 → 37개 (체크리스트, 의존성, 알림설정, 검색 추가)
- 테스트 783 → 2,269 (95 파일), 버전 3.0.0 → 4.0.0
```

## 입력 데이터

### git diff --stat
{diff_stat 결과}

### git diff
{diff 결과}

### git log --oneline -5
{최근 커밋 스타일 참고용}

## 출력
커밋 메시지만 출력하라. 다른 설명이나 마크다운 코드블록 없이 메시지 원문만.
```

서브 에이전트가 반환한 텍스트를 커밋 메시지로 사용한다.

### 5. Confirm with user

Present the generated message using AskUserQuestion with **preview** to show the full multi-line message:

**Question**: "커밋 메시지를 확인하세요:"
**Header**: "Commit"
**Options**:
1. label: "커밋" (Recommended), preview: 생성된 전체 커밋 메시지 (제목 + 본문)
2. label: "수정", description: "직접 메시지 입력"

If user selects "수정" (Other), use their custom input.

### 6. Stage and commit

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

### 7. TODO.md 연동 (커밋 후)

TODO.md가 있으면 AskUserQuestion — "완료된 TODO 항목이 있나요? (항목 번호를 입력하거나 없음 선택)"

- 번호를 입력한 경우: 해당 번호들의 상태를 ✅로 변경
  - Edit 도구로 TODO.md 수정
  - 종료 시간: 현재 시각(`MM-DD HH:MM`)으로 기록
  - 소요 시간: 시작 시간이 있으면 계산, 없으면 `-`
  - 진행 상황 갱신
- "없음" 선택 시: 건너뜀

### 8. Push (if --push)

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

### 9. Output

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

## Notes

- Always use `git add -A` to stage all changes (tracked + untracked)
- Never commit `.env`, credentials, or secret files — warn if detected
- If on a detached HEAD, warn the user before committing
- `Co-Authored-By`에는 `git config user.name/email`로 가져온 커밋 사용자 정보를 사용
- If the diff is very large, focus analysis on file names and key changes rather than reading every line

## 절대 실행 금지 명령어

아래 명령어는 어떤 상황에서도 실행하지 않는다:

- `git push --force` / `git push -f` — 원격 히스토리 덮어쓰기. 다른 사람의 작업 소실 위험
- `git push --force-to-lease` — force push 변형. 동일한 위험
- `git reset --hard` — 커밋되지 않은 변경사항 영구 삭제
- `git clean -f` / `git clean -fd` — 추적되지 않는 파일/디렉토리 영구 삭제
- `git checkout .` / `git restore .` — 모든 수정사항 되돌림 (커밋 안 된 작업 소실)
- `git branch -D` — 병합되지 않은 브랜치 강제 삭제
- `git rebase` (interactive 포함) — 히스토리 변경. 이 스킬의 범위 밖
- `git commit --amend` — 직전 커밋 수정. 의도치 않은 변경 위험
- `git stash drop` / `git stash clear` — stash 영구 삭제
- `git config` (write) — 사용자 git 설정 변경 금지 (read는 허용)
