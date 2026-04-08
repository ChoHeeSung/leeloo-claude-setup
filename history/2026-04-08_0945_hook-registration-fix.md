# plugin.json hooks 등록 누락 수정

## 지시 요약
PostToolUse hook이 실행되지 않는 문제 진단 및 수정.

## 작업 내용

### 원인 분석
- plugin.json에 `"hooks"` 필드가 없어서 Claude Code가 hooks.json을 로드하지 않았음
- hooks.json 파일은 존재했지만, plugin.json에서 참조하지 않으면 자동 로드되지 않음
- 결과: SessionStart hook만 (다른 경로로) 실행되고, PostToolUse/PreToolUse/Stop hook은 미실행

### 수정
1. `plugin.json`에 `"hooks": "./hooks/hooks.json"` 추가
2. `bash-post.js`에서 `tool_response`/`tool_result`/`exitCode` 필드명 호환성 개선

## 현실 비유
플러그인에 문을 달았는데(hooks.json) 건물 안내도(plugin.json)에 문 위치를 표시하지 않아서
방문객(Claude Code)이 문을 찾지 못한 상황.

## 결과
- plugin.json에 hooks 필드 추가로 모든 hook 이벤트 정상 등록
