# HISTORY.md 작성 규칙 변경 + lk-commit 워크플로우 개선

**날짜**: 2026-03-31 17:13

## 지시 요약

HISTORY.md가 매 작업마다 자동 작성되어 너무 빈번함. lk-commit 시 사용자 확인 후 선택적으로 작성하는 흐름으로 변경 요청.

## 작업 내용

### 변경 3곳

| 파일 | 변경 |
|------|------|
| `~/.claude/CLAUDE.md` | 원칙 #2: "누적 기록" → "lk-commit 시 확인 후 작성", HISTORY.md는 요약+참조만, 상세는 history/ 폴더 |
| `leeloo-kit/resources/CLAUDE.md` | 배포 템플릿 동기화 |
| `leeloo-kit/skills/lk-commit/SKILL.md` | Step 5 신규 "HISTORY.md 작성 여부 확인" 단계 추가 |

### 핵심 변경

**Before**: 매 작업마다 HISTORY.md + history/ 자동 작성
**After**: `/lk-commit` 실행 시 "작성/건너뛰기" 확인 → 승인 시에만 작성

비유: 매번 일기장에 적던 것을 → 퇴근(커밋) 시점에 "오늘 기록 남길까?" 물어보는 방식으로 변경. 불필요한 기록은 줄이고, 의미 있는 작업만 남긴다.

## 결과

- 글로벌 CLAUDE.md 원칙 #2 수정 완료
- 배포 템플릿 동기화 완료
- lk-commit SKILL.md Step 5 추가, 후속 단계 번호 재정렬 (6→7, 7→8, 8→9, 9→10)
