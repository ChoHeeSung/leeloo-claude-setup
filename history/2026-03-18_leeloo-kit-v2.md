# 2026-03-18 — leeloo-kit v2.0.0 리브랜딩 + PDCA 워크플로우 도입

## leeloo-kit v2.0.0 리브랜딩 + PDCA 워크플로우 도입

**지시 요약**: leeloo-claude-setup → leeloo-kit으로 리브랜딩. PDCA 워크플로우, Gemini+Claude 이중 검증, 에이전트 자동화를 도입. 셸 스크립트 제거하고 순수 플러그인 구조로 전환.

**작업 내용**:

1. **리브랜딩**: plugin.json name → "leeloo-kit", 스킬 접두사 leeloo- → lk-
2. **순수 플러그인 전환**: setup-claude-code.sh, uninstall-claude-code.sh 삭제. settings-template.json, resources/settings.local.json 삭제. 마커 파일/백업 메커니즘 불필요.
3. **기반 인프라**: leeloo.config.json(중앙 설정), scripts/lib/(유틸리티 5개), hooks.json(5 이벤트), 런타임 스크립트 5개
4. **PDCA 스킬**: lk-plan(브레인스토밍 Plan), lk-pdca(design/do/analyze/report/status)
5. **검증 자동화**: lk-cross-validate(Score Card), lk-review(Gemini+Claude 이중 리뷰)
6. **에이전트 4개**: gap-detector, pdca-iterator, code-analyzer, report-generator
7. **기존 스킬 강화**: lk-agent(7종 프리셋), lk-team(5종 프리셋), lk-todo(설계문서 참조), lk-commit(TODO 연동), lk-setup(선택적 환경)
8. **템플릿 5개**: plan, design, analysis, report, do
9. **아웃풋 스타일 3개**: lk-dual-verify, lk-mentor, lk-ops
10. **레거시 제거**: leeloo-* 스킬 디렉토리 6개, 셸 스크립트 2개, 불필요 리소스 2개

**구현 방식**: Agent Team (3명 병렬) — infra(config/lib/hooks/scripts), content(템플릿/에이전트/스타일), skills(스킬 9개). 약 10분 만에 22개 태스크 완료.

**결과**:
- 생성: 30+ 파일 (scripts, agents, skills, templates, output-styles)
- 수정: 4 파일 (plugin.json, hooks.json, CLAUDE.md x2)
- 삭제: 10 파일 (셸 스크립트 2 + 레거시 스킬 6 + 불필요 리소스 2)

**비유**: 기존에는 "사무실 셋업 매뉴얼(setup script)"을 들고 다니며 하나하나 설치해야 했다면, 이제는 "스마트 오피스 패키지(순수 플러그인)"를 구독하면 모든 시스템이 자동으로 켜지는 것과 같다. PDCA 워크플로우는 건축 프로젝트와 같아서 — 설계도(Plan) → 상세도면(Design) → 시공(Do) → 감리(Analyze) → 준공보고서(Report) 순서를 강제하고, 감리 합격률(Match Rate)이 90% 미만이면 재시공을 지시한다.
