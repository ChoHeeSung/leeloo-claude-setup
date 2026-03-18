---
name: lk-n8n-run
description: "n8n 워크플로우 실행 및 실행기록 관리. /lk-n8n-run [test|list|get|delete]"
user_invocable: true
argument-hint: "[test|list|get|delete] [args]"
---

# /lk-n8n-run — 워크플로우 실행 및 실행기록

워크플로우를 실행하고, 실행 기록을 조회/관리합니다.

## 서브커맨드

```
/lk-n8n-run test <id>            — 워크플로우 실행 (트리거 타입 자동 감지)
/lk-n8n-run list [workflow-id]   — 실행기록 목록 조회
/lk-n8n-run get <execution-id>   — 실행기록 상세 조회
/lk-n8n-run delete <execution-id> — 실행기록 삭제
```

## Procedure

### MCP 사전 체크

1. `mcp__n8n-mcp__n8n_health_check` 호출.
   - 실패 시: "n8n MCP 서버가 설정되지 않았습니다. `/n8n-setup install` 을 먼저 실행하세요." 안내 후 중단.

### 인자 파싱

- `test <id>` → **test** 동작
- 인자 없음 또는 `list` → **list** 동작
- `get <execution-id>` → **get** 동작
- `delete <execution-id>` → **delete** 동작

---

### test 동작

1. `mcp__n8n-mcp__n8n_test_workflow` 를 `workflowId` 로 호출.
   - 트리거 타입은 자동 감지됩니다.
   - webhook 트리거인 경우 AskUserQuestion으로 payload 입력 요청.
   - chat 트리거인 경우 AskUserQuestion으로 메시지 입력 요청.
2. 실행 결과를 표시:
   ```
   워크플로우 실행 결과

   | 항목 | 값 |
   |------|-----|
   | 워크플로우 | {name} (ID: {id}) |
   | 상태 | ✅ 성공 / ❌ 실패 |
   | 실행 시간 | {duration} |
   ```
3. 실패 시 에러 상세 표시.
4. 안내: "실행기록: `/lk-n8n-run list {id}` | 검증: `/n8n-validate check {id}`"

---

### list 동작

1. `mcp__n8n-mcp__n8n_executions` 를 `action: "list"` 로 호출.
   - workflow-id가 지정되면 `workflowId` 필터 적용.
2. 실행기록을 테이블로 표시:
   ```
   | 실행 ID | 워크플로우 | 상태 | 실행일 |
   |---------|----------|------|--------|
   ```

---

### get 동작

1. `mcp__n8n-mcp__n8n_executions` 를 `action: "get"`, `id`, `mode: "summary"` 로 호출.
2. 실행 상세 정보를 표시:
   - 각 노드별 입출력 데이터 요약
   - 에러 발생 노드 하이라이트
3. 에러가 있는 경우 `mode: "error"` 로 재호출하여 에러 디버깅 정보 표시.

---

### delete 동작

1. AskUserQuestion — "실행기록 {id}를 삭제하시겠습니까? (삭제/취소)"
2. "삭제" 선택 시 `mcp__n8n-mcp__n8n_executions` 를 `action: "delete"`, `id` 로 호출.
3. 삭제 완료 안내.
