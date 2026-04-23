---
name: lk-n8n-node
description: "n8n 노드 검색·조회·설정 검증"
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

### search 동작 (Haiku Task)

1. `mcp__n8n-mcp__search_nodes` 를 `query`, `includeExamples: true` 로 호출.
2. MCP 응답의 테이블 포맷팅은 Haiku 서브 에이전트에 위임한다.

**Agent tool 호출:**
- `subagent_type`: `task`
- `task_model`: `haiku`
- `prompt`:

```
아래 n8n 노드 검색 결과를 마크다운 테이블로 정리하라.

## 입력
### 검색어
{keyword}

### MCP 응답 (search_nodes 결과)
{mcp_response_json}

## 출력 형식
```
노드 검색 결과: "{keyword}"

| 노드 타입 | 이름 | 설명 | 소스 |
|----------|------|------|------|
| {nodeType} | {name} | {description} | {source} |

상세 정보: `/lk-n8n-node info <nodeType>`
```

## 규칙
- MCP 응답의 모든 노드를 누락 없이 포함.
- MCP 응답에 없는 값은 "-"로 표시.
- 설명이 너무 긴 경우 80자 이내로 자르고 말줄임표 추가.
```

**결과 검증 (메인 세션):**
- [ ] MCP 응답 노드 수 = 테이블 행 수
- [ ] 입력에 없는 노드 hallucination 없음

**품질 미달 시 폴백:** 메인 세션이 직접 포맷팅.

---

### info 동작 (Haiku Task)

1. `mcp__n8n-mcp__get_node` 를 `nodeType`, `mode: "docs"`, `detail: "standard"` 로 호출.
2. 노드 문서의 섹션 구조화는 Haiku 서브 에이전트에 위임한다.

**Agent tool 호출:**
- `subagent_type`: `task`
- `task_model`: `haiku`
- `prompt`:

```
아래 n8n 노드 문서를 구조화해 표시하라.

## 입력 (get_node 응답)
{mcp_response_json}

## 출력 형식
### 기본 정보
- 이름: ...
- 타입: ...
- 카테고리: ...

### 주요 파라미터
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|

### 사용 예시
```json
{...}
```

안내: "설정 검증: `/lk-n8n-node check <nodeType>` | 템플릿에서 사용 예: `/n8n-template search`"

## 규칙
- MCP 응답에 있는 정보만 사용.
- 없는 섹션은 건너뛴다 (빈 섹션 출력 금지).
```

**결과 검증 (메인 세션):**
- [ ] 응답 주요 필드(name, type, category)가 누락되지 않음
- [ ] 예시가 응답 원문과 일치

**품질 미달 시 폴백:** 메인 세션이 직접 표시.

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
