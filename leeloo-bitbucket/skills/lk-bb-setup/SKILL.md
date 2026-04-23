---
name: lk-bb-setup
description: "Bitbucket 연결 확인·초기 설정"
user_invocable: true
argument-hint: "[status|install]"
---

# /lk-bb-setup — Bitbucket 연결 관리

Bitbucket Cloud API 연결 상태를 확인하고, 대화형으로 초기 설정을 진행합니다.
설정은 `~/.claude/leeloo-bitbucket.local.md`에 YAML frontmatter로 저장됩니다.

## 서브커맨드

```
/lk-bb-setup           — 연결 상태 확인 (기본 동작 = status)
/lk-bb-setup status    — 연결 상태 + 워크스페이스 정보 표시
/lk-bb-setup install   — 대화형 초기 설정
```

## 설정 파일

경로: `~/.claude/leeloo-bitbucket.local.md`

```yaml
---
bitbucket_user_email: "user@example.com"
bitbucket_api_token: "ATATT3x..."
bitbucket_workspace: "myworkspace"
---
```

| 필드 | 용도 |
|------|------|
| `bitbucket_user_email` | 사용자 이메일 (Basic Auth) |
| `bitbucket_api_token` | Atlassian API 토큰 |
| `bitbucket_workspace` | 워크스페이스 slug |

## Procedure

### 인자 파싱

사용자 입력에서 서브커맨드를 파싱합니다:
- 인자 없음 또는 `status` → **status** 동작
- `install` → **install** 동작

---

### status 동작

1. **설정 파일 읽기**: Read 도구로 `~/.claude/leeloo-bitbucket.local.md` 읽기.
   - 파일이 없으면:
     ```
     Bitbucket 설정 파일이 없습니다.
     /lk-bb-setup install 로 초기 설정을 진행하세요.
     ```
     중단.

2. **YAML frontmatter 파싱**: `---` 블록에서 3개 필드를 추출합니다.

3. **설정값 확인**:
   ```
   Bitbucket 연결 상태

   | 항목 | 상태 |
   |------|------|
   | 이메일 | ✅ {값} / ❌ 미설정 |
   | API Token | ✅ 설정됨 / ❌ 미설정 |
   | Workspace | ✅ {값} / ❌ 미설정 |
   ```
   - 하나라도 미설정이면 `/lk-bb-setup install` 안내 후 중단.

4. **API 연결 테스트**: 모두 설정되어 있으면 Bash로 실행:
   ```bash
   curl -s -w "\nHTTP_STATUS:%{http_code}" -u "{이메일}:{토큰}" "https://api.bitbucket.org/2.0/repositories/{워크스페이스}?pagelen=1"
   ```

5. **결과 표시**:
   - HTTP 200:
     ```
     | API 연결 | ✅ 정상 |

     /lk-bb-repo list 로 저장소 목록을 확인해보세요.
     ```
   - HTTP 401/403: "API 연결 실패 — 인증 오류. API 토큰을 확인하세요."
   - HTTP 404: "API 연결 실패 — 워크스페이스를 찾을 수 없습니다."
   - 기타: "API 연결 실패 — HTTP {코드}"

---

### install 동작

대화형으로 Bitbucket 연결 정보를 수집하고 설정 파일에 저장합니다.

#### Step 1: 이메일 입력

AskUserQuestion:
- Header: "이메일"
- Question: "Bitbucket 계정 이메일을 입력하세요:"
- Options: 직접 입력

#### Step 2: API Token 입력

AskUserQuestion:
- Header: "API Token"
- Question: "Bitbucket API Token을 입력하세요:"
- Description: "발급: Bitbucket → Repository/Workspace Settings → Access tokens → Create"
- Options: 직접 입력, "나중에 설정"

#### Step 3: Workspace 입력

AskUserQuestion:
- Header: "Workspace"
- Question: "Bitbucket Workspace 이름(slug)을 입력하세요:"
- Description: "URL에서 확인: https://bitbucket.org/{workspace}"
- Options: 직접 입력

- URL이 입력된 경우 (https://bitbucket.org/xxx), slug 부분만 추출하여 사용.

#### Step 4: 설정 파일 저장

Write 도구로 `~/.claude/leeloo-bitbucket.local.md`에 저장:

```markdown
---
bitbucket_user_email: "{입력된이메일}"
bitbucket_api_token: "{입력된토큰}"
bitbucket_workspace: "{입력된워크스페이스}"
---

# Bitbucket 설정

lk-bb-setup install로 생성된 설정 파일입니다.
수동으로 편집하거나 /lk-bb-setup install로 재설정할 수 있습니다.
```

- "나중에 설정" 선택 시 `bitbucket_api_token: ""` 으로 저장.
- 파일이 이미 존재하면 AskUserQuestion — "기존 설정이 있습니다. 덮어쓸까요? (덮어쓰기/취소)"

#### Step 5: 연결 테스트

토큰이 설정된 경우, Bash로 실행:
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" -u "{이메일}:{토큰}" "https://api.bitbucket.org/2.0/repositories/{워크스페이스}?pagelen=1"
```

#### Step 6: 결과 안내

```
Bitbucket 초기 설정 완료

| 항목 | 값 |
|------|-----|
| 이메일 | {이메일} |
| API Token | 설정됨 / 미설정 |
| Workspace | {워크스페이스} |
| 설정 파일 | ~/.claude/leeloo-bitbucket.local.md |
| 연결 테스트 | ✅ 성공 / ❌ 실패 / ⏭️ 건너뜀 |

다음 단계: /lk-bb-repo list 로 저장소 목록을 확인하세요.
```
