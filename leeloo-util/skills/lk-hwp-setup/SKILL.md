---
name: lk-hwp-setup
description: "leeloo-hwp(HWP/HWPX/PDF 파서) 설치 및 상태 확인. /lk-hwp-setup [status|install]"
user_invocable: true
argument-hint: "[status|install]"
---

# /lk-hwp-setup — leeloo-hwp 설치 관리

HWP/HWPX/PDF 공문서 파싱 도구 `leeloo-hwp`의 설치 여부를 확인하고,
미설치 시 npm을 통해 글로벌 설치합니다.

## 서브커맨드

```
/lk-hwp-setup           — 설치 상태 확인 (기본 동작 = status)
/lk-hwp-setup status    — 설치 여부 및 버전 표시
/lk-hwp-setup install   — leeloo-hwp 글로벌 설치
```

## Procedure

### 인자 파싱

사용자 입력에서 서브커맨드를 파싱합니다:
- 인자 없음 또는 `status` → **status** 동작
- `install` → **install** 동작

---

### status 동작

1. **설치 여부 확인**: Bash로 실행:
   ```bash
   which leeloo-hwp 2>/dev/null && leeloo-hwp --version 2>/dev/null || echo "NOT_INSTALLED"
   ```

2. **결과 표시**:
   - 설치된 경우:
     ```
     leeloo-hwp 설치 상태

     | 항목 | 상태 |
     |------|------|
     | 설치 여부 | ✅ 설치됨 |
     | 경로 | {which 결과} |
     | 버전 | {--version 결과} |

     /lk-hwp-parse <file> 로 문서를 파싱할 수 있습니다.
     ```
   - 미설치된 경우:
     ```
     leeloo-hwp가 설치되어 있지 않습니다.
     /lk-hwp-setup install 로 설치하세요.
     ```

---

### install 동작

1. **npm 설치 실행**: Bash로 실행:
   ```bash
   npm install -g git+https://bitbucket.org/leeloocoltd/leeloo-hwp.git 2>&1
   ```

2. **권한 오류 처리**:
   - 출력에 `EACCES` 또는 `permission denied`가 포함된 경우:
     ```
     권한 오류가 발생했습니다. 아래 명령어로 재시도하세요:

     sudo npm install -g git+https://bitbucket.org/leeloocoltd/leeloo-hwp.git
     ```
     중단.

3. **설치 확인**: 설치 성공 후 Bash로 실행:
   ```bash
   leeloo-hwp --version 2>/dev/null || echo "VERSION_CHECK_FAILED"
   ```

4. **결과 안내**:
   - 버전 확인 성공:
     ```
     leeloo-hwp 설치 완료

     | 항목 | 상태 |
     |------|------|
     | 설치 | ✅ 성공 |
     | 버전 | {버전} |

     다음 단계: /lk-hwp-parse <file> 로 공문서를 파싱하세요.
     ```
   - 버전 확인 실패:
     ```
     설치는 완료되었으나 버전 확인에 실패했습니다.
     터미널을 재시작한 후 `leeloo-hwp --version`을 실행해 보세요.
     ```
