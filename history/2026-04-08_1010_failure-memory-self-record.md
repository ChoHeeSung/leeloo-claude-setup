# Failure Memory — hook 기반 → 자기 기록 방식 전환

## 지시 요약
PostToolUse hook의 tool_response에 stdout/stderr가 빈 문자열로 전달되어
Bash 실패를 hook에서 감지 불가능함을 확인. CLAUDE.md 자기 기록 방식으로 전환.

## 원인 분석
- Claude Code PostToolUse hook은 `tool_response.stdout`과 `tool_response.stderr`를 빈 문자열로 전달
- `exit_code` 필드도 존재하지 않음
- 따라서 hook에서 Bash 명령 실패 여부를 판단할 수 없음

## 변경 내용
1. `bash-post.js` — 에러 감지 로직 전체 제거, 침묵 처리로 단순화
2. `hooks.json` — PostToolUse(Bash) 항목 제거
3. `resources/CLAUDE.md` — Failure Memory 규칙 전면 재작성
   - 모든 유형(Bash/Write/Edit/MCP/judgment)을 Claude 자기 기록으로 통합
   - 유형별 분류 규칙, 기록 형식, 기록 절차 상세 정의
   - 글로벌 CLAUDE.md 수정 금지 명시
4. `leeloo-kit/CLAUDE.md` — Architecture 섹션 업데이트

## 현실 비유
자동 감시 카메라(hook)가 사각지대가 너무 많아서, 대신 경비원(Claude)이 직접
순찰하며 문제를 발견하면 보고서에 기록하는 방식으로 전환한 것.
