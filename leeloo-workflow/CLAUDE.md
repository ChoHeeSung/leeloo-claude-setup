# leeloo-workflow

Development workflow plugin. Plan authoring, code review, Gemini cross-validation, TODO management.

## Skills

| Skill | Purpose |
|-------|---------|
| lk-plan | Brainstorming-based plan authoring + Gemini cross-validation integration |
| lk-plan-cross-review | Plan/Design independent verification by Gemini |
| lk-code-review | Code review (Claude alone or `--dual` Gemini double review) |
| lk-todo | Plan → TODO list conversion/management |

## Dependencies

- gemini-cli: required for lk-plan-cross-review and lk-code-review --dual
