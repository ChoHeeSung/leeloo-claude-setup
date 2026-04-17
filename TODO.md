# TODO

> 생성 기준: model-delegation-optimization.plan.md | 2026-04-17
> 설계 문서: /Users/heesung/work/M_CHO/leeloo-claude-setup/docs/plan/model-delegation-optimization.plan.md
> 이전 기준: .claude/plans/2026-03-18-leeloo-kit-rebranding.md (완료, #1~22)

## 작업 목록

| # | 상태 | 태스크 | 시작 | 종료 | 소요 |
|---|------|--------|------|------|------|
| 1 | ✅ | 리브랜딩 — plugin.json, marketplace.json 이름/설명 변경 | 03-18 06:38 | 03-18 06:42 | 4분 |
| 2 | ✅ | leeloo.config.json 생성 — PDCA 설정, 경로, 교차검증 옵션 | 03-18 06:38 | 03-18 06:42 | 4분 |
| 3 | ✅ | scripts/lib/ 유틸리티 5개 — io.js, config.js, paths.js, pdca-status.js, context.js | 03-18 06:38 | 03-18 06:42 | 4분 |
| 4 | ✅ | hooks.json 전면 교체 — 5 이벤트 (SessionStart, PreToolUse, PostToolUse, Stop) | 03-18 06:38 | 03-18 06:42 | 4분 |
| 5 | ✅ | session-start.js — 세션 초기화, 의존성 확인, PDCA 상태 표시 | 03-18 06:38 | 03-18 06:42 | 4분 |
| 6 | ✅ | bash-pre.js, write-post.js — 위험 명령 차단 + 문서 포맷 검증 | 03-18 06:38 | 03-18 06:42 | 4분 |
| 7 | ✅ | 템플릿 5개 — plan, design, analysis, report, do | 03-18 06:38 | 03-18 06:40 | 2분 |
| 8 | ✅ | 에이전트 4개 — gap-detector, pdca-iterator, code-analyzer, report-generator | 03-18 06:38 | 03-18 06:40 | 2분 |
| 9 | ✅ | lk-plan 스킬 — 브레인스토밍 기반 Plan 작성 + 교차검증 연동 | 03-18 06:38 | 03-18 06:47 | 9분 |
| 10 | ✅ | lk-pdca 스킬 — design/do/analyze/report/status 통합 관리 | 03-18 06:38 | 03-18 06:47 | 9분 |
| 11 | ✅ | skill-post.js + unified-stop.js — 스킬/에이전트 완료 후 오케스트레이션 | 03-18 06:38 | 03-18 06:42 | 4분 |
| 12 | ✅ | lk-cross-validate 강화 — Score Card, 메트릭 저장, 반복 검증 | 03-18 06:38 | 03-18 06:47 | 9분 |
| 13 | ✅ | gemini-review-prompt.md 강화 — Score Card 섹션 추가 | 03-18 06:38 | 03-18 06:40 | 2분 |
| 14 | ✅ | lk-agent 강화 — 프리셋 5→7종, frontmatter 강화 | 03-18 06:38 | 03-18 06:47 | 9분 |
| 15 | ✅ | lk-team 강화 — 프리셋 4→5종 (pdca-verify 추가) | 03-18 06:38 | 03-18 06:47 | 9분 |
| 16 | ✅ | lk-todo + lk-commit 강화 — 진행률 제안, TODO 연동 | 03-18 06:38 | 03-18 06:47 | 9분 |
| 17 | ✅ | lk-review 신규 — Gemini+Claude 이중 리뷰 스킬 | 03-18 06:38 | 03-18 06:47 | 9분 |
| 18 | ✅ | lk-setup 역할 변경 — 선택적 환경 강화로 전환 | 03-18 06:38 | 03-18 06:47 | 9분 |
| 19 | ✅ | 아웃풋 스타일 3개 — lk-dual-verify, lk-mentor, lk-ops | 03-18 06:38 | 03-18 06:40 | 2분 |
| 20 | ✅ | CLAUDE.md 템플릿 갱신 — PDCA 워크플로우 안내 추가 | 03-18 06:48 | 03-18 06:49 | 1분 |
| 21 | ✅ | 셸 스크립트 제거 — setup-claude-code.sh, uninstall-claude-code.sh 삭제 | 03-18 06:48 | 03-18 06:49 | 1분 |
| 22 | ✅ | 불필요 리소스 제거 — settings-template.json, resources/settings.local.json 삭제 | 03-18 06:48 | 03-18 06:49 | 1분 |
| 23 | ✅ | §Step1 모델 선택 가이드라인 문서화 — leeloo-kit/CLAUDE.md에 Haiku/Sonnet/Opus 판단 기준 테이블 추가 | 04-17 09:16 | 04-17 09:16 | 1분 |
| 24 | ✅ | §Step2 [파일럿A] lk-its-ddl Haiku 위임 — Task tool + task_model:haiku, 결과 검증 체크리스트 | 04-17 09:16 | 04-17 09:17 | 1분 |
| 25 | ✅ | §Step3 [파일럿B] lk-its-code Haiku 위임 — YAML→INSERT 변환 SubAgent + 체크리스트 | 04-17 09:17 | 04-17 09:18 | 1분 |
| 26 | ⏸ | §Step4 파일럿 결과 검토 — 2~3일 실사용 피드백 수집, 폴백 발동률 확인 | - | - | - |
| 27 | ✅ | §Step5 lk-doc-parse Haiku 위임 — kordoc 결과 포맷팅 SubAgent 전환 | 04-17 09:18 | 04-17 09:19 | 1분 |
| 28 | ✅ | §Step6 lk-n8n-node Haiku 위임 — search/info 서브커맨드만 SubAgent 위임 | 04-17 09:19 | 04-17 09:20 | 1분 |
| 29 | ✅ | §Step7 lk-bb-pr Haiku 위임 — list/get 서브커맨드만 SubAgent 위임 | 04-17 09:20 | 04-17 09:21 | 1분 |
| 30 | ⬜ | §Step8 Haiku 5개 완료 커밋 + HISTORY.md 기록 | - | - | - |
| 31 | ✅ | §Step9 lk-code-review Sonnet 위임 — Claude 단독 모드 리뷰 분석 SubAgent | 04-17 09:21 | 04-17 09:22 | 1분 |
| 32 | ✅ | §Step10 lk-todo create Sonnet 위임 — Plan→태스크 분해 SubAgent | 04-17 09:22 | 04-17 09:23 | 1분 |
| 33 | ✅ | §Step11 lk-doc-compare Sonnet 위임 — 공문서 diff 해석 SubAgent | 04-17 09:23 | 04-17 09:24 | 1분 |
| 34 | ✅ | §Step12 lk-plan Phase 3·4 Sonnet 위임 — 대안 탐색 + YAGNI 리뷰 SubAgent | 04-17 09:24 | 04-17 09:25 | 1분 |
| 35 | ✅ | §Step13 lk-skill-create Phase 3 Sonnet 위임 — SKILL.md 본문 생성 SubAgent | 04-17 09:25 | 04-17 09:26 | 1분 |
| 36 | ⬜ | §Step14 Sonnet 5개 완료 커밋 + HISTORY.md 기록 | - | - | - |
| 37 | ⬜ | §Step15 최종 검증 — 10개 Skill 샘플 10건 이상 체크리스트 통과, 가이드라인 문서화 확인 | - | - | - |

## 진행 상황

완료: 33/37 (89%)
남은 항목:
- #26 파일럿 실사용 검증 (사용자) — `lk-its-ddl` / `lk-its-code` 2~3일 사용 후 폴백 발동률 확인
- #30 Haiku 5개 완료 커밋 — `/lk-commit`으로 진행
- #36 Sonnet 5개 완료 커밋 — `/lk-commit`으로 진행 (Haiku 커밋과 통합 가능)
- #37 최종 검증 (사용자) — 10개 Skill 실사용 샘플 10건 이상
