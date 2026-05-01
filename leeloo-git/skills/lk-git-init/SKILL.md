---
name: lk-git-init
description: |
  Git 저장소 인터랙티브 초기화 — remote·.gitignore·LFS 설정 일괄 처리.
  깃 초기화, 저장소 초기화, 레포 초기화, gitignore, LFS, 리모트, git init, git remote, git lfs, repository init
user_invocable: true
argument-hint: "[path]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-git-init — Git Repository Initialization

Interactively initialize a Git repository.
Handles remote setup, `.gitignore` generation, Git LFS init, and large-file extension registration in one flow.

## Examples

```
/lk-git-init
/lk-git-init ~/work/new-project
```

---

## Procedure

### Argument Parsing

- `[path]` → optional. Directory to initialize (default: current directory)

---

### Phase 1: Pre-checks

1. Check whether the target path is already a git repo:
   ```bash
   git -C "<path>" rev-parse --git-dir 2>/dev/null
   ```
   - If already a repo, warn and AskUserQuestion — "이미 Git 저장소입니다. 계속 진행할까요? (계속/중단)"
   - On "중단": abort.

2. Check whether the directory exists. If not:
   - AskUserQuestion — "디렉토리가 없습니다. 생성할까요? (생성/중단)"
   - On "생성": run `mkdir -p "<path>"`

---

### Phase 2: git init

```bash
git init "<path>"
```

On success:
```
Git 저장소 초기화 완료: <path>
```

---

### Phase 3: Remote Setup

AskUserQuestion — "원격 저장소(remote) URL을 입력하세요:"

**Header**: "Remote"
**Options**:
1. label: "건너뛰기", description: "remote 없이 로컬만 사용"
2. label: "Bitbucket", description: "Bitbucket Cloud URL 입력"
3. label: "GitHub", description: "GitHub URL 입력"

- On "건너뛰기": skip this step.
- On Bitbucket/GitHub/manual: collect URL and run:
  ```bash
  git -C "<path>" remote add origin "<url>"
  ```
  Verify:
  ```bash
  git -C "<path>" remote -v
  ```

---

### Phase 4: .gitignore Generation

AskUserQuestion — "프로젝트 유형을 선택하세요 (.gitignore 생성용):"

**Header**: ".gitignore"
**multiSelect**: true
**Options**:
1. label: "Node.js", description: "node_modules/, dist/, .env 등"
2. label: "Python", description: "__pycache__/, .venv/, *.pyc 등"
3. label: "Java/Gradle", description: "build/, .gradle/, *.class 등"
4. label: "건너뛰기", description: ".gitignore 생성하지 않음"

On "건너뛰기": skip this step.

Generate `.gitignore` based on selection:

**Common (always included):**
```
# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
*.swo

# Environment
.env
.env.local
.env.*.local
```

**With Node.js selected:**
```
# Node
node_modules/
dist/
build/
*.log
npm-debug.log*
yarn-debug.log*
.npm
.yarn/cache
```

**With Python selected:**
```
# Python
__pycache__/
*.py[cod]
*$py.class
.venv/
venv/
*.egg-info/
dist/
build/
.pytest_cache/
```

**With Java/Gradle selected:**
```
# Java/Gradle
build/
.gradle/
*.class
*.jar
*.war
*.ear
out/
.settings/
.classpath
.project
```

Create `<path>/.gitignore` via the Write tool.

---

### Phase 5: Git LFS Initialization

AskUserQuestion — "Git LFS를 초기화할까요?"

**Header**: "LFS"
**Options**:
1. label: "초기화", description: "LFS 설치 + 대용량 파일 확장자 등록"
2. label: "건너뛰기", description: "LFS 없이 진행"

**On "초기화":**

1. Verify git lfs is installed:
   ```bash
   git lfs version 2>/dev/null
   ```
   If missing:
   ```
   Git LFS가 설치되지 않았습니다.
   설치: brew install git-lfs
   ```
   Abort.

2. Initialize LFS:
   ```bash
   git -C "<path>" lfs install
   ```

3. AskUserQuestion — "LFS로 추적할 대용량 파일 확장자를 선택하세요:"

   **Header**: "LFS 확장자"
   **multiSelect**: true
   **Options**:
   1. label: "이미지 (png,jpg,gif,bmp,svg,psd)", description: "이미지/디자인 파일"
   2. label: "문서 (pdf,hwp,hwpx,doc,docx,xls,xlsx,pptx)", description: "문서/스프레드시트"
   3. label: "미디어 (mp4,mp3,wav,avi,mov)", description: "동영상/오디오"
   4. label: "아카이브 (zip,tar,gz,7z,rar)", description: "압축 파일"

   Register selected extensions:
   ```bash
   git -C "<path>" lfs track "*.png" "*.jpg" ...
   ```

4. Verify `.gitattributes` was created:
   ```bash
   cat "<path>/.gitattributes"
   ```

---

### Phase 6: Initial Commit Suggestion

AskUserQuestion — "초기 커밋을 생성할까요?"

**Header**: "Init commit"
**Options**:
1. label: "커밋", description: ".gitignore, .gitattributes 등을 initial commit으로 생성"
2. label: "나중에", description: "커밋 없이 종료"

**On "커밋":**
```bash
git -C "<path>" add -A
git -C "<path>" commit -m "chore: 프로젝트 초기화 — git init + .gitignore + LFS 설정"
```

---

### Phase 7: Result Output

```
## Git 초기화 완료

| 항목 | 상태 |
|------|------|
| 저장소 | <path> |
| Remote | <url 또는 "없음"> |
| .gitignore | <생성됨 (Node.js, Python) 또는 "건너뜀"> |
| LFS | <초기화됨 (png,jpg,pdf,...) 또는 "건너뜀"> |
| 초기 커밋 | <생성됨 또는 "건너뜀"> |
```
