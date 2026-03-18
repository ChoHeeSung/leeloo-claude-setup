---
name: lk-n8n-setup
description: "n8n MCP 서버 상태 확인 및 설치 가이드. /lk-n8n-setup [status|install]"
user_invocable: true
argument-hint: "[status|install]"
---

# /lk-n8n-setup — n8n MCP 연결 관리

n8n MCP 서버의 연결 상태를 확인하고, 미설치 시 설치를 안내합니다.

## 서브커맨드

```
/lk-n8n-setup           — MCP 연결 상태 확인 (기본 동작 = status)
/lk-n8n-setup status    — MCP 연결 상태 + n8n 인스턴스 정보 표시
/lk-n8n-setup install   — n8n MCP 서버 설치 가이드 표시
```

## Procedure

### 인자 파싱

사용자 입력에서 서브커맨드를 파싱합니다:
- 인자 없음 또는 `status` → **status** 동작
- `install` → **install** 동작

---

### status 동작

1. **MCP 연결 확인**: `mcp__n8n-mcp__n8n_health_check` 도구를 `mode: "diagnostic"` 으로 호출합니다.

2. **결과 표시**:
   - 성공 시:
     ```
     n8n MCP 연결 상태

     | 항목 | 상태 |
     |------|------|
     | MCP 서버 | ✅ 연결됨 |
     | n8n 인스턴스 | ✅ {URL} |
     | API 버전 | {version} |

     n8n MCP가 정상 동작 중입니다.
     /n8n-workflow list 로 워크플로우를 확인해보세요.
     ```
   - 실패 시:
     ```
     n8n MCP 연결 상태

     | 항목 | 상태 |
     |------|------|
     | MCP 서버 | ❌ 연결 실패 |

     /lk-n8n-setup install 로 설치 가이드를 확인하세요.
     ```

---

### install 동작

다음 내용을 출력합니다:

```
n8n MCP 서버 설치 가이드

## 1. n8n MCP 서버 설치

npm install -g @anthropic/n8n-mcp

또는 npx로 실행:
npx @anthropic/n8n-mcp

## 2. Claude Code 설정

글로벌: ~/.claude/.mcp.json 또는 프로젝트: .mcp.json에 다음을 추가하세요:

{
  "mcpServers": {
    "n8n-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "MCP_MODE": "stdio",
        "N8N_API_URL": "http://localhost:5678",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}

## 3. n8n API 키 발급

n8n 웹 UI → Settings → API → Create API Key

## 4. 설치 확인

Claude Code를 재시작한 후 /lk-n8n-setup status 로 확인하세요.
```
