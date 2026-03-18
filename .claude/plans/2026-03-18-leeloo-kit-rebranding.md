# leeloo-kit: bkit 핵심 기능 통합 + 순수 플러그인 전환 계획

## Context

**leeloo-claude-setup**을 **leeloo-kit**으로 리브랜딩하고, bkit v1.6.2의 핵심 자동화 패턴을 통합하여 **bkit 없이 단독 사용**하는 회사 표준 플러그인으로 발전시킨다.

동시에 **셸 스크립트(setup-claude-code.sh, uninstall-claude-code.sh) 없이** 환경 설정이 가능한 **순수 플러그인 구조**로 전환한다.

**현재**: 6개 스킬 + 1개 hook + 셸 스크립트 기반 설치 (이름: leeloo-claude-setup)
**목표**: PDCA 워크플로우 + 다중 검증 자동화 + 에이전트 시스템의 **순수 플러그인** (이름: leeloo-kit)

**스킬 접두사**: `lk-` (leeloo-kit 약어, 검색·구분 용이)

## 구현 순서

| Step | 내용 | 파일 | 의존성 |
|------|------|------|--------|
| **1** | 리브랜딩 (plugin.json, marketplace.json) | `.claude-plugin/*` | 없음 |
| **2** | leeloo.config.json 생성 | `leeloo.config.json` | 없음 |
| **3** | scripts/lib/ 유틸리티 5개 | `scripts/lib/*.js` | Step 2 |
| **4** | hooks.json 전면 교체 | `hooks/hooks.json` | Step 3 |
| **5** | session-start.js | `scripts/session-start.js` | Step 3 |
| **6** | bash-pre.js, write-post.js | `scripts/bash-pre.js`, `write-post.js` | Step 3 |
| **7** | 템플릿 5개 | `templates/*.template.md` | 없음 |
| **8** | 에이전트 4개 | `agents/*.md` | Step 7 |
| **9** | lk-plan 스킬 (브레인스토밍 Plan) | `skills/lk-plan/SKILL.md` | Step 7 |
| **10** | lk-pdca 스킬 | `skills/lk-pdca/SKILL.md` | Step 7, 8 |
| **11** | skill-post.js, unified-stop.js | `scripts/skill-post.js`, `unified-stop.js` | Step 3, 8~10 |
| **12** | lk-cross-validate 강화 | `skills/lk-cross-validate/SKILL.md` | Step 3 |
| **13** | gemini-review-prompt.md 강화 | `resources/gemini-review-prompt.md` | 없음 |
| **14** | lk-agent 강화 (프리셋 7종) | `skills/lk-agent/SKILL.md` | 없음 |
| **15** | lk-team 강화 (프리셋 5종) | `skills/lk-team/SKILL.md` | 없음 |
| **16** | lk-todo, lk-commit 강화 | `skills/lk-todo/SKILL.md`, `lk-commit/SKILL.md` | 없음 |
| **17** | lk-review 신규 | `skills/lk-review/SKILL.md` | Step 8 |
| **18** | lk-setup 역할 변경 | `skills/lk-setup/SKILL.md` | 없음 |
| **19** | 아웃풋 스타일 3개 | `output-styles/*.md` | 없음 |
| **20** | CLAUDE.md 템플릿 갱신 | `resources/CLAUDE.md` | 전체 |
| **21** | 셸 스크립트 제거 | `setup-claude-code.sh`, `uninstall-claude-code.sh` 삭제 | Step 18 |
| **22** | settings-template.json 제거 | `resources/settings-template.json`, `resources/settings.local.json` 삭제 | Step 4 |

## 변경 파일 총정리

### 새로 생성 (26개)
- leeloo.config.json
- scripts/lib/ — io.js, config.js, paths.js, pdca-status.js, context.js (5개)
- scripts/ — session-start.js, unified-stop.js, skill-post.js, bash-pre.js, write-post.js (5개)
- agents/ — gap-detector.md, pdca-iterator.md, code-analyzer.md, report-generator.md (4개)
- skills/lk-plan/SKILL.md, skills/lk-pdca/SKILL.md, skills/lk-review/SKILL.md (3개)
- templates/ — plan, design, analysis, report, do (5개)
- output-styles/ — lk-dual-verify.md, lk-mentor.md, lk-ops.md (3개)

### 수정 (11개)
- .claude-plugin/plugin.json, marketplace.json
- hooks/hooks.json
- skills/lk-agent, lk-team, lk-cross-validate, lk-todo, lk-commit, lk-setup
- resources/gemini-review-prompt.md, resources/CLAUDE.md

### 삭제 (4개)
- setup-claude-code.sh, uninstall-claude-code.sh
- resources/settings-template.json, resources/settings.local.json
