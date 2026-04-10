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

## 커밋 메시지 표준 (commit-messages-guide 기반)

### 구조
커밋 메시지는 3부분으로 구성한다:

<type>: <제목> — <핵심 요약>
                                        ← 빈 줄 (필수)
<본문>
                                        ← 빈 줄
<footer>

- **제목 (subject)**: 50자 이내. 변경사항의 영향을 간결하게 설명
- **본문 (body)**: 한 줄 72자 이내. '왜' 변경했는지, '무엇이' 바뀌었는지, '부수 효과'는 무엇인지 설명
- **footer**: 관련 이슈 번호 (선택사항, 예: Refs: #123, Closes: #456)

### Type (Conventional Commits)
feat(새 기능), fix(버그 수정), refactor(구조 개선), docs(문서만),
test(테스트), chore(빌드/설정), style(포맷), perf(성능 개선)

### 제목 규칙
1. 50자 이내로 작성
2. 한국어로 작성. 기술 용어(함수명, 파일명, 패키지명)는 원문 유지
3. 마침표로 끝내지 않는다
4. 변경사항이 '무엇을 하는지' 설명 (과거형 금지: "추가했음" X → "추가" O)
5. 코드를 보지 않아도 변경사항이 무엇인지 이해 가능하게 작성

### 본문 규칙
1. 한 줄 72자 이내로 줄바꿈
2. `- ` bullet 목록으로 구체적 변경 내용 나열
3. 각 bullet에 구체적 정보 포함 (파일명, 값, 전후 비교 등)
4. **왜 변경했는지** 맥락 설명 (코드 diff로 알 수 없는 정보)
5. **부수 효과**가 있으면 명시
6. 변경 파일 1개이거나 단순하면 본문 생략 (제목만)

### 피해야 할 메시지
- "수정" "변경" "업데이트" 같은 총칭적 메시지는 금지
- "Fix this" "뭔가 고침" "이제 잘 작동할거임" 금지
- 맥락 없이 파일명만 나열하는 것도 금지

### 좋은 예시

단순 (본문 없음):
chore: Docker 타임존 서울 설정 — TZ=Asia/Seoul 환경변수 추가

표준 (본문 포함):
fix: 직렬화 오류 수정 — JSON 전환으로 경로 의존성 제거

기존 방식이 클래스 파일 경로에 의존하여 리팩토링 시
로직이 깨질 수 있어 JSON 직렬화로 전환.

- Backend.serialize()에서 직렬화 방식 변경
- 기존 데이터 마이그레이션 스크립트 추가
- 역직렬화 실패 시 fallback 로직 제거 (더 이상 불필요)

복합 (다수 파일 변경):
feat: 사용자 결제 모듈 추가 — Credit 모델에 use 메소드 구현

기존에는 결제 처리가 컨트롤러에 직접 구현되어 있어
단위 테스트와 재사용이 어려웠음. 모델 레이어로 이동.

- Credit 모델에 use(), refund(), balance() 메소드 추가
- PaymentController에서 Credit.use() 호출로 변경
- 결제 실패 시 자동 롤백 트랜잭션 처리 추가

Refs: #321

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

### 5. HISTORY.md 작성 여부 확인

커밋 전에 AskUserQuestion — "HISTORY.md에 이번 작업을 기록할까요?"

**Options**:
1. label: "작성" — HISTORY.md + history/ 상세 파일 생성
2. label: "건너뛰기" — HISTORY.md 작성 없이 커밋 진행

**"작성" 선택 시:**

1. `mkdir -p history` (없으면 생성)
2. 현재 시각을 기준으로 상세 파일 작성: `history/{YYYY-MM-DD}_{HHMM}_{제목}.md`
   - 제목은 커밋 메시지의 type 제외 핵심 키워드로 자동 생성 (예: `kordoc-integration`)
   - 내용: 지시 요약, 작업 내용, 결과, 핵심 코드 스니펫(있으면), 현실 비유(복잡한 개념이 있으면)
3. HISTORY.md 테이블에 한 줄 추가 (파일이 없으면 테이블 헤더 포함 신규 생성):
   ```
   | {YYYY-MM-DD HH:MM} | {작업 요약 한 줄} | [상세](history/{파일명}) |
   ```
   - 최신 항목이 테이블 맨 위에 오도록 삽입
4. 생성한 HISTORY.md + history/ 파일을 `git add`로 스테이징에 포함

**"건너뛰기" 선택 시:** 이 단계를 건너뛰고 바로 커밋 확인으로 진행.

### 6. Confirm with user

Present the generated message using AskUserQuestion with **preview** to show the full multi-line message:

**Question**: "커밋 메시지를 확인하세요:"
**Header**: "Commit"
**Options**:
1. label: "커밋" (Recommended), preview: 생성된 전체 커밋 메시지 (제목 + 본문)
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

### 8. TODO.md 연동 (커밋 후)

TODO.md가 있으면 AskUserQuestion — "완료된 TODO 항목이 있나요? (항목 번호를 입력하거나 없음 선택)"

- 번호를 입력한 경우: 해당 번호들의 상태를 ✅로 변경
  - Edit 도구로 TODO.md 수정
  - 종료 시간: 현재 시각(`MM-DD HH:MM`)으로 기록
  - 소요 시간: 시작 시간이 있으면 계산, 없으면 `-`
  - 진행 상황 갱신
- "없음" 선택 시: 건너뜀

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
