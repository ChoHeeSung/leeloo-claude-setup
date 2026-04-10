# leeloo-workflow

개발 워크플로우 플러그인. Plan 작성, 코드 리뷰, Gemini 교차검증, TODO 관리.

## Skills

| Skill | Purpose |
|-------|---------|
| lk-plan | 브레인스토밍 기반 Plan 작성 + Gemini 교차검증 연동 |
| lk-plan-cross-review | Plan/Design Gemini 독립 검증 |
| lk-code-review | 코드 리뷰 (Claude 단독 또는 --dual Gemini 이중) |
| lk-todo | Plan → TODO 리스트 변환/관리 |

## Dependencies

- gemini-cli: lk-plan-cross-review, lk-code-review --dual에 필요
