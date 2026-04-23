---
name: lk-n8n-version
description: "n8n 워크플로우 버전 관리(롤백·정리)"
user_invocable: true
argument-hint: "[list|get|rollback|prune] <workflow-id>"
---

# /lk-n8n-version — 워크플로우 버전 관리

워크플로우의 버전 히스토리를 조회하고, 이전 버전으로 롤백하거나, 오래된 버전을 정리합니다.

## 서브커맨드

```
/lk-n8n-version list <workflow-id>              — 버전 히스토리 조회
/lk-n8n-version get <workflow-id> <version-id>  — 특정 버전 상세 조회
/lk-n8n-version rollback <workflow-id>          — 이전 버전으로 롤백
/lk-n8n-version prune <workflow-id>             — 오래된 버전 정리
```

## Procedure

### MCP 사전 체크

1. `mcp__n8n-mcp__n8n_health_check` 호출.
   - 실패 시: "n8n MCP 서버가 설정되지 않았습니다. `/n8n-setup install` 을 먼저 실행하세요." 안내 후 중단.

### 인자 파싱

- 인자 없음 → 사용법 안내 후 중단
- `list <workflow-id>` → **list** 동작
- `get <workflow-id> <version-id>` → **get** 동작
- `rollback <workflow-id>` → **rollback** 동작
- `prune <workflow-id>` → **prune** 동작

---

### list 동작

1. `mcp__n8n-mcp__n8n_workflow_versions` 를 `mode: "list"`, `workflowId` 로 호출.
2. 버전 목록을 테이블로 표시:
   ```
   워크플로우 버전 히스토리 (ID: {workflow-id})

   | 버전 ID | 생성일 | 노드 수 |
   |---------|--------|---------|
   ```

---

### get 동작

1. `mcp__n8n-mcp__n8n_workflow_versions` 를 `mode: "get"`, `workflowId`, `versionId` 로 호출.
2. 해당 버전의 상세 정보 표시.

---

### rollback 동작

1. 먼저 `mode: "list"` 로 버전 목록 조회하여 표시.
2. AskUserQuestion — "롤백할 버전을 선택하세요 (버전 ID 입력):"
3. `mcp__n8n-mcp__n8n_workflow_versions` 를 `mode: "rollback"`, `workflowId`, `versionId` 로 호출.
   - `validateBefore: true` 로 롤백 전 검증.
4. 롤백 결과 표시 (백업 생성 여부 포함).

---

### prune 동작

1. AskUserQuestion — "최근 몇 개 버전을 유지하시겠습니까? (기본: 10)"
2. `mcp__n8n-mcp__n8n_workflow_versions` 를 `mode: "prune"`, `workflowId`, `maxVersions` 로 호출.
3. 정리 결과 표시 (삭제된 버전 수).
