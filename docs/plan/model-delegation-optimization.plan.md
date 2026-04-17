# Plan: model-delegation-optimization

> 작성일: 2026-04-17 | 작성자: Claude + leeloo.chs@gmail.com

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | model-delegation-optimization |
| 목적 | leeloo-* 플러그인 10개 Skill을 Haiku/Sonnet에 위임해 토큰·지연 30~45% 절감 |
| 예상 기간 | 2주 (파일럿 2일 + Haiku 5개 5일 + Sonnet 5개 5일 + 검증 2일) |
| 복잡도 | Medium |

## 1. 배경 및 목적

### 문제 정의

- 현재 `lk-commit`을 제외한 모든 Skill이 메인 세션(Opus)에서 직접 실행됨
- 단순 템플릿 채우기(lk-its-ddl, lk-its-code) / API 결과 포맷팅(lk-n8n, lk-bb-pr)에 Opus 수준의 추론은 과잉
- 중간 복잡도 분석(코드 리뷰, 공문서 비교)에도 Opus는 과소비
- `lk-commit`에서 이미 검증된 Haiku 위임 패턴(`task_model: haiku`, 커밋 `7915209`)이 다른 Skill로 확산되지 못함

### 목표

1. **토큰 효율화**: 빈도 높은 Skill(its-*, doc-parse) Haiku 위임으로 호출당 70~80% 토큰 절감
2. **응답 지연 단축**: Haiku는 Opus 대비 2~3배 빠름 → 대화형 Skill 체감 속도 개선
3. **품질 보존**: 복잡한 추론이 필요한 Skill(lk-plan 의도발견, lk-plan-cross-review, lk-doc-pdf-extract)은 Opus 유지
4. **표준 위임 패턴 확립**: 향후 신규 Skill 작성 시 모델 선택 가이드라인 제공

## 2. 의도 발견 로그

| 질문 | 답변 |
|------|------|
| 핵심 목적 | 추천안(Haiku 5 + Sonnet 5) 전체 설계·적용. 토큰·지연 절감 + 품질 유지 |
| 대상 사용자 | leeloo-claude-setup 플러그인 마켓플레이스를 사용하는 사내 개발자 전원 |
| 성공 기준 | (1) Haiku/Sonnet 위임 후 수동 체크리스트 통과율 ≥ 95%, (2) 파일럿 2개 Skill 회귀 0건, (3) 롤백 단위가 단계별로 가능 |
| 제약 조건 | `lk-commit` 위임 패턴(Task tool + task_model)과 호환, 메인 세션은 Opus 유지, 글로벌 CLAUDE.md 수정 금지 |

## 3. 탐색한 대안

### 실행 전략 비교

| 접근법 | 장점 | 단점 | 선택 |
|--------|------|------|------|
| A: 일괄 적용 (10개 Skill 한 번에) | 빠름, 리뷰 1회 | 회귀 발생 시 원인 특정 어려움, 롤백 단위 불명확 | |
| B: 단계별 롤아웃 (파일럿 → Haiku 5 → Sonnet 5) | 리스크 격리, 중간 품질 체크포인트, 단계별 revert | 3단계 커밋 필요 | ✓ |
| C: 플러그인 단위 분할 (its → doc → n8n/bb → workflow) | 플러그인 경계 명확 | 모델 전환 맥락이 플러그인 경계와 엇갈려 리뷰 단위 모호 | |

### 구현 방식 비교

| 방식 | 장점 | 단점 | 선택 |
|------|------|------|------|
| Task tool + task_model 인라인 지정 | lk-commit과 동일 패턴, 검증됨, 추가 파일 없음 | 각 SKILL.md에 프롬프트 중복 가능성 | ✓ |
| 전용 SubAgent 정의 (agents/*.md) | 재사용성 높음 | 신규 agent 파일 다수 필요, 작업량 큼 |  |
| 하이브리드 (공통=agent, 1회성=task_model) | 유연성 최고 | 복잡도 증가 |  |

## 4. YAGNI 리뷰

제거된 항목:
- **모델별 토큰 사용량 대시보드** — Claude Code 기본 세션 통계로 충분, 추가 인프라 불필요
- **다른 Skill 모델 자동 추천 도구** — 본 Plan 범위 넘어섬, 향후 별도 검토

포함된 항목 (YAGNI 통과):
- 각 Skill별 **수동 품질 체크리스트** (파일럿 + 결과 품질 체크)
- **회귀 감지용 간이 A/B 샘플** (파일럿 단계 한정)
- **task_model 실패 시 메인 세션 폴백 경로** (품질 저하 대응)

## 5. 구현 범위

### 포함

**Haiku 위임 대상 (5개):**
1. `leeloo-its/skills/lk-its-ddl/SKILL.md` — 도메인사전 기반 DDL 생성
2. `leeloo-its/skills/lk-its-code/SKILL.md` — YAML → INSERT 변환
3. `leeloo-doc/skills/lk-doc-parse/SKILL.md` — kordoc 래퍼 호출 + 결과 포맷팅
4. `leeloo-n8n/skills/lk-n8n-node/SKILL.md` — 노드 조회 테이블 포맷팅 (search, info 서브커맨드)
5. `leeloo-bitbucket/skills/lk-bb-pr/SKILL.md` — PR 목록/상세 조회 (list, get 서브커맨드)

**Sonnet 위임 대상 (3개, 실행 중 2개 철회):**
1. `leeloo-workflow/skills/lk-code-review/SKILL.md` — Claude 단독 모드 리뷰
2. `leeloo-doc/skills/lk-doc-compare/SKILL.md` — 두 공문서 비교 해석
3. `leeloo-kit/skills/lk-skill-create/SKILL.md` — Phase 3 SKILL.md 본문 생성

**Sonnet 위임 철회 (사후 재평가):**
- `lk-plan` Phase 3·4 — Phase 2·5(Opus)와 맥락 단절 리스크 + Plan 품질이 프로젝트 방향 결정
- `lk-todo create` Step 4 — Plan 전체 재전송량 > 짧은 JSON 출력 생성 비용, 이득 미미
- 원칙: `leeloo-kit/CLAUDE.md` § 위임하지 않는 경우

**공통 작업:**
- 각 SKILL.md에 `Task tool + task_model` 위임 Step 추가
- `leeloo-kit/CLAUDE.md` 또는 `docs/`에 **모델 선택 가이드라인** 추가
- 각 Skill별 **품질 체크리스트** (SKILL.md 내부)
- `HISTORY.md`에 단계별 적용 이력 기록

### 제외

- Opus 유지 (범위 외 보호): `lk-plan` Phase 2/5, `lk-plan-cross-review`, `lk-doc-pdf-extract`, `lk-commit` 메인 제어, `code-analyzer` agent
- 자동 품질 회귀 테스트 스크립트
- 토큰 사용량 대시보드
- Skill 모델 자동 추천 도구

## 6. 기술 설계 요약

### 아키텍처

**위임 패턴 (lk-commit `7915209` 참조):**

각 대상 SKILL.md의 특정 Step은 다음 구조로 재작성한다.

```markdown
### Step N. {작업명} ({Haiku|Sonnet} Task)

메인 세션은 프롬프트 구성 + 결과 검증만 수행. 실제 작업은 SubAgent에 위임.

**Task 호출:**
- `subagent_type`: `general-purpose`
- `task_model`: `haiku` (또는 `sonnet`)
- `description`: (5단어 이내)
- `prompt`: (자기 완결 프롬프트. 컨텍스트/입력 데이터/기대 출력 형식 명시)

**결과 검증 (메인 세션):**
- [ ] 출력 포맷 준수 (헤더, 테이블 구조 등)
- [ ] 입력 데이터에 명시된 값만 사용 (hallucination 없음)
- [ ] {Skill별 고유 체크 항목}

**품질 미달 시 폴백:**
- 메인 세션에서 직접 재생성 (Opus)
```

### 주요 데이터 흐름

```
사용자 입력
    ↓
메인 세션 (Opus)
    ├── Phase 1~2: 컨텍스트 탐색, 사용자 대화 (Opus 유지)
    ├── Phase N: 핵심 작업
    │       ↓
    │   Task tool 호출 (task_model = haiku/sonnet)
    │       ↓
    │   SubAgent (Haiku/Sonnet) — 프롬프트 기반 생성
    │       ↓
    │   결과 반환
    ↓
메인 세션: 체크리스트 검증
    ├── 통과 → 출력/저장
    └── 실패 → 메인 세션 재생성 (Opus 폴백)
```

### 모델 선택 가이드라인 (leeloo-kit/CLAUDE.md 신규 섹션)

| 유형 | 모델 | 판단 기준 |
|------|------|-----------|
| 단순 템플릿 채우기, 포맷 변환, 구조화된 파일 생성, API 결과 포맷팅 | Haiku | 입력 → 출력 매핑이 결정적, 추론 1단계 이내 |
| 중간 복잡도 분석, 비교 요약, 분해/재구성 | Sonnet | 2~3단계 추론, 도메인 지식 중간 |
| 브레인스토밍, 리스크 분석, 다단계 의사결정, Vision 통합 | Opus | 불확실성 많고 창의적 판단 필요 |

## 7. 구현 단계

| Step | 내용 | 파일 | 의존성 |
|------|------|------|--------|
| 1 | 모델 선택 가이드라인 문서화 | `leeloo-kit/CLAUDE.md` (신규 섹션) | — |
| 2 | **파일럿 A**: lk-its-ddl Haiku 위임 + 체크리스트 | `leeloo-its/skills/lk-its-ddl/SKILL.md` | Step 1 |
| 3 | **파일럿 B**: lk-its-code Haiku 위임 + 체크리스트 | `leeloo-its/skills/lk-its-code/SKILL.md` | Step 2 |
| 4 | 파일럿 결과 검토(사용자 피드백 수집 2~3일 운영) | — | Step 2, 3 |
| 5 | Haiku 위임 확장: lk-doc-parse | `leeloo-doc/skills/lk-doc-parse/SKILL.md` | Step 4 |
| 6 | Haiku 위임 확장: lk-n8n-node (search/info만) | `leeloo-n8n/skills/lk-n8n-node/SKILL.md` | Step 4 |
| 7 | Haiku 위임 확장: lk-bb-pr (list/get만) | `leeloo-bitbucket/skills/lk-bb-pr/SKILL.md` | Step 4 |
| 8 | Haiku 5개 완료 커밋 + HISTORY.md 기록 | `HISTORY.md`, `history/` | Step 5~7 |
| 9 | Sonnet 위임: lk-code-review (Claude 단독 모드) | `leeloo-workflow/skills/lk-code-review/SKILL.md` | Step 8 |
| 10 | Sonnet 위임: lk-todo (create 서브커맨드) | `leeloo-workflow/skills/lk-todo/SKILL.md` | Step 9 |
| 11 | Sonnet 위임: lk-doc-compare | `leeloo-doc/skills/lk-doc-compare/SKILL.md` | Step 9 |
| 12 | Sonnet 위임: lk-plan Phase 3·4 | `leeloo-workflow/skills/lk-plan/SKILL.md` | Step 9 |
| 13 | Sonnet 위임: lk-skill-create Phase 3 | `leeloo-kit/skills/lk-skill-create/SKILL.md` | Step 9 |
| 14 | Sonnet 5개 완료 커밋 + HISTORY.md 기록 | `HISTORY.md`, `history/` | Step 9~13 |
| 15 | 최종 검증: 실제 사용 샘플 10건 체크리스트 통과 확인 | — | Step 14 |

## 8. 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Haiku 위임 후 DDL/INSERT 생성 품질 저하 (컬럼 누락 등) | 중 | 높음 | 체크리스트 검증 + 메인 세션 폴백. 파일럿 2일간 실사용 후 확대 |
| Sonnet 위임이 프로젝트 관례를 누락 (코드 리뷰) | 중 | 중 | 리뷰 시 CLAUDE.md 내용을 프롬프트에 명시 주입. 실패 시 Opus 폴백 |
| `lk-plan` Phase 3·4 Sonnet 위임이 Phase 2·5(Opus)와 컨텍스트 단절 | 중 | 중 | 프롬프트에 Phase 2 결과 요약을 명시 포함. Phase 5에서 검토·조정 |
| 다양한 task_model 혼재로 디버깅 난이도 증가 | 낮 | 중 | 각 SKILL.md에 `task_model` 값 명시 + 모델 선택 가이드라인 문서화 |
| lk-commit 패턴과의 미묘한 차이로 불일치 발생 | 낮 | 낮 | lk-commit을 레퍼런스 예시로 참조 링크 추가 |
| 사용자 환경(플러그인 캐시)에서 task_model 옵션 미지원 | 낮 | 높음 | Step 2(파일럿) 시 실제 환경 호환성 우선 검증 |

## 9. 검증 기준

### 파일럿 단계 (Step 2~4)
- [ ] lk-its-ddl 실제 테이블 생성 요청 3건 → 체크리스트 전 항목 통과
- [ ] lk-its-code 실제 코드 추가 요청 3건 → 체크리스트 전 항목 통과
- [ ] 응답 지연 체감 단축 확인 (사용자 피드백)
- [ ] 품질 저하 발견 시 Opus 폴백 경로 동작

### Haiku 5개 완료 (Step 8)
- [ ] 5개 Skill 각각 실사용 샘플 2건 이상 체크리스트 통과
- [ ] 어떤 Skill도 폴백 발동률이 30%를 넘지 않음

### Sonnet 5개 완료 (Step 14)
- [ ] lk-code-review 단독 모드 출력이 `--dual` 모드 리뷰와 주요 발견 항목 일치 (80% 이상)
- [ ] lk-plan Phase 3·4가 Phase 2 의도를 반영함을 Phase 5 메인 세션이 확인
- [ ] lk-todo create가 Plan 구현 단계를 누락 없이 태스크화

### 최종 (Step 15)
- [ ] 전체 10개 Skill 실사용 샘플 총 10건 이상 품질 이슈 0건
- [ ] 모델 선택 가이드라인이 `leeloo-kit/CLAUDE.md`에 문서화되어 향후 신규 Skill 작성 시 활용 가능
- [ ] `HISTORY.md`에 단계별 적용 이력 기록 완료
