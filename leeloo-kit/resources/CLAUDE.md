# Claude Code 사용 원칙

## 필수 원칙 (반드시 준수)

### 1. 코드 작성 금지 원칙
- 사용자가 명시적으로 "코드를 작성하라"는 지시를 하지 않으면 절대 코드를 작성하지 않는다.
- 지시가 없을 때는 계획, 분석, 설명만 수행한다.

### 2. HISTORY.md 누적 기록
- 사용자의 지시 내용과 작업 결과를 깔끔하게 요약·정리하여 프로젝트 루트의 HISTORY.md에 누적 기록한다.
- 형식: 날짜 > 지시 요약 > 작업 내용 > 결과
- 코드를 작성한 경우, 핵심 코드 스니펫을 HISTORY.md에 포함하여 어떤 코드가 변경/추가되었는지 추적할 수 있게 한다.

### 3. 현실 비유 설명
- HISTORY.md에 복잡한 알고리즘이나 기술적 개념 설명이 필요할 경우, 반드시 현실 세계의 비유를 들어 작성한다.

### 4. TODO.md 확인 원칙
- 작업 시작 전 프로젝트 루트의 TODO.md 파일을 반드시 확인한다.
- TODO.md가 존재하면 현재 미완료 항목을 파악하고, 작업 완료 시 해당 항목을 체크한다.
- 작업과 관련 없는 TODO 항목은 건드리지 않는다.

## 권장 원칙 (효율적 사용)

### 5. 계획 우선 원칙 (Plan First)
- 모든 작업은 먼저 계획을 세우고, 사용자가 승인한 후에만 실행한다.

### 6. 컨텍스트 위생 (Context Hygiene)
- 작업 단위별로 /clear를 사용한다.
- 하나의 세션에 하나의 작업만 수행한다.

### 7. 검증 기준 명시 (Verification Criteria)
- 작업 지시 시 완료 확인 방법을 함께 제시한다. (테스트 통과, 빌드 성공 등)

### 8. CIF 구조 프롬프트 (Context-Intent-Format)
- 지시는 맥락(Context), 의도(Intent), 형식(Format)을 명확히 구분하여 전달한다.

### 9. 서브에이전트 위임
- 탐색/조사 작업은 서브에이전트에 위임하여 메인 컨텍스트를 보호한다.

### 10. 린터/포매터는 도구에게
- 코드 스타일, 포매팅, 린팅은 LLM이 아닌 기존 도구(ESLint, Prettier 등)에 맡긴다.

### 11. 한국어 응답 원칙
- 모든 응답은 한국어로 작성한다.
- 코드, 명령어, 기술 용어 등 고유명사는 원문 그대로 사용할 수 있으나, 설명과 대화는 반드시 한국어로 한다.

## PDCA 워크플로우 (leeloo-kit)

### 개요
leeloo-kit 플러그인은 PDCA(Plan-Do-Check-Act) 사이클 기반 개발 워크플로우를 제공합니다.

### 스킬 명령어
| 명령어 | 용도 |
|--------|------|
| `/lk-plan <feature>` | 브레인스토밍 기반 Plan 작성 |
| `/lk-pdca design <feature>` | 설계 문서 작성 |
| `/lk-pdca do <feature>` | 구현 가이드 + TODO 생성 |
| `/lk-pdca analyze <feature>` | Gap 분석 (설계-구현 매칭) |
| `/lk-pdca report <feature>` | 완료 보고서 생성 |
| `/lk-cross-validate [path]` | Gemini 교차검증 |
| `/lk-review [code\|plan] [path]` | Gemini+Claude 이중 리뷰 |
| `/lk-todo` | TODO 리스트 관리 |
| `/lk-commit [--push]` | 회사 스타일 커밋 |
| `/lk-agent` | Sub Agent 생성/관리 |
| `/lk-team` | Agent Team 구성/관리 |
| `/lk-setup` | 선택적 환경 강화 |

### 문서 경로
- Plan: `docs/plan/{feature}.plan.md`
- Design: `docs/design/{feature}.design.md`
- Analysis: `docs/analysis/{feature}.analysis.md`
- Report: `docs/report/{feature}.report.md`

### 워크플로우 흐름
```
/lk-plan → /lk-cross-validate → /lk-pdca design → /lk-pdca do
→ /lk-pdca analyze → (Match Rate ≥90%) → /lk-pdca report
                    → (Match Rate <90%) → 자동 개선 반복
```

### 교차검증
- Plan/Design 완료 후 `/lk-cross-validate`로 Gemini 독립 검증
- Score Card (50점 만점) + Match Rate로 품질 측정
- Verdict: PASS / PASS WITH CONCERNS / NEEDS REVISION