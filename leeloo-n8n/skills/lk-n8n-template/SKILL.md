---
name: lk-n8n-template
description: "n8n 템플릿 검색·조회·배포"
user_invocable: true
argument-hint: "[search|get|deploy] <query|id>"
---

# /lk-n8n-template — 템플릿 관리

n8n.io의 워크플로우 템플릿을 검색하고, 조회하고, 인스턴스에 배포합니다.

## 서브커맨드

```
/lk-n8n-template search <keyword>   — 템플릿 키워드 검색
/lk-n8n-template get <id>           — 템플릿 상세 조회
/lk-n8n-template deploy <id>        — 템플릿을 n8n 인스턴스에 배포
```

## Procedure

### MCP 사전 체크

1. `mcp__n8n-mcp__n8n_health_check` 호출.
   - 실패 시: "n8n MCP 서버가 설정되지 않았습니다. `/n8n-setup install` 을 먼저 실행하세요." 안내 후 중단.

### 인자 파싱

- 인자 없음 → 사용법 안내 후 중단
- `search <keyword>` → **search** 동작
- `get <id>` → **get** 동작
- `deploy <id>` → **deploy** 동작

---

### search 동작

1. `mcp__n8n-mcp__search_templates` 를 `query`, `searchMode: "keyword"` 로 호출.
2. 결과를 테이블로 표시:
   ```
   템플릿 검색 결과: "{keyword}"

   | ID | 이름 | 설명 | 조회수 |
   |----|------|------|--------|
   ```
3. 안내: "상세 조회: `/lk-n8n-template get <id>` | 배포: `/lk-n8n-template deploy <id>`"

---

### get 동작

1. `mcp__n8n-mcp__get_template` 를 `templateId`, `mode: "structure"` 로 호출.
2. 템플릿 정보를 표시:
   - 기본 정보 (이름, 작성자, 설명)
   - 노드 목록 및 연결 구조
   - 필요한 credential 목록
3. 안내: "이 템플릿 배포: `/lk-n8n-template deploy <id>`"

---

### deploy 동작

1. `mcp__n8n-mcp__get_template` 로 템플릿 정보 조회하여 이름 확인.
2. AskUserQuestion — "템플릿 '{이름}'을 n8n 인스턴스에 배포하시겠습니까? (배포/취소)"
   - 커스텀 이름을 지정하고 싶은 경우 직접 입력 가능.
3. "배포" 선택 시 `mcp__n8n-mcp__n8n_deploy_template` 를 `templateId` 로 호출.
   - `autoFix: true`, `autoUpgradeVersions: true`, `stripCredentials: true` 기본 적용.
4. 배포 결과 표시:
   ```
   템플릿 배포 완료

   | 항목 | 값 |
   |------|-----|
   | 워크플로우 ID | {id} |
   | 이름 | {name} |
   | 자동수정 | {적용된 수정 목록} |
   | 필요 credential | {목록} |

   n8n UI에서 credential을 설정한 후 활성화하세요.
   ```
5. 안내: "검증: `/n8n-validate check {id}` | 실행: `/n8n-run test {id}`"
