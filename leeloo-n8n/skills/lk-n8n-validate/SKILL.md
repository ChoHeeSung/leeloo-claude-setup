---
name: lk-n8n-validate
description: "n8n 워크플로우 검증 및 자동수정. /lk-n8n-validate [check|fix|lint]"
user_invocable: true
argument-hint: "[check|fix|lint] <workflow-id>"
---

# /lk-n8n-validate — 워크플로우 검증 및 자동수정

워크플로우의 구조, 연결, 표현식을 검증하고 자동으로 수정합니다.

## 서브커맨드

```
/lk-n8n-validate check <id>    — 워크플로우 검증 (ID 기반)
/lk-n8n-validate fix <id>      — 자동수정 미리보기 + 적용
/lk-n8n-validate lint           — 워크플로우 JSON을 직접 입력하여 검증
```

## Procedure

### MCP 사전 체크

1. `mcp__n8n-mcp__n8n_health_check` 호출.
   - 실패 시: "n8n MCP 서버가 설정되지 않았습니다. `/n8n-setup install` 을 먼저 실행하세요." 안내 후 중단.

### 인자 파싱

- 인자 없음 → 사용법 안내 후 중단
- `check <id>` → **check** 동작
- `fix <id>` → **fix** 동작
- `lint` → **lint** 동작

---

### check 동작

1. `mcp__n8n-mcp__n8n_validate_workflow` 를 `id`, `options: { profile: "ai-friendly" }` 로 호출.
2. 결과를 분류하여 표시:
   ```
   워크플로우 검증 결과 (ID: {id})

   ❌ 오류 ({n}건)
   - {오류 내용}

   ⚠️ 경고 ({n}건)
   - {경고 내용}

   💡 제안 ({n}건)
   - {제안 내용}
   ```
3. 오류가 있으면: "자동수정: `/lk-n8n-validate fix {id}`"

---

### fix 동작

1. `mcp__n8n-mcp__n8n_autofix_workflow` 를 `id`, `applyFixes: false` (미리보기) 로 호출.
2. 수정 가능 항목을 표시:
   ```
   자동수정 미리보기 (ID: {id})

   | # | 수정 타입 | 내용 | 신뢰도 |
   |---|----------|------|--------|
   ```
3. AskUserQuestion — "수정을 적용하시겠습니까? (적용/취소)"
4. "적용" 선택 시 `applyFixes: true` 로 재호출.
5. 적용 결과 표시.
6. 안내: "재검증: `/lk-n8n-validate check {id}`"

---

### lint 동작

1. AskUserQuestion — "검증할 워크플로우 JSON을 입력하세요:"
2. 입력된 JSON을 파싱합니다.
3. `mcp__n8n-mcp__validate_workflow` 를 `workflow` 파라미터로 호출 (JSON 직접 검증).
4. check 동작과 동일한 형식으로 결과 표시.
