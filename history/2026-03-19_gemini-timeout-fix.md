# 2026-03-19 — gemini-cli timeout 명령 macOS 호환성 수정

## gemini-cli timeout 명령 macOS 호환성 수정

**지시 요약**: `lk-code-review --dual` 및 `lk-plan-cross-review`에서 gemini 실행 시 `timeout 120` 명령 사용 → macOS에 GNU timeout이 없어 실패하는 문제 수정.

**작업 내용**:
- `lk-code-review/SKILL.md`, `lk-plan-cross-review/SKILL.md`에서 `timeout 120 gemini` → `gemini` 으로 변경
- Bash 도구의 timeout 파라미터(120000ms)를 사용하도록 안내문 추가

**핵심 변경**:
```diff
-timeout 120 gemini -p "$(cat <<'PROMPT_EOF'
+gemini -p "$(cat <<'PROMPT_EOF'
```

**비유**: 한국에서는 "119"로 전화하면 소방서가 오지만, 미국에서는 "911"을 눌러야 한다. OS마다 명령어가 다른 것도 마찬가지 — macOS에서는 `timeout` 대신 다른 방식으로 시간 제한을 걸어야 한다.

**결과**: 커밋 `8601773` → push 완료.
