---
name: lk-n8n-docs
description: "n8n MCP 도구 문서 조회"
user_invocable: true
argument-hint: "[topic]"
---

# /lk-n8n-docs — n8n MCP 도구 문서

n8n MCP 도구의 문서와 사용법을 조회합니다.

## 서브커맨드

```
/lk-n8n-docs                  — 전체 도구 목록 + 퀵스타트 가이드
/lk-n8n-docs <topic>          — 특정 도구의 상세 문서 (예: n8n_create_workflow)
```

## Procedure

### MCP 사전 체크

1. `mcp__n8n-mcp__n8n_health_check` 호출.
   - 실패 시: "n8n MCP 서버가 설정되지 않았습니다. `/n8n-setup install` 을 먼저 실행하세요." 안내 후 중단.

### 인자 파싱

- 인자 없음 → **overview** 동작
- `<topic>` → **topic** 동작

---

### overview 동작

1. `mcp__n8n-mcp__tools_documentation` 를 파라미터 없이 호출 (퀵스타트 가이드).
2. 추가로 leeloo-n8n skill 매핑 테이블을 표시:
   ```
   leeloo-n8n 스킬 가이드

   | 스킬 | 용도 | 예시 |
   |------|------|------|
   | /n8n-setup | MCP 연결 관리 | /n8n-setup status |
   | /n8n-workflow | 워크플로우 CRUD | /n8n-workflow list |
   | /n8n-run | 실행 및 기록 | /n8n-run test 123 |
   | /n8n-validate | 검증 및 수정 | /n8n-validate check 123 |
   | /n8n-node | 노드 검색/정보 | /n8n-node search slack |
   | /n8n-template | 템플릿 관리 | /n8n-template search chatbot |
   | /n8n-version | 버전 관리 | /n8n-version list 123 |
   | /lk-n8n-docs | 문서 조회 | /lk-n8n-docs |
   ```

---

### topic 동작

1. `mcp__n8n-mcp__tools_documentation` 를 `topic`, `depth: "full"` 로 호출.
2. 해당 도구의 상세 문서를 표시.
