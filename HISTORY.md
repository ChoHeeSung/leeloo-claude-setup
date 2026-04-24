# HISTORY

| 날짜 | 작업 | 상세 |
|------|------|------|
| 2026-04-24 13:21 | refactor(leeloo-kit): lk-persona 상세 모드 keep-coding-instructions 경고 추가 — false 선택 시 꺼지는 SWE 가드 명시 + plugin.json↔marketplace.json sync 복구 (v3.5.11) | [상세](history/2026-04-24_1321_persona-keep-coding-warning.md) |
| 2026-04-24 12:49 | refactor(leeloo-kit): lk-persona 본문 슬림화 + Step 6 요약 inject — prompt cache prefix 중복 적재 제거 (v3.5.10) | [상세](history/2026-04-24_1249_persona-cache-friendly.md) |
| 2026-04-24 10:18 | refactor(leeloo-kit): lint 플래그 호환성 + Go linter 업데이트 (v3.5.9) | [상세](history/2026-04-24_1018_lint-flag-compat.md) |
| 2026-04-24 09:06 | resources/CLAUDE.md 동기화 — 스파게티 원칙 역 sync + 스킬 목록 섹션 제거(자동 로드와 중복) + Failure Memory 절차 CLAUDE.local.md 기준 갱신 (leeloo-kit 3.5.7) | [상세](history/2026-04-24_0906_resources-claude-md-sync.md) |
| 2026-04-24 08:53 | Failure Memory를 CLAUDE.local.md로 분리 — 루트 CLAUDE.md prompt cache prefix 안정화 (cache-audit volatility 1.05 🔴 해소, leeloo-kit 3.5.6) | [상세](history/2026-04-24_0853_failure-memory-local-split.md) |
| 2026-04-24 09:00 | 하네스 Tier 3 — failure-memory-rotate(KEEP_RECENT=50·패턴 클러스터링·CLAUDE.md 상위 3 요약) + cache-audit(볼라틸리티 감사) + lk-harness 2개 서브커맨드 (leeloo-kit 3.5.5) | [상세](history/2026-04-24_0900_harness-tier3-memory-rotation-cache-audit.md) |
| 2026-04-24 08:40 | 하네스 Tier 2 — token-budget.js + session hook 통합 + statusline 보라 블록 + lk-harness budget 서브커맨드 4개 뷰 (leeloo-kit 3.5.4) | [상세](history/2026-04-24_0840_harness-tier2-session-budget-observability.md) |
| 2026-04-24 08:25 | lk-harness 스킬 분리 — 하네스 감사 책임을 lk-setup에서 이주(SRP 복원) + Tier 2·3 확장 자리 확보 (leeloo-kit 3.5.3) | [상세](history/2026-04-24_0825_lk-harness-skill-split.md) |
| 2026-04-24 07:27 | 하네스 Tier 1 — context-lint.js + Stop hook 통합으로 SKILL description·CLAUDE.md 줄수·commands drift 자동 가드 (leeloo-kit 3.5.2) | [상세](history/2026-04-24_0727_harness-tier1-drift-context-guard.md) |
| 2026-04-23 18:01 | 슬래시 커맨드 chip 복원 — 8개 플러그인에 commands/ wrapper 32개 추가, generate-commands.js 자동 생성 스크립트 + drift 감지 | [상세](history/2026-04-23_1801_slash-command-chip-restore.md) |
| 2026-04-23 17:18 | 플러그인 버전 업 — leeloo-kit 3.5.0 + leeloo-git 1.1.0 + 6개 patch, marketplace.json 동기화, 모든 리모트 push | [상세](history/2026-04-23_1718_plugin-version-bump.md) |
| 2026-04-23 16:19 | 세션 토큰 최적화 — SKILL.md·CLAUDE.md 압축, hook 출력 다이어트, lk-setup plugins 대화형 on/off 확장 (세션당 ~60% 절감) | [상세](history/2026-04-23_1619_session-token-optimization.md) |
| 2026-04-23 08:56 | kordoc 2.5.2 재검증 + 테두리 미표시 원인 진단 — bold/ordered list 통과, 테두리는 header.xml refList 이슈로 좁혀 upstream #4 리포트 | [상세](history/2026-04-23_0856_kordoc-2.5.2-verify.md) |
| 2026-04-22 14:44 | 스파게티 코드 작성 금지 원칙 추가 — 글로벌/프로젝트 CLAUDE.md 8개 체크리스트 | [상세](history/2026-04-22_1444_anti-spaghetti-coding-principles.md) |
| 2026-04-22 12:50 | Markdown → HWPX 역변환 스킬 추가 — kordoc 2.5.1 + lk-doc-md2hwpx (leeloo-doc v1.2.0) | [상세](history/2026-04-22_1250_kordoc-2.5.1-md2hwpx.md) |
| 2026-04-22 08:56 | 세션 시작 시 활성 페르소나 표시 — loadActivePersona() 신설 (leeloo-kit v3.4.0) | [상세](history/2026-04-22_0856_session-start-persona-display.md) |
| 2026-04-21 18:25 | lk-persona 스킬 추가 — 세션 페르소나 대화형 관리 (leeloo-kit v3.3.0) | [상세](history/2026-04-21_1825_lk-persona-skill.md) |
| 2026-04-17 12:18 | 플러그인 버전 동기화 + leeloo-kit 배너 하드코딩 제거 — plugin.json 단일 소스화 | [상세](history/2026-04-17_1218_version-sync-hardcode-removal.md) |
| 2026-04-17 09:25 | 10개 Skill에 Haiku/Sonnet 위임 패턴 적용 + 모델 선택 가이드라인 문서화 | [상세](history/2026-04-17_0925_model-delegation-10-skills.md) |
| 2026-04-17 08:51 | lk-commit: HISTORY Haiku 위임 + 세션 정리 옵션 추가 | [상세](history/2026-04-17_0851_lk-commit-haiku-session-cleanup.md) |
| 2026-04-10 11:30 | 플러그인 유형별 재편 — 5개 → 8개 (워크플로우/Git/에이전트 분리, leeloo-doc/leeloo-its 리네임) | [상세](history/2026-04-10_1130_plugin-restructure-8.md) |
| 2026-04-10 11:00 | Context Checkpoint 구현 + MCP 헬스체크 제거 + lk-iu-pdf-extract → lk-doc-pdf-extract 리네임 | [상세](history/2026-04-10_1100_context-checkpoint-and-cleanup.md) |
| 2026-04-10 10:30 | README.md v3.1.0 반영 — 버전, 훅 7개 이벤트, lk-skill-create, 다양한 개발언어 지원 추가 | [상세](history/2026-04-10_1030_readme-v310-update.md) |
| 2026-04-09 09:45 | ECC Hooks & Skill-Creator 통합 — v3.1.0 (배치 품질체크, 세션 라이프사이클, MCP 헬스체크, lk-skill-create) | [상세](history/2026-04-09_0945_ecc-hooks-skill-creator.md) |
| 2026-04-08 10:10 | Failure Memory — hook 기반 → 자기 기록 방식 전환 (tool_response 비어있음 발견) | [상세](history/2026-04-08_1010_failure-memory-self-record.md) |
| 2026-04-08 09:45 | plugin.json hooks 등록 누락 수정 — PostToolUse hook 미실행 원인 해결 | [상세](history/2026-04-08_0945_hook-registration-fix.md) |
| 2026-04-08 09:30 | PDCA 잔존 참조 정리 + 필수 원칙 2개 추가 (미루기 금지, 재탐색 원칙) | [상세](history/2026-04-08_0930_pdca-cleanup-and-rules.md) |
| 2026-04-07 09:20 | lk-commit 커밋 메시지 표준 적용 — commit-messages-guide 기반 3부분 구조 | [상세](history/2026-04-07_0920_commit-message-standard.md) |
| 2026-04-07 09:05 | SessionStart 린터 미설치 자동 감지 — 사용자 확인 후 설치 안내 | [상세](history/2026-04-07_0905_lint-auto-detect.md) |
| 2026-04-07 08:55 | CLAUDE.md 미존재 시 자동 생성 — Failure Memory Loop 버그 수정 | [상세](history/2026-04-07_0855_claudemd-auto-create.md) |
| 2026-04-07 08:45 | lk-setup install/reinstall 파라미터 추가 — 일괄 설치 + 강제 재설치 | [상세](history/2026-04-07_0845_lk-setup-install-reinstall.md) |
| 2026-04-07 08:30 | leeloo-kit v3.0.0 — PDCA 제거, 하네스 엔지니어링 전환 (Failure Memory Loop + 자동 품질 검사) | [상세](history/2026-04-07_0830_harness-engineering.md) |
| 2026-04-05 09:02 | its-ddl-tool 마켓플레이스 마이그레이션 — 스킬 3개, lk-its- 접두사 | [상세](history/2026-04-05_0902_its-ddl-tool-migration.md) |
| 2026-04-01 14:54 | lk-git-init 스킬 추가 — 대화형 Git 초기화 (remote, .gitignore, LFS) | [상세](history/2026-04-01_1454_lk-git-init.md) |
| 2026-04-01 08:48 | HWPX 역변환 기능 제거 — kordoc 한글 호환 불가로 --to-hwpx 제거 | [상세](history/2026-04-01_0848_hwpx-generate-remove.md) |
| 2026-03-31 17:13 | HISTORY.md 작성 규칙 변경 — lk-commit 시 선택적 작성으로 전환 | [상세](history/2026-03-31_1713_history-commit-workflow.md) |
| 2026-03-31 | kordoc 통합 구현 완료 — 스킬 3개 + 래퍼 4개 + 환경 스크립트 | [상세](history/2026-03-31_kordoc-integration-do.md) |
| 2026-03-31 | kordoc 통합 Design 작성 — CLI + 래퍼 스크립트 하이브리드 설계 | [상세](history/2026-03-31_kordoc-integration-design.md) |
| 2026-03-31 | kordoc 통합 Plan 작성 — 스킬 래핑 방식으로 leeloo-util 편입 결정 | [상세](history/2026-03-31_kordoc-integration-plan.md) |
| 2026-03-31 | kordoc 레포지토리 분석 — 한국 공문서 파서 + MCP 서버 | [상세](history/2026-03-31_kordoc-analysis.md) |
| 2026-03-30 | leeloo-util 확장 — lk-hwp 스킬 3개 추가 + HISTORY 개편 | [상세](history/2026-03-30_leeloo-util-hwp.md) |
| 2026-03-25 | leeloo-bitbucket 인증 개선 — Basic Auth + 설정 파일 분리 | [상세](history/2026-03-25_leeloo-bitbucket.md) |
| 2026-03-19 | gemini-cli timeout 명령 macOS 호환성 수정 | [상세](history/2026-03-19_gemini-timeout-fix.md) |
| 2026-03-18 | leeloo-kit v2.0.0 리브랜딩 + PDCA 워크플로우 도입 | [상세](history/2026-03-18_leeloo-kit-v2.md) |
| 2026-03-17 | uv 자동 설치, SessionStart→스킬 전환, Agent Team 설정 추가 | [상세](history/2026-03-17_setup-scripts.md) |
| 2026-03-16 | 플러그인 기반 구조 설계 — git setup, 마켓플레이스, Gemini 교차검증, 버그 수정 | [상세](history/2026-03-16_plugin-foundation.md) |
| 2026-03-05 | 상태바 스크립트 파일명 변경: statusline-cc-chips → statusline-leeloo | [상세](history/2026-03-05_statusline-rename.md) |
