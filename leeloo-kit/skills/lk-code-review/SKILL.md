---
name: lk-code-review
description: "코드 리뷰 — Claude 단독 또는 Gemini 이중(--dual). /lk-code-review [--dual] [path]"
user_invocable: true
argument-hint: "[--dual] [path]"
---

# /lk-code-review — 코드 리뷰

Claude가 코드를 리뷰합니다. `--dual` 옵션으로 Gemini 이중 리뷰를 활성화할 수 있습니다.
문서(Plan/Design) 검증은 `/lk-plan-cross-review`를 사용하세요.

## 사용법

```
/lk-code-review                — Claude 단독 코드 리뷰 (git diff 기반)
/lk-code-review <path>         — 지정 파일 코드 리뷰
/lk-code-review --dual         — Gemini+Claude 이중 코드 리뷰
/lk-code-review --dual <path>  — 지정 파일 이중 코드 리뷰
```

## 출력

**Claude 단독 모드:**
- 코드 품질, 보안, 성능 분석
- Score Card + 권장 조치

**이중 모드 (--dual):**
- Claude 관점 요약
- Gemini 관점 요약
- 통합 Score Card (코드 품질, 보안, 성능)
- 합의 항목 / 불일치 항목

## Procedure

### 인자 파싱

사용자 입력에서 다음을 파싱합니다:
- `--dual` → Gemini 이중 리뷰 활성화
- 나머지 텍스트 → 파일 경로 (없으면 git diff 기반)

---

### gemini-cli 확인 (`--dual` 모드일 때만)

`--dual` 플래그가 있을 때만 Bash로 `command -v gemini` 실행하여 설치 여부 확인.

설치되지 않았으면:
```
gemini-cli가 설치되어 있지 않습니다.
설치 방법: npm install -g @google/gemini-cli
이중 리뷰는 gemini-cli가 필요합니다.
```
중단. (단독 모드로 전환하려면 `--dual` 없이 `/lk-code-review` 실행)

---

### code 모드

#### Step 1: 리뷰 대상 확보

- **파일 경로가 지정된 경우**: Read 도구로 해당 파일 읽기.
- **파일 경로가 없는 경우**: Bash로 `git diff HEAD` 실행하여 변경사항 수집.
  - 변경사항이 없으면 `git diff --staged` 시도.
  - 그래도 없으면: "리뷰할 코드 변경사항이 없습니다." 안내 후 중단.

#### Step 2: Claude 리뷰

다음 기준으로 코드를 분석합니다:

**코드 품질**
- 로직 정확성, 엣지 케이스
- 네이밍, 구조, 가독성

**보안**
- 인젝션 취약점
- 인증/인가 문제
- 민감 데이터 노출

**성능**
- 불필요한 반복, 메모리 누수
- 비효율적인 알고리즘

분석 결과를 내부적으로 정리합니다 (아직 출력하지 않음).

#### Step 3: Gemini 리뷰 (`--dual` 모드일 때만, 아니면 Step 4로 건너뜀)

Bash로 gemini-cli 실행:

```bash
timeout 120 gemini -p "$(cat <<'PROMPT_EOF'
당신은 시니어 코드 리뷰어입니다. 다음 코드 변경사항을 리뷰하세요.

리뷰 기준:
1. 코드 품질 (정확성, 가독성, 구조)
2. 보안 취약점 (OWASP Top 10 기준)
3. 성능 문제
4. 개선 제안

출력 형식:
## 발견 사항
- [심각도] 항목명: 설명

## Score Card
| 항목 | 점수 (1-10) |
|------|-----------|
| 코드 품질 | X |
| 보안 | X |
| 성능 | X |
| 종합 | X |

## 총평
(2-3문장)

---

# 리뷰 대상 코드

{코드 내용}
PROMPT_EOF
)" -o text
```

#### Step 4: 결과 출력

**단독 모드 (기본):**

```
## 코드 리뷰 결과

### Score Card

| 항목 | 점수 (1-10) |
|------|-----------|
| 코드 품질 | X |
| 보안 | X |
| 성능 | X |
| 종합 | X |

### 발견 사항
- [심각도] 항목명: 설명

### 권장 조치
1. {가장 중요한 수정 사항}
2. {두 번째 중요한 수정 사항}
```

**이중 모드 (`--dual`):**

```
## 이중 코드 리뷰 결과

### Claude 관점
{Claude 분석 결과}

---

### Gemini 관점
{Gemini 응답 내용}

---

### 통합 Score Card

| 항목 | Claude | Gemini | 합의 |
|------|--------|--------|------|
| 코드 품질 | X/10 | X/10 | X/10 |
| 보안 | X/10 | X/10 | X/10 |
| 성능 | X/10 | X/10 | X/10 |
| 종합 | X/10 | X/10 | X/10 |

### 합의 항목 (양쪽 모두 발견)
- {항목 1}

### 불일치 항목 (한쪽만 발견)
| 항목 | Claude | Gemini | Conflict Resolution |
|------|--------|--------|---------------------|
| ... | 발견 | 미발견 | {권장 조치} |

### 권장 조치 우선순위
1. {가장 중요한 수정 사항}
2. {두 번째 중요한 수정 사항}
```

---

### 참고

- 문서(Plan/Design) 검증은 `/lk-plan-cross-review`를 사용하세요.
- 코드 리뷰 후 수정이 필요하면 `/lk-commit`으로 커밋할 수 있습니다.
