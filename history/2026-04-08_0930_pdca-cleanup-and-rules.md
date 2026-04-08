# PDCA 잔존 참조 정리 + 필수 원칙 2개 추가

## 지시 요약
스킬 코드에 남아있던 PDCA 참조 전량 제거. resources/CLAUDE.md에 필수 원칙 2개 추가.

## 작업 내용

### 1. PDCA 잔존 참조 제거 (6파일)
- `lk-plan/SKILL.md` — pdca-status.json 읽기/갱신 제거, `/lk-pdca design` 안내 제거
- `lk-plan-cross-review/SKILL.md` — `/lk-pdca design` 안내 제거
- `lk-todo/SKILL.md` — `/lk-pdca analyze` 안내 제거
- `lk-team/SKILL.md` — `pdca-verify` 프리셋 → `quality-check`로 변경
- `output-styles/lk-mentor.md` — PDCA 비유 예시 → API 비유로 교체
- `README.md` — v2.0.0/PDCA 내용 → v3.0.0/하네스 엔지니어링으로 전면 갱신

### 2. 필수 원칙 추가 (resources/CLAUDE.md)
- **#5 할 일을 미루지 말 것**: 발견된 문제 즉시 수정, "나중에" 금지, 부분 완료 금지
- **#6 사용자 지적 시 소스 코드 재탐색**: 기존 판단 우기지 않기, 반드시 코드를 다시 읽고 확인

## 결과
- `grep -ri "pdca" leeloo-kit/` → No matches found (완전 정리)
- resources/CLAUDE.md 필수 원칙 4개 → 6개
