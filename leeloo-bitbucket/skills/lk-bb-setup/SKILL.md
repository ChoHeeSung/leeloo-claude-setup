---
name: lk-bb-setup
description: "Bitbucket 연결 확인 및 대화형 초기 설정. /lk-bb-setup [status|install]"
user_invocable: true
argument-hint: "[status|install]"
---

# /lk-bb-setup — Bitbucket 연결 관리

Bitbucket Cloud API 연결 상태를 확인하고, 대화형으로 초기 설정을 진행합니다.

## 서브커맨드

```
/lk-bb-setup           — 연결 상태 확인 (기본 동작 = status)
/lk-bb-setup status    — 연결 상태 + 워크스페이스 정보 표시
/lk-bb-setup install   — 대화형 초기 설정
```

## 환경변수

| 변수 | 용도 |
|------|------|
| `BITBUCKET_USER_EMAIL` | 사용자 이메일 |
| `BITBUCKET_API_TOKEN` | Atlassian API 토큰 (Basic Auth) |
| `BITBUCKET_WORKSPACE` | 워크스페이스 이름 |

## Procedure

### 인자 파싱

사용자 입력에서 서브커맨드를 파싱합니다:
- 인자 없음 또는 `status` → **status** 동작
- `install` → **install** 동작

---

### status 동작

1. **환경변수 확인**: Bash로 다음 명령 실행:
   ```bash
   echo "EMAIL=${BITBUCKET_USER_EMAIL:-NOT_SET}" && echo "TOKEN=${BITBUCKET_API_TOKEN:+SET}" && echo "TOKEN=${BITBUCKET_API_TOKEN:-NOT_SET}" && echo "WORKSPACE=${BITBUCKET_WORKSPACE:-NOT_SET}"
   ```
   - TOKEN은 값 자체를 출력하지 않고 SET/NOT_SET만 확인.

2. **환경변수 하나라도 미설정 시**:
   ```
   Bitbucket 연결 상태

   | 항목 | 상태 |
   |------|------|
   | BITBUCKET_USER_EMAIL | ✅ {값} / ❌ 미설정 |
   | BITBUCKET_API_TOKEN | ✅ 설정됨 / ❌ 미설정 |
   | BITBUCKET_WORKSPACE | ✅ {값} / ❌ 미설정 |

   /lk-bb-setup install 로 초기 설정을 진행하세요.
   ```
   중단.

3. **API 연결 테스트**: 환경변수가 모두 설정되어 있으면 Bash로 실행:
   ```bash
   curl -s -w "\nHTTP_STATUS:%{http_code}" -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE?pagelen=1"
   ```

4. **결과 표시**:
   - HTTP 200:
     ```
     Bitbucket 연결 상태

     | 항목 | 상태 |
     |------|------|
     | BITBUCKET_USER_EMAIL | ✅ {이메일} |
     | BITBUCKET_API_TOKEN | ✅ 설정됨 |
     | BITBUCKET_WORKSPACE | ✅ {워크스페이스} |
     | API 연결 | ✅ 정상 |

     /lk-bb-repo list 로 저장소 목록을 확인해보세요.
     ```
   - HTTP 401/403:
     ```
     API 연결 실패 — 인증 오류 (HTTP {코드})
     API 토큰을 확인하세요. Bitbucket → Settings → Access tokens
     ```
   - HTTP 404:
     ```
     API 연결 실패 — 워크스페이스를 찾을 수 없습니다 (HTTP 404)
     BITBUCKET_WORKSPACE 값을 확인하세요.
     ```
   - 기타:
     ```
     API 연결 실패 — HTTP {코드}
     네트워크 연결 또는 API 토큰을 확인하세요.
     ```

---

### install 동작

대화형으로 Bitbucket 연결 정보를 수집하고 환경변수를 설정합니다.

#### Step 1: 이메일 입력

AskUserQuestion:
- Header: "Bitbucket 이메일"
- Question: "Bitbucket 계정 이메일을 입력하세요:"
- Options: 직접 입력

#### Step 2: API Token 입력

AskUserQuestion:
- Header: "API Token"
- Question: "Bitbucket API Token을 입력하세요:"
- Description: "발급 방법: Bitbucket → Repository/Workspace Settings → Access tokens → Create"
- Options: 직접 입력, "나중에 설정"

#### Step 3: Workspace 입력

AskUserQuestion:
- Header: "Workspace"
- Question: "Bitbucket Workspace 이름(slug)을 입력하세요:"
- Description: "URL에서 확인: https://bitbucket.org/{workspace}"
- Options: 직접 입력

#### Step 4: 설치 범위 선택

AskUserQuestion:
- Header: "설치 범위"
- Question: "환경변수를 어디에 설정할까요?"
- Options:
  - "글로벌 (권장)" — 설명: "~/.zshrc에 추가. 모든 터미널에서 사용 가능"
  - "프로젝트" — 설명: "현재 프로젝트 .env에 추가. 팀원과 공유됨 (Token 제외)"

#### Step 5: 환경변수 저장

**글로벌 선택 시**: Bash로 `~/.zshrc`에 추가:
```bash
# 이미 존재하는지 확인 후 추가
grep -q 'BITBUCKET_USER_EMAIL' ~/.zshrc 2>/dev/null || cat >> ~/.zshrc << 'ENVEOF'

# Bitbucket API Configuration (added by lk-bb-setup)
export BITBUCKET_USER_EMAIL="{입력된이메일}"
export BITBUCKET_API_TOKEN="{입력된토큰}"
export BITBUCKET_WORKSPACE="{입력된워크스페이스}"
ENVEOF
```
- 이미 존재하면 AskUserQuestion — "기존 Bitbucket 설정이 있습니다. 덮어쓸까요? (덮어쓰기/취소)"
- "덮어쓰기" 선택 시: Bash의 `sed`로 기존 값을 교체.

**프로젝트 선택 시**: Write 도구로 프로젝트 루트 `.env`에 추가:
```
BITBUCKET_USER_EMAIL={입력된이메일}
BITBUCKET_WORKSPACE={입력된워크스페이스}
```
- Token은 `.env`에 포함하지 않고 별도 안내:
  ```
  보안을 위해 API Token은 .env에 포함하지 않았습니다.
  터미널에서 직접 설정하세요:
  export BITBUCKET_API_TOKEN="{토큰}"
  ```

#### Step 6: 현재 세션에 환경변수 로드

Bash로 현재 세션에서 바로 사용 가능하도록:
```bash
export BITBUCKET_USER_EMAIL="{이메일}" && export BITBUCKET_API_TOKEN="{토큰}" && export BITBUCKET_WORKSPACE="{워크스페이스}"
```

#### Step 7: 연결 테스트

Bash로 실행:
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" -u "$BITBUCKET_USER_EMAIL:$BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_WORKSPACE?pagelen=1"
```

#### Step 8: 결과 안내

```
Bitbucket 초기 설정 완료

| 항목 | 값 |
|------|-----|
| 이메일 | {이메일} |
| API Token | 설정됨 / 미설정 |
| Workspace | {워크스페이스} |
| 범위 | 글로벌 / 프로젝트 |
| 연결 테스트 | ✅ 성공 / ❌ 실패 |

연결 테스트 실패 시:
- API Token 확인: Bitbucket → Settings → Access tokens
- Workspace 확인: URL에서 https://bitbucket.org/{workspace}

다음 단계: /lk-bb-repo list 로 저장소 목록을 확인하세요.
```
