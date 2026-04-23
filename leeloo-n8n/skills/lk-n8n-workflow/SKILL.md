---
name: lk-n8n-workflow
description: "n8n 워크플로우 CRUD 관리"
user_invocable: true
argument-hint: "[create|get|list|update|delete] [args]"
---

# /lk-n8n-workflow — 워크플로우 관리

n8n 워크플로우의 생성, 조회, 수정, 삭제를 수행합니다.

## 서브커맨드

```
/lk-n8n-workflow list                    — 워크플로우 목록 조회
/lk-n8n-workflow get <id>                — 워크플로우 상세 조회
/lk-n8n-workflow create <name>           — 새 워크플로우 생성
/lk-n8n-workflow update <id>             — 워크플로우 수정 (대화형)
/lk-n8n-workflow delete <id>             — 워크플로우 삭제
```

## Procedure

### MCP 사전 체크

1. `mcp__n8n-mcp__n8n_health_check` 호출.
   - 실패 시: "n8n MCP 서버가 설정되지 않았습니다. `/n8n-setup install` 을 먼저 실행하세요." 안내 후 중단.

### 인자 파싱

사용자 입력에서 서브커맨드를 파싱합니다:
- 인자 없음 또는 `list` → **list** 동작
- `get <id>` → **get** 동작
- `create <name>` → **create** 동작
- `update <id>` → **update** 동작
- `delete <id>` → **delete** 동작

---

### list 동작

1. `mcp__n8n-mcp__n8n_list_workflows` 호출.
2. 결과를 테이블로 표시:
   ```
   | ID | 이름 | 활성 | 태그 | 수정일 |
   |----|------|------|------|--------|
   ```
3. 안내: "상세 조회: `/lk-n8n-workflow get <id>`"

---

### get 동작

1. `mcp__n8n-mcp__n8n_get_workflow` 를 `id`, `mode: "details"` 로 호출.
2. 워크플로우 정보를 구조화하여 표시:
   - 기본 정보 (이름, ID, 활성 여부, 생성/수정일)
   - 노드 목록 (이름, 타입)
   - 연결 구조 요약
3. 안내: "실행: `/n8n-run test <id>` | 검증: `/n8n-validate check <id>`"

---

### create 동작

1. 사용자가 제공한 이름으로 기본 워크플로우 구조를 구성합니다.
2. AskUserQuestion — "워크플로우의 트리거 타입을 선택하세요:"
   - Manual Trigger (기본)
   - Webhook Trigger
   - Schedule Trigger
   - Chat Trigger
3. 선택된 트리거에 맞는 시작 노드를 포함하여 `mcp__n8n-mcp__n8n_create_workflow` 호출.
4. 생성된 워크플로우 ID와 정보 표시.
5. 안내: "노드 추가: `/lk-n8n-workflow update <id>` | 노드 검색: `/n8n-node search <keyword>`"

---

### update 동작

1. `mcp__n8n-mcp__n8n_get_workflow` 로 현재 워크플로우 조회.
2. 현재 구조를 사용자에게 표시.
3. AskUserQuestion — "어떤 수정을 하시겠습니까?"
   - 노드 추가
   - 노드 제거
   - 노드 설정 변경
   - 워크플로우 이름 변경
   - 활성/비활성 전환
4. 선택에 따라 `mcp__n8n-mcp__n8n_update_partial_workflow` 호출.
5. 수정 결과 표시.

---

### delete 동작

1. `mcp__n8n-mcp__n8n_get_workflow` 로 워크플로우 정보 조회하여 이름 확인.
2. AskUserQuestion — "워크플로우 '{이름}' (ID: {id})을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다. (삭제/취소)"
3. "삭제" 선택 시 `mcp__n8n-mcp__n8n_delete_workflow` 호출.
4. 삭제 완료 안내.
