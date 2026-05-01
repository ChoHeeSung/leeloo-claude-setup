# leeloo-kit

Harness engineering core + environment/tools. An automation engine applied automatically by installing the plugin.

## Harness Engineering

1. **Failure Memory Loop** — All failures are recorded in `.leeloo/failure-memory/{type}.md`, and the latest 3 entries are auto-injected into CLAUDE.md (following global CLAUDE.md rules).
2. **Batch quality check** — On Write/Edit, paths are collected → on Stop, lint/typecheck runs in batch. Supports: JS/TS, Python, Erlang/Elixir, Java, Go, Rust, HTML.
3. **Session lifecycle** — SessionEnd persists state → next SessionStart restores it. PreCompact preserves state. Context Checkpoint keeps work context alive.
4. **Control Flow** — PreToolUse blocks dangerous commands (`rm -rf`, `git push --force`).

## Architecture

- `hooks/hooks.json` — 6 hook events (SessionStart, PreToolUse, PostToolUse×3, PreCompact, Stop, SessionEnd)
- `scripts/` — Hook runtime (Node.js v18+ CommonJS). session-start / bash-pre / post-edit-accumulator / tool-failure-post / skill-post / stop-quality-check / pre-compact / session-end + `lib/` (io, config, paths, context, failure-log, edit-accumulator).
- `leeloo.config.json` — Harness configuration (failure memory, back-pressure, cross-validation)
- `skills/` — lk-setup, lk-skill-create, lk-persona, lk-harness, lk-coding-guard
- `agents/` — code-analyzer
- `output-styles/` — lk-dual-verify, lk-mentor, lk-ops

## Failure Memory layout

```
.leeloo/context-summary.md         Context Checkpoint (max 20 lines)
.leeloo/failure-memory/{type}.md   Per-type failure details
.leeloo/sessions/                  Session summary persistence
.leeloo/edited-files.tmp           For batch quality check
```

## Detailed rules (refer when needed)

- Context Checkpoint rules — `resources/context-checkpoint.md`
- Model selection / skill delegation strategy — `resources/model-delegation.md`
- Failure Memory recording rules — `~/.claude/CLAUDE.md` §Failure Memory rules

## Testing

1. Verify the `leeloo-kit v{version}` message at SessionStart
2. On Write/Edit, paths accumulate in `.leeloo/edited-files.tmp`
3. On Stop, batch quality check runs
4. On SessionEnd, session summary is generated under `.leeloo/sessions/`
5. On PreCompact, Failure Memory + Context Checkpoint are preserved
