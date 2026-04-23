---
name: lk-n8n-setup
description: "n8n MCP 서버 상태 확인·설치"
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

1. **n8n 접속 정보 입력**: AskUserQuestion 2개를 한 번에 질문합니다:
   - "n8n API URL을 입력하세요 (예: http://localhost:5678):" — Header: "API URL"
     - 옵션: "http://localhost:5678 (기본)", 직접 입력
   - "n8n API Key를 입력하세요:" — Header: "API Key"
     - 옵션: "나중에 설정", 직접 입력

2. **설치 범위 선택**: AskUserQuestion — "MCP 서버를 어디에 설정할까요?"
   - Header: "설치 범위"
   - 옵션:
     - "글로벌 (권장)" — 설명: "~/.claude.json에 추가. 모든 프로젝트에서 사용 가능"
     - "프로젝트" — 설명: "현재 프로젝트 .mcp.json에 추가. 팀원과 공유됨 (API Key 제외)"

3. **설정 적용**:

   **글로벌 선택 시**: Bash로 다음 명령 실행:
   ```bash
   claude mcp add n8n-mcp --scope user -e MCP_MODE=stdio -e N8N_API_URL={입력된URL} -e N8N_API_KEY={입력된KEY} -- npx n8n-mcp
   ```

   **프로젝트 선택 시**: Bash로 다음 명령 실행:
   ```bash
   claude mcp add n8n-mcp --scope project -e MCP_MODE=stdio -e N8N_API_URL={입력된URL} -e N8N_API_KEY={입력된KEY} -- npx n8n-mcp
   ```

   - API Key를 "나중에 설정"으로 선택한 경우: `-e N8N_API_KEY=` 부분을 생략하고, 안내 메시지에 수동 설정 방법 포함.

4. **결과 안내**:
   ```
   n8n MCP 서버 설정 완료

   | 항목 | 값 |
   |------|-----|
   | 범위 | 글로벌 / 프로젝트 |
   | API URL | {URL} |
   | API Key | 설정됨 / 미설정 |

   Claude Code를 재시작한 후 /lk-n8n-setup status 로 연결을 확인하세요.

   API Key 발급: n8n 웹 UI → Settings → API → Create API Key
   ```
