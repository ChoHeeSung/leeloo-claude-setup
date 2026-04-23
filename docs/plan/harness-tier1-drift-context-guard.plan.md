# Plan: harness-tier1-drift-context-guard

> 작성일: 2026-04-23 | 작성자: Claude(harness-claude-expert) + leeloo.chs@gmail.com

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | Drift Guard + Context Budget Linter (Tier 1) |
| 목적 | `commands/` ↔ `SKILL.md` 드리프트 자동 차단 + 컨텍스트 비만(description·CLAUDE.md·hook 출력) 회귀 방지 |
| 예상 기간 | 0.5~1일 |
| 복잡도 | Low |
| 세션 자동 로드 비용 증가 | **0** (Stop hook 시점만, 출력 1줄 이내) |

## 1. 배경 및 목적

### 문제 정의

- **Drift**: `SKILL.md` frontmatter와 `commands/*.md` wrapper가 괴리되면 `/`-자동완성 chip이 SKILL 최신 정의를 반영하지 못함. 방금 이 세션에서 경험한 회귀 원인.
- **Context 비만 회귀**: 커밋 233e263에서 description을 평균 75자로 압축했지만, 아무런 가드가 없어 누구든 다시 장문을 작성하면 세션 로드 토큰이 원상 복귀한다.

### 가드 대상 (수치 임계값, `.leeloo/context-budget.json`로 외부화)

| 항목 | 상한 | 근거 |
|------|------|------|
| `SKILL.md` `description` | 100자 | 233e263 이후 평균 75자 |
| `SKILL.md` `argument-hint` | 120자 | 시그니처 길이 상한 |
| `CLAUDE.md` (plugin) | 60줄 | leeloo-kit/CLAUDE.md 43줄 기준 |
| `CLAUDE.md` (루트) | 50줄 | 현 38줄 기준 |
| hook 단일 출력 | 300자 | session-start 이전 세션 요약 상한과 동일 |
| `commands/*.md` ↔ `SKILL.md` frontmatter | 완전 일치 | wrapper는 generate-commands.js로 생성 |

## 2. 범위

**In**
- `leeloo-kit/scripts/context-lint.js` 신규 — 임계 검사 + drift-check 래핑
- Stop hook 확장: `stop-quality-check.js`에 lint 호출 추가 (새 hook event 추가 **안 함**)
- `.leeloo/context-budget.json` 기본 설정 파일 생성
- `lk-setup`에 `context-lint` 서브커맨드 추가 (on-demand 상세 리포트)

**Out**
- 자동 수정(auto-fix)은 하지 않음. 경고만.
- 글로벌 `~/.claude/CLAUDE.md`는 검사 대상 외.
- hook 출력 런타임 측정은 Tier 2로 이월.

## 3. 설계

### 3.1 context-lint.js 구조 (SRP 분해)

```
main(args)
 ├─ loadBudget()             .leeloo/context-budget.json 로드 (없으면 기본값)
 ├─ collectViolations()
 │   ├─ lintSkillDescriptions()    모든 SKILL.md 순회
 │   ├─ lintClaudeMdSizes()        루트·플러그인 CLAUDE.md 줄 수
 │   └─ driftCheckCommands()       generate-commands.js runCheck 재사용 (require)
 └─ report(violations, mode)       mode=stop|cli
```

**함수 규칙** — 각 함수 40줄 이내, 중첩 3단계 이하, SRP 준수(글로벌 원칙 7).

### 3.2 Stop hook 통합

`leeloo-kit/scripts/stop-quality-check.js`에 1개 함수 추가:

```js
function runContextLint() {
  try {
    const { runLint } = require('./context-lint.js');
    const { violations } = runLint('stop');
    if (violations.length === 0) return null;
    return `context-lint: ${violations.length} issue(s) — 상세: node leeloo-kit/scripts/context-lint.js`;
  } catch (e) {
    return null; // silent-fail, hook은 절대 세션을 깨지 않음
  }
}
```

출력은 **1줄**만. 상세는 명령으로 재요청.

### 3.3 `lk-setup context-lint` 서브커맨드

on-demand 상세 리포트 — 세션 자동 로드와 분리.

```
/lk-setup context-lint
  → 모든 위반 항목을 파일·라인·초과량으로 출력
  → --fix: 없음 (의도적)
  → --config: .leeloo/context-budget.json 편집 안내
```

### 3.4 설정 파일 스키마

```json
{
  "skill_description_max": 100,
  "skill_argument_hint_max": 120,
  "claude_md_plugin_max_lines": 60,
  "claude_md_root_max_lines": 50,
  "hook_output_max_chars": 300,
  "ignore_paths": []
}
```

## 4. 구현 단계

1. `.leeloo/context-budget.json` 기본값 커밋
2. `leeloo-kit/scripts/context-lint.js` 작성 + 단위 테스트용 fixture
3. `generate-commands.js` 재export 추가(`runCheck` 공개) — 기존 exit-기반을 함수 반환으로 리팩터
4. `stop-quality-check.js` 통합 — 기존 출력 뒤에 lint 결과 병합
5. `lk-setup` SKILL.md에 `context-lint` 서브커맨드 섹션 추가
6. 현재 레포에 대해 실행 → 기존 위반 0건 확인 or 리포트 후 baseline 조정
7. plugin leeloo-kit patch bump (3.5.1 → 3.5.2), marketplace.json, HISTORY.md

## 5. 리스크 / 엣지케이스

| 리스크 | 대응 |
|--------|------|
| lint 실패로 Stop hook이 세션 종료를 막음 | `try/catch` + silent-fail. lint 결과가 없으면 기존 동작과 동일. |
| 기존 파일이 임계 초과 상태 | 초기 실행 시 baseline을 `.leeloo/context-budget.json`에 기록(허용 목록이 아닌 임계 상향) |
| `generate-commands.js` 구조 변경이 다른 스크립트에 영향 | 함수 공개만 추가(기존 CLI 호출 변경 없음) |
| description 다국어 길이 측정 | 기본 UTF-16 code units. 필요 시 `[...str].length`로 전환 가능 |

## 6. 테스트 절차

1. 기본 실행: `node leeloo-kit/scripts/context-lint.js` → 현재 레포 위반 0 확인
2. 인위적 drift: `commands/lk-persona.md` 수정 → Stop hook에서 `context-lint: 1 issue(s)` 출력 확인
3. 임계 초과: `leeloo-kit/CLAUDE.md`에 20줄 추가 → Stop 출력에 항목 포함 확인
4. silent-fail: `context-lint.js`를 문법 오류로 깨뜨림 → Stop 정상 동작 확인

## 7. 완료 기준

- [ ] `context-lint.js` 실행 후 현 레포 위반 0건
- [ ] Stop hook 통합 후 위반 발생 시 1줄 경고, 정상 시 무출력
- [ ] `/lk-setup context-lint` 상세 리포트 동작
- [ ] drift·임계·silent-fail 테스트 4건 통과
- [ ] HISTORY.md 기록 + leeloo-kit 3.5.2 배포
