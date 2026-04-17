# 2026-04-17 09:25 — 10개 Skill에 Haiku/Sonnet 위임 패턴 적용

## 지시 요약

사용자 요청: "내 프로젝트에서 sonnet이나 haiku 모델로 위임해서 처리해도 동일한 성능을 발휘하는 기능이 있나 검토해볼래?"

`/lk-plan` → `/lk-todo create` → 파일럿 포함 10개 Skill을 순차 변경.

## 맥락

`lk-commit`(커밋 `7915209`)에서 검증된 Haiku 위임 패턴(`Agent tool + task_model: haiku`)이 다른 Skill로 확산되지 못한 상태였음. 빈도 높은 단순 작업은 Opus 과소비, 중간 복잡도 분석도 Opus로 처리되어 토큰·지연 낭비.

Plan `docs/plan/model-delegation-optimization.plan.md`에 단계별 롤아웃 전략(B안) 확정.

## 작업 내용

### 가이드라인 문서화
- `leeloo-kit/CLAUDE.md`에 "모델 선택 가이드라인" 섹션 추가
  - Haiku/Sonnet/Opus 판단 기준 테이블
  - 위임 패턴(Agent tool + task_model + 검증 체크리스트 + 폴백) 정형화
  - 주의사항 (대화형 AskUserQuestion은 메인 세션 유지 등)

### Haiku 위임 5개 (단순 변환/포맷팅)
| Skill | 위임 Step | 역할 |
|-------|----------|------|
| `lk-its-ddl` | Step 5, 6 | CREATE TABLE / ALTER TABLE DDL 프리뷰 생성 |
| `lk-its-code` | add-item Step 4 | `영문코드=한글명` 입력 파싱 + INSERT 프리뷰 |
| `lk-doc-parse` | Phase 2 | kordoc 출력 → 사용자용 마크다운 블록 |
| `lk-n8n-node` | search, info | MCP 응답 → 테이블/구조화된 문서 |
| `lk-bb-pr` | list, get | Bitbucket JSON → PR 목록/상세 마크다운 |

### Sonnet 위임 5개 (중간 복잡도 분석)
| Skill | 위임 Step | 역할 |
|-------|----------|------|
| `lk-code-review` | Step 2 | 단독 모드 코드 품질/보안/성능 분석 + Score Card |
| `lk-todo` | create Step 4 | Plan 본문 → 태스크 JSON 분해 |
| `lk-doc-compare` | Phase 2 | diff 통계 + 주요 변경 사항 요약 |
| `lk-plan` | Phase 3, 4 | 2~3개 접근법 비교 + YAGNI 후보 식별 |
| `lk-skill-create` | Phase 3 | 분석 결과 → SKILL.md 본문 작성 |

### 공통 패턴

각 위임 Step에 다음 4요소를 일관 적용:

1. **Agent 호출부** — `subagent_type`, `task_model`, 자기 완결 프롬프트
2. **결과 검증 체크리스트** — 출력 포맷, 필드 누락, hallucination 방지
3. **품질 미달 시 폴백** — 메인 세션(Opus) 재생성 경로 명시
4. **메인 세션 책임 분리** — AskUserQuestion, DB/파일 실행, 최종 확인은 Opus 유지

## 현실 비유

이 위임 구조는 **대학병원의 진료 계층**과 같다.

- **Opus(교수)**: 복잡한 의사결정·진단·수술 계획 (lk-plan 의도 발견, 교차검증 조율)
- **Sonnet(전공의)**: 중간 난이도 진찰·판독·보고서 작성 (코드 리뷰, 공문서 비교, Plan 대안 탐색)
- **Haiku(간호사/레지던트 1년차)**: 루틴한 차트 정리, 수치 기록, 정해진 양식 작성 (DDL 프리뷰, JSON 포맷팅)

교수는 병원 전체 흐름을 지휘하고 최종 판단만 내린다. 루틴 업무가 교수에게 몰리면 전체 병원이 느려지듯, 메인 세션이 모든 작업을 직접 하면 토큰·지연이 낭비된다.

**결과 검증 체크리스트**는 전공의가 작성한 차트를 교수가 서명 전 훑어보는 과정이다. 중요한 숫자(컬럼 목록, JSON 배열 길이)가 맞는지, 환자 정보 외 불필요한 내용이 추가되지 않았는지(hallucination) 확인한다.

**폴백 경로**는 전공의가 판단하기 어려운 증상이 나왔을 때 교수가 직접 재진료하는 경로다. 항상 열려 있어야 안심하고 위임할 수 있다.

## 결과

- 변경 파일: 12개 (+622 / -80 라인)
- 신규 파일: Plan 1개 + HISTORY 상세 1개
- TODO 진행률: 22/22 (이전) → 33/37 (89%)
- 남은 작업:
  - #26 파일럿 실사용 검증 (사용자, 2~3일)
  - #37 최종 검증 (사용자, 10개 Skill 샘플 10건 이상)

## 참고 파일

- Plan: `docs/plan/model-delegation-optimization.plan.md`
- 가이드라인: `leeloo-kit/CLAUDE.md` § 모델 선택 가이드라인
- 레퍼런스 구현: `leeloo-git/skills/lk-commit/SKILL.md` (커밋 `7915209`)
