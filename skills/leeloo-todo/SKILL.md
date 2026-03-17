---
name: leeloo-todo
description: Plan을 태스크 단위 TODO 리스트로 변환하고 관리하는 스킬. /leeloo-todo [create|list|add|start|done|undo|clear]
user_invocable: true
argument-hint: "[create|list|add|start|done|undo|clear] [path|item|number]"
---

# /leeloo-todo — Plan → TODO 변환 및 관리

Plan mode에서 작성한 계획을 실행 가능한 TODO 리스트로 변환하고, 진행 상황을 추적합니다.

## 서브커맨드

```
/leeloo-todo                  — plan 파일에서 TODO 리스트 생성 (기본 동작 = create)
/leeloo-todo create [path]    — 지정된 plan 파일에서 TODO 생성
/leeloo-todo list             — 현재 TODO 목록 표시
/leeloo-todo add <항목>       — TODO 항목 수동 추가
/leeloo-todo start <번호>     — 작업 시작 (시작 시간 기록)
/leeloo-todo done <번호>      — 항목 완료 (종료 시간 + 소요 시간 기록)
/leeloo-todo undo <번호>      — 완료 취소
/leeloo-todo clear            — 완료된 항목 정리
```

## TODO.md 파일 형식

파일 위치: `{프로젝트루트}/TODO.md`

```markdown
# TODO

> 생성 기준: {plan 파일명} | {날짜시간}

## 작업 목록

| # | 상태 | 태스크 | 시작 | 종료 | 소요 |
|---|------|--------|------|------|------|
| 1 | ⬜ | 태스크 제목 — 설명 | - | - | - |
| 2 | 🔨 | 진행 중 태스크 — 설명 | 03-17 14:30 | - | - |
| 3 | ✅ | 완료된 태스크 — 설명 | 03-17 14:00 | 03-17 14:25 | 25분 |

## 진행 상황

완료: 1/3 (33%)
```

상태 아이콘: ⬜ 대기, 🔨 진행중, ✅ 완료

## Procedure

### 인자 파싱

사용자 입력에서 서브커맨드를 파싱합니다:
- 인자 없음 또는 `create` → **create** 동작
- `create [path]` → path 지정된 plan 파일로 create
- `list` → **list** 동작
- `add <항목>` → **add** 동작
- `start <번호>` → **start** 동작
- `done <번호>` → **done** 동작
- `undo <번호>` → **undo** 동작
- `clear` → **clear** 동작

---

### create 동작

1. **Plan 파일 찾기**: 인자가 있으면 해당 경로 사용. 없으면 프로젝트 루트의 `.claude/plans/*.md`에서 최근 수정된 파일 탐색 (Glob으로 `{프로젝트루트}/.claude/plans/*.md` 검색, `.review.md`로 끝나는 파일은 제외).
2. **Plan 내용 읽기**: Read 도구로 plan 파일 내용을 읽습니다.
3. **태스크 분해**: Plan의 변경 사항/구현 단계를 분석하여 독립적 태스크 단위로 분해합니다.
   - 각 태스크에 번호, 제목, 간단한 설명 부여
   - 시작/종료/소요는 `-`로 초기화
   - 상태는 모두 ⬜
4. **기존 파일 확인**: 프로젝트 루트에 TODO.md가 이미 존재하면 AskUserQuestion으로 덮어쓰기 확인.
5. **파일 생성**: Write 도구로 `{프로젝트루트}/TODO.md` 생성.
6. **결과 표시**: 생성된 TODO 목록을 사용자에게 표시합니다.

---

### list 동작

1. Read 도구로 프로젝트 루트의 `TODO.md`를 읽습니다.
2. 파일이 없으면 "TODO.md가 없습니다. `/leeloo-todo create`로 생성하세요." 안내.
3. 내용을 사용자에게 표시합니다.

---

### add 동작

1. Read 도구로 `TODO.md`를 읽습니다. 없으면 에러.
2. 기존 목록의 마지막 번호를 파악합니다.
3. 새 항목을 테이블 끝에 추가합니다:
   - 번호: 마지막 번호 + 1
   - 상태: ⬜
   - 태스크: 사용자가 입력한 항목
   - 시작/종료/소요: `-`
4. 진행 상황 갱신.
5. Edit 도구로 TODO.md 수정.

---

### start 동작

1. Read 도구로 `TODO.md`를 읽습니다.
2. 지정된 번호의 항목을 찾습니다.
3. 상태를 🔨로 변경합니다.
4. 시작 시간을 현재 시각(`MM-DD HH:MM`)으로 기록합니다.
5. Edit 도구로 TODO.md 수정.

---

### done 동작

1. Read 도구로 `TODO.md`를 읽습니다.
2. 지정된 번호의 항목을 찾습니다.
3. 상태를 ✅로 변경합니다.
4. 종료 시간을 현재 시각(`MM-DD HH:MM`)으로 기록합니다.
5. 시작 시간이 `-`이면 종료 시간과 동일하게 설정합니다.
6. 소요 시간을 자동 계산합니다 (종료 - 시작, 분 단위).
7. 진행 상황(완료 비율) 갱신.
8. Edit 도구로 TODO.md 수정.

---

### undo 동작

1. Read 도구로 `TODO.md`를 읽습니다.
2. 지정된 번호의 항목을 찾습니다.
3. 상태를 ⬜로 되돌립니다.
4. 종료 시간과 소요 시간을 `-`로 초기화합니다.
5. 진행 상황 갱신.
6. Edit 도구로 TODO.md 수정.

---

### clear 동작

1. Read 도구로 `TODO.md`를 읽습니다.
2. ✅ 상태인 항목들을 제거합니다.
3. 남은 항목들의 번호를 1부터 재정렬합니다.
4. 진행 상황 갱신.
5. Edit 도구로 TODO.md 수정.
6. 제거된 항목 수를 사용자에게 알립니다.
