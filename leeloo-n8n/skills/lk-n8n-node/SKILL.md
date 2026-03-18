---
name: lk-n8n-node
description: "n8n 노드 검색, 정보 조회, 설정 검증. /lk-n8n-node [search|info|check]"
user_invocable: true
argument-hint: "[search|info|check] <query|nodeType>"
---

# /lk-n8n-node — 노드 검색 및 정보

n8n 노드를 검색하고, 상세 정보를 조회하고, 설정을 검증합니다.

## 서브커맨드

```
/lk-n8n-node search <keyword>       — 노드 키워드 검색
/lk-n8n-node info <nodeType>        — 노드 상세 정보 + 문서
/lk-n8n-node check <nodeType>       — 노드 설정 검증
```

## Procedure

### MCP 사전 체크

1. `mcp__n8n-mcp__n8n_health_check` 호출.
   - 실패 시: "n8n MCP 서버가 설정되지 않았습니다. `/n8n-setup install` 을 먼저 실행하세요." 안내 후 중단.

### 인자 파싱

- 인자 없음 → 사용법 안내 후 중단
- `search <keyword>` → **search** 동작
- `info <nodeType>` → **info** 동작
- `check <nodeType>` → **check** 동작

---

### search 동작

1. `mcp__n8n-mcp__search_nodes` 를 `query`, `includeExamples: true` 로 호출.
2. 결과를 테이블로 표시:
   ```
   노드 검색 결과: "{keyword}"

   | 노드 타입 | 이름 | 설명 | 소스 |
   |----------|------|------|------|
   ```
3. 안내: "상세 정보: `/lk-n8n-node info <nodeType>`"

---

### info 동작

1. `mcp__n8n-mcp__get_node` 를 `nodeType`, `mode: "docs"`, `detail: "standard"` 로 호출.
2. 노드 문서를 구조화하여 표시:
   - 기본 정보 (이름, 타입, 카테고리)
   - 주요 파라미터
   - 사용 예시
3. 안내: "설정 검증: `/lk-n8n-node check <nodeType>` | 템플릿에서 사용 예: `/n8n-template search`"

---

### check 동작

1. AskUserQuestion — "검증할 노드 설정(JSON)을 입력하세요. 예: `{\"resource\": \"channel\", \"operation\": \"create\"}`"
2. `mcp__n8n-mcp__validate_node` 를 `nodeType`, `config`, `mode: "full"` 로 호출.
3. 검증 결과를 표시:
   ```
   노드 설정 검증: {nodeType}

   ❌ 오류: {내용}
   ⚠️ 경고: {내용}
   💡 제안: {내용}
   ```
