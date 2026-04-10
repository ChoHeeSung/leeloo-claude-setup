# 플러그인 유형별 재편 — 5개 → 8개

## 지시
30개 스킬을 기능 유형별로 재분류하여 플러그인 구조 재편 요청.

## 작업 내용

### 재편 결과

| 유형 | 플러그인 | 스킬 수 | 변경 |
|------|---------|--------|------|
| 환경/도구 | leeloo-kit | 2 | 스킬 9→2 축소 (코어 엔진 유지) |
| 워크플로우 | leeloo-workflow | 4 | **신규** (leeloo-kit에서 분리) |
| Git | leeloo-git | 2 | **신규** (kit에서 lk-commit, util에서 lk-git-init) |
| 에이전트/팀 | leeloo-agent | 2 | **신규** (leeloo-kit에서 분리) |
| 문서/도면 | leeloo-doc | 4 | **리네임** (leeloo-util → leeloo-doc, lk-git-init 이동) |
| 외부 연동 | leeloo-bitbucket | 5 | 유지 |
| 외부 연동 | leeloo-n8n | 8 | 유지 |
| 외부 연동 | leeloo-its | 3 | **리네임** (its-ddl-tool → leeloo-its) |

### 핵심 변경
- leeloo-kit: hooks/scripts/agents/output-styles/templates/resources 그대로 유지 (하네스 코어)
- 신규 3개 플러그인(workflow, git, agent): 스킬만 있는 경량 플러그인
- leeloo-util → leeloo-doc: 디렉토리 리네임 + plugin.json/CLAUDE.md 수정
- its-ddl-tool → leeloo-its: 디렉토리 리네임 + 접두사 통일
- marketplace.json: 8개 플러그인 등록
- settings.json: enabledPlugins 업데이트
- README.md, CLAUDE.md: 전면 재작성

## 현실 비유
하나의 큰 공구함(leeloo-kit)에 모든 도구가 들어있던 것을
용도별 서랍장으로 분리한 것. 망치는 "Git 서랍", 줄자는 "워크플로우 서랍",
전동드릴은 "에이전트 서랍"으로. 공구함 본체(하네스 엔진)는 그대로.

## 결과
36 files changed (디렉토리 이동으로 삭제+생성 포함)
