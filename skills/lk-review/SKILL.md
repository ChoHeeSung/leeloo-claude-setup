---
name: lk-review
description: "Gemini+Claude 이중 리뷰. /lk-review [code|plan] [path]"
user_invocable: true
argument-hint: "[code|plan] [path]"
---

# /lk-review — Gemini+Claude 이중 리뷰

Claude와 Gemini의 독립적인 리뷰를 통합하여 더 신뢰성 높은 검증을 수행합니다.

## 서브커맨드

```
/lk-review code           — git diff 기반 코드 변경사항 이중 리뷰
/lk-review code <path>    — 지정 파일 이중 리뷰
/lk-review plan           — 최근 Plan 문서 이중 리뷰
/lk-review plan <path>    — 지정 Plan 파일 이중 리뷰
```

## 출력

모든 리뷰 결과는 다음을 포함합니다:
- Claude 관점 요약
- Gemini 관점 요약
- 통합 Score Card
- 합의 항목 / 불일치 항목

## Procedure

### 인자 파싱

사용자 입력에서 다음을 파싱합니다:
- 첫 번째 인자: `code` 또는 `plan` (없으면 AskUserQuestion으로 선택)
- 두 번째 인자: 파일 경로 (선택)

모드를 파싱할 수 없으면:
- AskUserQuestion — "어떤 리뷰를 진행할까요? (code/plan)"

---

### gemini-cli 확인 (공통)

Bash로 `command -v gemini` 실행하여 설치 여부 확인.

설치되지 않았으면:
```
gemini-cli가 설치되어 있지 않습니다.
설치 방법: npm install -g @google/gemini-cli
이중 리뷰는 gemini-cli가 필요합니다.
```
중단.

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

#### Step 3: Gemini 리뷰

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

#### Step 4: 결과 통합 및 출력

```
## 이중 리뷰 결과

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
- {항목 2}

### 불일치 항목 (한쪽만 발견)
| 항목 | Claude | Gemini | Conflict Resolution |
|------|--------|--------|---------------------|
| ... | 발견 | 미발견 | {권장 조치} |

### 권장 조치 우선순위
1. {가장 중요한 수정 사항}
2. {두 번째 중요한 수정 사항}
```

---

### plan 모드

#### Step 1: Plan 파일 확보

- **파일 경로가 지정된 경우**: 해당 파일 사용 → Step 2로 이동.
- **파일 경로가 없는 경우**:
  1. Glob으로 `{프로젝트루트}/.claude/plans/*.md` 검색 (`.review.md` 제외)
  2. Glob으로 `docs/plan/*.md` 검색
  3. 파일이 없으면: "Plan 파일을 찾을 수 없습니다." 안내 후 중단.
  4. 여러 개면 AskUserQuestion으로 선택.

#### Step 2: Plan 내용 읽기

Read 도구로 Plan 파일 전체 내용 읽기.

#### Step 3: Claude Plan 리뷰

다음 기준으로 Plan을 분석합니다:

**완전성**: 목적, 범위, 구현 단계, 테스트 계획 포함 여부
**실현가능성**: 기술적 제약, 의존성, 현실적 범위
**리스크**: 잠재적 문제점, 대안 부재
**명확성**: 애매한 표현, 측정 불가능한 목표

분석 결과를 내부적으로 정리합니다.

#### Step 4: Gemini 교차검증

Read 도구로 `${CLAUDE_PLUGIN_ROOT}/resources/gemini-review-prompt.md` 읽기 (있으면).

Bash로 gemini-cli 실행:

```bash
timeout 120 gemini -p "$(cat <<'PROMPT_EOF'
{gemini-review-prompt.md 내용 또는 기본 프롬프트}

---

# 검증 대상 Plan

{Plan 파일 내용}
PROMPT_EOF
)" -o text
```

#### Step 5: 결과 통합 및 출력

```
## Plan 이중 리뷰 결과

### Claude 관점

{Claude 분석 결과}

---

### Gemini 관점

{Gemini 응답 내용}

---

### 통합 Score Card

| 항목 | Claude | Gemini | 합의 |
|------|--------|--------|------|
| 완전성 | X/10 | X/10 | X/10 |
| 실현가능성 | X/10 | X/10 | X/10 |
| 명확성 | X/10 | X/10 | X/10 |
| 종합 | X/10 | X/10 | X/10 |

### Verdict: {PASS / PASS WITH CONCERNS / NEEDS REVISION}

### 합의 항목
- {양쪽 모두 동의한 강점 또는 문제}

### 불일치 항목
| 항목 | Claude | Gemini | Conflict Resolution |
|------|--------|--------|---------------------|
| ... | ... | ... | {권장 조치} |

### 다음 단계 제안
{Verdict 기반:
- PASS → /lk-pdca design {feature}
- PASS WITH CONCERNS → 우려사항 해결 후 /lk-review plan 재검증
- NEEDS REVISION → Plan 수정 후 재검증}
```

#### Step 6: 리뷰 파일 저장

Write 도구로 리뷰 결과를 Plan 파일 옆에 저장:
- Plan 파일이 `.claude/plans/` 안에 있으면: `{plan파일명}.review.md`
- `docs/plan/` 안에 있으면: `docs/plan/{feature}.review.md`
