# leeloo-kit

하네스 엔지니어링 코어 + 환경/도구. 플러그인 설치만으로 자동 적용되는 자동화 엔진.

## Harness Engineering

1. **Failure Memory Loop** — 모든 실패를 `.leeloo/failure-memory/{type}.md`에 기록, CLAUDE.md에 최근 3건 자동 주입(글로벌 CLAUDE.md 규칙 준수).
2. **배치 품질체크** — Write/Edit 시 경로 수집 → Stop에서 일괄 lint/typecheck. 지원: JS/TS, Python, Erlang/Elixir, Java, Go, Rust, HTML.
3. **세션 라이프사이클** — SessionEnd 영속화 → 다음 SessionStart 복원. PreCompact 보존. Context Checkpoint로 작업 맥락 생존.
4. **Control Flow** — PreToolUse로 위험 명령 차단(`rm -rf`, `git push --force`).

## Architecture

- `hooks/hooks.json` — 6 hook events (SessionStart, PreToolUse, PostToolUse×3, PreCompact, Stop, SessionEnd)
- `scripts/` — Hook runtime (Node.js v18+ CommonJS). session-start / bash-pre / post-edit-accumulator / tool-failure-post / skill-post / stop-quality-check / pre-compact / session-end + `lib/` (io, config, paths, context, failure-log, edit-accumulator).
- `leeloo.config.json` — 하네스 설정(failure memory, back-pressure, cross-validation)
- `skills/` — lk-setup, lk-skill-create, lk-persona, lk-harness, lk-coding-guard
- `agents/` — code-analyzer
- `output-styles/` — lk-dual-verify, lk-mentor, lk-ops

## Failure Memory 구조

```
.leeloo/context-summary.md         Context Checkpoint (최대 20줄)
.leeloo/failure-memory/{type}.md   유형별 실패 상세
.leeloo/sessions/                  세션 요약 영속화
.leeloo/edited-files.tmp           배치 품질체크용
```

## 상세 규칙 (필요 시 참조)

- Context Checkpoint 규칙 — `resources/context-checkpoint.md`
- 모델 선택 / Skill 위임 전략 — `resources/model-delegation.md`
- Failure Memory 기록 규칙 — `~/.claude/CLAUDE.md` §Failure Memory 규칙

## Testing

1. SessionStart에서 `leeloo-kit v{version}` 메시지 확인
2. Write/Edit 시 `.leeloo/edited-files.tmp`에 경로 축적
3. Stop에서 배치 품질체크 일괄 실행
4. SessionEnd에서 `.leeloo/sessions/` 세션 요약 생성
5. PreCompact에서 Failure Memory + Context Checkpoint 보존
