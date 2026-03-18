---
name: lk-pdca
description: "PDCA 통합 관리. /lk-pdca [design|do|analyze|report|status] <feature>"
user_invocable: true
argument-hint: "[design|do|analyze|report|status] <feature>"
---

# /lk-pdca — PDCA 통합 관리

Plan → Design → Do → Check(Analyze) → Act(Report) 사이클을 통합 관리합니다.
Plan 작성은 `/lk-plan`으로 분리되어 있습니다.

## 서브커맨드

```
/lk-pdca design <feature>   — 설계 문서 작성 (Plan 기반)
/lk-pdca do <feature>       — 구현 가이드 + TODO 생성
/lk-pdca analyze <feature>  — Gap 분석 수행
/lk-pdca report <feature>   — 완료 보고서 작성
/lk-pdca status <feature>   — PDCA 진행 상태 확인
/lk-pdca status             — 전체 feature 상태 목록
```

## Procedure

### 인자 파싱

사용자 입력에서 서브커맨드와 feature를 파싱합니다:
- `design <feature>` → **design** 동작
- `do <feature>` → **do** 동작
- `analyze <feature>` → **analyze** 동작
- `report <feature>` → **report** 동작
- `status [feature]` → **status** 동작

서브커맨드나 feature가 없으면:
```
사용법: /lk-pdca [design|do|analyze|report|status] <feature>
예: /lk-pdca design user-auth
    /lk-pdca status
```
출력 후 중단.

---

### 공통: leeloo.config.json 로드

각 액션 실행 전 `leeloo.config.json`에서 docPaths 설정을 로드합니다:
- 파일이 없으면 기본값 사용:
  ```json
  {
    "docPaths": {
      "plan": "docs/plan",
      "design": "docs/design",
      "analysis": "docs/analysis",
      "report": "docs/report"
    }
  }
  ```

---

### design 동작

**이전 단계 확인**: Plan 문서 존재 여부 확인.
- `docs/plan/{feature}.plan.md` 없으면:
  ```
  Plan 문서가 없습니다.
  먼저 /lk-plan {feature} 로 Plan을 작성하세요.
  ```
  중단.

1. **Plan 읽기**: Read 도구로 `docs/plan/{feature}.plan.md` 읽기.
2. **템플릿 읽기**: Read 도구로 `${CLAUDE_PLUGIN_ROOT}/templates/design.template.md` 읽기.
3. **디렉토리 확인**: Bash로 `mkdir -p docs/design` 실행.
4. **설계 문서 작성**: Write 도구로 `docs/design/{feature}.design.md` 생성.

설계 문서 내용 (Plan 참조):
```markdown
# {feature} Design

> 작성일: {날짜} | Plan 참조: docs/plan/{feature}.plan.md

## 시스템 구조

{Plan의 접근법을 기반으로 컴포넌트/모듈 구조 설계}

## 인터페이스 설계

{API, 함수 시그니처, 데이터 모델}

## 구현 순서

| 단계 | 내용 | 의존성 |
|------|------|--------|
| 1 | ... | 없음 |
| 2 | ... | 1 |

## 기술 결정

| 결정 | 이유 | 대안 |
|------|------|------|
| ... | ... | ... |

## 테스트 전략

{단위/통합/E2E 테스트 계획}
```

5. **PDCA 상태 갱신**: `.leeloo/pdca-status.json`의 해당 feature에 `design` 단계 추가.
6. **완료 안내**:
   ```
   설계 문서 작성 완료

   파일: docs/design/{feature}.design.md

   다음 단계:
   - /lk-pdca do {feature}  — 구현 시작
   ```

---

### do 동작

**이전 단계 확인**: Design 문서 존재 여부 확인.
- `docs/design/{feature}.design.md` 없으면:
  ```
  설계 문서가 없습니다.
  먼저 /lk-pdca design {feature} 로 설계 문서를 작성하세요.
  ```
  중단.

1. **설계 문서 읽기**: Read 도구로 `docs/design/{feature}.design.md` 읽기.
2. **구현 가이드 표시**: 설계의 구현 순서 기반으로 단계별 가이드 출력.

   ```
   ## {feature} 구현 가이드

   설계 문서: docs/design/{feature}.design.md

   ### 구현 단계
   {설계 문서의 구현 순서 표시}

   ### 권장 시작점
   {첫 번째 단계 상세 설명}
   ```

3. **TODO 생성 제안**: AskUserQuestion — "TODO.md를 생성하여 진행 상황을 추적할까요? (생성/나중에)"
   - "생성" 선택 시: `/lk-todo create docs/design/{feature}.design.md` 로직 실행

4. **PDCA 상태 갱신**: `.leeloo/pdca-status.json`의 해당 feature에 `do` 단계 추가.

---

### analyze 동작

**이전 단계 확인**: Design 문서 존재 여부 확인.
- `docs/design/{feature}.design.md` 없으면:
  ```
  설계 문서가 없습니다.
  먼저 /lk-pdca design {feature} 로 설계 문서를 작성하세요.
  ```
  중단.

1. **gap-detector 에이전트 호출**: Agent 도구로 `gap-detector` 에이전트에게 Gap 분석 위임.
   - 전달 정보: feature 이름, 설계 문서 경로, Plan 문서 경로
   - 분석 요청: "설계와 현재 구현 사이의 Gap을 분석하고 Match Rate를 산출하세요."

2. **결과 수신**: 에이전트의 분석 결과 수신.

3. **분석 파일 생성**: Bash로 `mkdir -p docs/analysis` 후 Write 도구로 `docs/analysis/{feature}.analysis.md` 생성.

   ```markdown
   # {feature} Gap Analysis

   > 분석일: {날짜} | 분석 에이전트: gap-detector

   ## Match Rate: {X}%

   ## 갭 목록

   | 항목 | 설계 | 구현 | 상태 |
   |------|------|------|------|
   | ... | ... | ... | Gap/OK |

   ## 권장 조치

   {에이전트 분석 결과}
   ```

4. **PDCA 상태 갱신**: `.leeloo/pdca-status.json`에 `analyze` 단계 추가.
5. **완료 안내**:
   ```
   Gap 분석 완료

   파일: docs/analysis/{feature}.analysis.md
   Match Rate: {X}%

   다음 단계:
   - /lk-pdca report {feature}  — 완료 보고서 작성
   ```

---

### report 동작

1. **report-generator 에이전트 호출**: Agent 도구로 `report-generator` 에이전트에게 보고서 작성 위임.
   - 전달 정보: feature 이름, Plan/Design/Analysis 문서 경로
   - 요청: "PDCA 사이클 전체를 종합한 완료 보고서를 작성하세요."

2. **결과 수신**: 에이전트의 보고서 내용 수신.

3. **보고서 파일 생성**: Bash로 `mkdir -p docs/report` 후 Write 도구로 `docs/report/{feature}.report.md` 생성.

   ```markdown
   # {feature} Report

   > 완료일: {날짜}

   ## 요약

   {주요 성과 및 결과}

   ## PDCA 사이클 요약

   | 단계 | 결과 |
   |------|------|
   | Plan | docs/plan/{feature}.plan.md |
   | Design | docs/design/{feature}.design.md |
   | Do | 구현 완료 |
   | Analyze | Match Rate {X}% |

   ## 개선 사항 및 회고

   {에이전트 보고서 내용}
   ```

4. **PDCA 상태 갱신**: `.leeloo/pdca-status.json`에 `report` 단계 추가 + `stage: complete` 갱신.
5. **완료 안내**:
   ```
   완료 보고서 작성 완료

   파일: docs/report/{feature}.report.md

   PDCA 사이클이 완료되었습니다.
   - /lk-commit 으로 변경사항을 커밋하세요.
   ```

---

### status 동작

1. Read 도구로 `.leeloo/pdca-status.json` 읽기.
   - 파일이 없으면: "PDCA 진행 중인 항목이 없습니다." 안내.

2. **feature 지정된 경우**: 해당 feature의 상세 상태 표시.
   ```
   ## {feature} PDCA 상태

   | 단계 | 상태 | 파일 |
   |------|------|------|
   | Plan | ✅ 완료 | docs/plan/{feature}.plan.md |
   | Design | ✅ 완료 | docs/design/{feature}.design.md |
   | Do | 🔨 진행중 | - |
   | Analyze | ⬜ 대기 | - |
   | Report | ⬜ 대기 | - |

   현재 단계: Do
   다음 명령: /lk-pdca analyze {feature}
   ```

3. **feature 미지정인 경우**: 전체 feature 목록 표시.
   ```
   ## PDCA 전체 현황

   | Feature | 현재 단계 | 마지막 업데이트 |
   |---------|----------|---------------|
   | user-auth | Do | 2026-03-18 |
   | api-refactor | Plan | 2026-03-17 |
   ```
