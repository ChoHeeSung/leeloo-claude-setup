# TODO

> 생성 기준: 2026-03-18-leeloo-kit-rebranding.md | 2026-03-18
> 설계 문서: .claude/plans/2026-03-18-leeloo-kit-rebranding.md

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

## 진행 상황

완료: 22/22 (100%)
