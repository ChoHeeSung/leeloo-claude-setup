# 모델 선택 가이드라인 (Skill 위임 전략)

Skill 내부 작업을 SubAgent에 위임할 때 모델 선택 기준. `lk-commit`이 레퍼런스 구현 (Task tool + `task_model`).

## 판단 기준

| 유형 | 모델 | 판단 기준 | 대표 예시 |
|------|------|-----------|----------|
| **단순 변환/포맷팅** | `haiku` | 입력→출력 매핑이 결정적, 추론 1단계 이내. 템플릿 채우기, API 결과 테이블화, YAML→SQL 변환 | lk-commit(메시지 생성), lk-its-ddl(DDL 프리뷰), lk-its-code(INSERT 프리뷰), lk-doc-parse, lk-n8n-node 조회, lk-bb-pr 조회 |
| **중간 복잡도 분석** | `sonnet` | 2~3단계 추론, 비교/요약/분해, 도메인 지식 중간 | lk-code-review(단독), lk-todo(create 분해), lk-doc-compare, lk-plan(Phase 3·4), lk-skill-create(Phase 3) |
| **복잡한 다단계 추론** | `opus` (메인 세션 유지) | 브레인스토밍, 리스크 분석, 오케스트레이션, Vision 통합, 창의적 판단 | lk-plan(Phase 2·5), lk-plan-cross-review, lk-doc-pdf-extract, lk-commit 메인 제어 |

## 위임 패턴 (Task tool)

위임이 적합하다고 판단되면 SKILL.md의 해당 Step을 다음 구조로 작성한다.

```markdown
### Step N. {작업명} ({Haiku|Sonnet} Task)

메인 세션은 프롬프트 구성 + 결과 검증만 수행. 실제 작업은 SubAgent에 위임.

**Agent tool 호출:**
- `subagent_type`: `task` (또는 `general-purpose`)
- `task_model`: `haiku` 또는 `sonnet`
- `prompt`: 자기 완결 프롬프트 — 컨텍스트/입력 데이터/기대 출력 형식 명시

**결과 검증 (메인 세션):**
- [ ] 출력 포맷 준수
- [ ] 입력 데이터 외 hallucination 없음
- [ ] {Skill별 고유 체크 항목}

**품질 미달 시 폴백:** 메인 세션(Opus)에서 직접 재생성.
```

## 주의사항

- 메인 세션의 대화형 AskUserQuestion, 최종 확인, DB/파일 실행, 사용자 피드백 반영은 **위임하지 않는다** (Opus 유지).
- SubAgent 프롬프트는 자기 완결적이어야 한다 — 메인 세션의 대화 내역을 가정하지 말 것.
- 위임 실패/품질 미달 시 메인 세션 폴백 경로를 항상 명시한다.

## 위임하지 않는 경우 (이득 < 비용)

다음 조건 중 하나라도 해당하면 Sonnet 위임 이득이 컨텍스트 재전송·품질 저하 리스크보다 작으므로 **위임하지 않는다**.

1. **컨텍스트 재전송량이 큰데 1회 비용이 작은 경우** — Plan 전체나 큰 문서를 SubAgent에 전송해야 하지만 생성 출력이 짧음. 예: `lk-todo create`의 태스크 분해 — Plan 전체 재전송 vs 20~40줄 JSON 출력.
2. **같은 세션 내에서 다른 Opus 단계와 맥락 연결이 중요한 경우** — 앞뒤 Phase에서 Opus가 생성한 내용과 의미 일관성이 요구됨. 예: `lk-plan` Phase 3·4 — Phase 2(의도)·Phase 5(작성)가 Opus이므로 중간만 Sonnet이면 맥락 단절 리스크.
3. **Plan/설계 품질이 곧 프로젝트 방향인 경우** — 품질 저하 시 하류 작업 전체에 파급. 메인 세션 Opus로 유지해 일관성 확보.

Max 5 요금제 환경에서도 이 원칙은 유효하다. Sonnet 버킷은 관대하지만, 품질 저하로 인한 재작업이 오히려 Opus 캡을 더 소비할 수 있다.
