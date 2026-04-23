---
name: lk-harness
description: "하네스 감사 — 컨텍스트 예산·SKILL drift·CLAUDE.md 크기 검사"
user_invocable: true
argument-hint: "[context-lint] [--verbose]"
---

# /lk-harness — 하네스 엔지니어링 감사

leeloo-kit 하네스의 건강성을 감사하고 위반 항목을 상세 리포트로 출력합니다. Stop hook이 1줄 요약만 제공하므로, 상세 조사는 본 스킬로 수행합니다.

## 서브커맨드

```
/lk-harness                       — context-lint와 동일 (기본)
/lk-harness context-lint          — 컨텍스트 예산 감사 요약
/lk-harness context-lint --verbose — 위반 항목 상세
```

> Tier 2·3에서 `budget`(세션 토큰 관측) / `failure-memory`(실패 기록 rotate) / `cache-audit`(prefix 변동성) 서브커맨드가 추가될 예정. 여기서만 누적한다(다른 스킬로 분산 금지 — SRP 유지).

## Procedure

### 인자 파싱

사용자 입력에서 서브커맨드를 파싱합니다.

- 인자 없음 또는 `context-lint` → **context-lint** 동작
- `--verbose` 플래그 → 상세 모드

---

### context-lint 동작

하네스 컨텍스트 예산을 감사합니다.

**감사 대상**

| 카테고리 | 대상 | 임계 기본값 |
|---------|------|------------|
| skill-description | `*/skills/*/SKILL.md` frontmatter `description` 길이 | 100자 |
| skill-argument-hint | 동 frontmatter `argument-hint` 길이 | 120자 |
| claude-md-root | 루트 `CLAUDE.md` 줄 수 | 60줄 |
| claude-md-plugin | 각 플러그인 `CLAUDE.md` 줄 수 | 70줄 |
| commands-drift | `commands/*.md` ↔ `SKILL.md` frontmatter 일치 | 완전 일치 |

**실행**

기본(요약):
```bash
node leeloo-kit/scripts/context-lint.js
```

상세(--verbose):
```bash
node leeloo-kit/scripts/context-lint.js --verbose
```

출력 예(상세):

```
context-lint: 2건
  [skill-description] leeloo-doc/skills/lk-doc-parse/SKILL.md — 142 > 100
  [commands-drift] leeloo-kit/commands/lk-persona.md (out-of-sync)
```

**임계 조정**

기본값은 `leeloo-kit/resources/context-budget.default.json` (git 추적). 프로젝트별 오버라이드는 `.leeloo/context-budget.json`에 동일 키로 작성합니다(얕은 merge).

```json
{
  "skill_description_max": 100,
  "skill_argument_hint_max": 120,
  "claude_md_plugin_max_lines": 70,
  "claude_md_root_max_lines": 60,
  "hook_output_max_chars": 300,
  "commands_drift_check": true
}
```

**Stop hook 자동 감사**

세션 종료(Stop 이벤트) 시 동일 검사가 자동 실행되며, 위반 시 1줄 요약만 표시됩니다. 상세는 본 커맨드(`--verbose`)로 재조회하세요. 자동 실행이 실패해도(silent-fail) 기존 Stop 동작을 막지 않습니다.

**drift 자동 수정**

`commands-drift` 위반은 다음으로 즉시 재생성됩니다.

```bash
node leeloo-kit/scripts/generate-commands.js --sync
```

SKILL.md `description`·`argument-hint` 변경 후 반드시 실행하세요.

---

## Notes

- 본 스킬은 **읽기 전용 감사**입니다. 파일을 자동 수정하지 않습니다.
- 위반을 허용하려면 임계를 조정하거나 `.leeloo/context-budget.json`의 `ignore_paths`에 경로를 추가하세요.
- `context-lint.js`는 CLI와 모듈 양면으로 동작하며, Tier 2·3 신규 감사(`token-budget`, `cache-audit`, `failure-memory-rotate`)가 같은 패턴으로 병렬 누적될 예정입니다.
