---
name: lk-git-init
description: "Git 저장소 초기화(remote·.gitignore·LFS)"
user_invocable: true
argument-hint: "[path]"
---

# /lk-git-init — Git 저장소 초기화

대화형으로 Git 저장소를 초기화한다.
remote 설정, .gitignore 생성, Git LFS 초기화 및 대용량 파일 확장자 등록까지 한번에 처리.

## 사용 예시

```
/lk-git-init
/lk-git-init ~/work/new-project
```

---

## Procedure

### 인자 파싱

- `[path]` → 선택. 초기화할 디렉토리 경로 (기본: 현재 디렉토리)

---

### Phase 1: 사전 확인

1. 대상 경로가 이미 git 저장소인지 확인:
   ```bash
   git -C "<path>" rev-parse --git-dir 2>/dev/null
   ```
   - 이미 저장소이면 경고 표시 후 AskUserQuestion — "이미 Git 저장소입니다. 계속 진행할까요? (계속/중단)"
   - "중단" 선택 시 중단.

2. 디렉토리 존재 여부 확인. 없으면:
   - AskUserQuestion — "디렉토리가 없습니다. 생성할까요? (생성/중단)"
   - "생성" 선택 시 `mkdir -p "<path>"`

---

### Phase 2: git init

```bash
git init "<path>"
```

성공 시:
```
Git 저장소 초기화 완료: <path>
```

---

### Phase 3: Remote 설정

AskUserQuestion — "원격 저장소(remote) URL을 입력하세요:"

**Header**: "Remote"
**Options**:
1. label: "건너뛰기", description: "remote 없이 로컬만 사용"
2. label: "Bitbucket", description: "Bitbucket Cloud URL 입력"
3. label: "GitHub", description: "GitHub URL 입력"

- "건너뛰기" 선택 시: 이 단계 건너뜀.
- Bitbucket/GitHub/직접 입력 시: URL을 받아서 실행:
  ```bash
  git -C "<path>" remote add origin "<url>"
  ```
  설정 확인:
  ```bash
  git -C "<path>" remote -v
  ```

---

### Phase 4: .gitignore 생성

AskUserQuestion — "프로젝트 유형을 선택하세요 (.gitignore 생성용):"

**Header**: ".gitignore"
**multiSelect**: true
**Options**:
1. label: "Node.js", description: "node_modules/, dist/, .env 등"
2. label: "Python", description: "__pycache__/, .venv/, *.pyc 등"
3. label: "Java/Gradle", description: "build/, .gradle/, *.class 등"
4. label: "건너뛰기", description: ".gitignore 생성하지 않음"

"건너뛰기" 선택 시 이 단계 건너뜀.

선택된 유형에 따라 .gitignore 생성:

**공통 (항상 포함):**
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

**Node.js 선택 시 추가:**
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

**Python 선택 시 추가:**
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

**Java/Gradle 선택 시 추가:**
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

Write 도구로 `<path>/.gitignore` 생성.

---

### Phase 5: Git LFS 초기화

AskUserQuestion — "Git LFS를 초기화할까요?"

**Header**: "LFS"
**Options**:
1. label: "초기화", description: "LFS 설치 + 대용량 파일 확장자 등록"
2. label: "건너뛰기", description: "LFS 없이 진행"

**"초기화" 선택 시:**

1. git lfs 설치 확인:
   ```bash
   git lfs version 2>/dev/null
   ```
   미설치 시:
   ```
   Git LFS가 설치되지 않았습니다.
   설치: brew install git-lfs
   ```
   중단.

2. LFS 초기화:
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

   선택된 확장자를 등록:
   ```bash
   git -C "<path>" lfs track "*.png" "*.jpg" ...
   ```

4. `.gitattributes` 생성 확인:
   ```bash
   cat "<path>/.gitattributes"
   ```

---

### Phase 6: Initial commit 제안

AskUserQuestion — "초기 커밋을 생성할까요?"

**Header**: "Init commit"
**Options**:
1. label: "커밋", description: ".gitignore, .gitattributes 등을 initial commit으로 생성"
2. label: "나중에", description: "커밋 없이 종료"

**"커밋" 선택 시:**
```bash
git -C "<path>" add -A
git -C "<path>" commit -m "chore: 프로젝트 초기화 — git init + .gitignore + LFS 설정"
```

---

### Phase 7: 결과 출력

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
