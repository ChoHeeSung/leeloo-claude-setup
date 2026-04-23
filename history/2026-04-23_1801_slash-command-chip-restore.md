# 슬래시 커맨드 chip 복원 — commands/ wrapper 32개 추가

## 지시 요약

`/lk-xxx` 슬래시 커맨드 입력 시 나타나던 회색 argument-hint chip이 이전 커밋 이후 사라진 현상을 전반적으로 확인하고 복원. 정석 경로로 추진.

## 배경 — 왜 힌트가 사라졌나

커밋 `233e263` (세션 토큰 최적화)에서 SKILL.md 32개의 `description` 필드를 압축하면서, 기존에 포함돼 있던 명령 시그니처(`/lk-persona [create|use|list|...]` 등)를 모두 frontmatter의 `argument-hint` 필드로 이관함.

하지만 Claude Code 하네스는:

- **slash command**(`commands/*.md`) frontmatter의 `argument-hint`만 `/` 자동완성 팝업에 회색 chip으로 렌더링
- **skill**(`SKILL.md`)의 `argument-hint`는 렌더링 대상이 아님

결과: 시그니처를 옮겨둔 필드가 읽히는 경로가 없어 32개 모두 chip이 일제히 사라짐.

## 현실 비유

스킬이 든 폴더에 "설명 라벨"을 붙여놨지만, 입구의 안내 전광판은 그 라벨을 읽지 않고 "간판 전용 상자"(`commands/`)만 읽는 구조였다. 원래는 설명 라벨에 사용법까지 같이 써 두어서 안내 전광판이 일부라도 가져다 표시하고 있었는데, 라벨을 짧게 다듬어 사용법을 별도 필드로 뽑아내자 전광판이 참조할 근거가 통째로 사라진 셈.

해결은 간판 전용 상자(`commands/`)를 따로 두되, 상자 안 내용물은 "뒤에 있는 스킬을 그대로 실행하라"는 한 줄 지시만 두는 것. 간판은 상자에서 읽고, 실제 일은 여전히 폴더 안 스킬이 맡는다.

## 공식 문서 교차검증 (Phase 0)

`claude-code-guide` subagent로 `code.claude.com/docs/en/skills` 조회:

> "if a skill and a command share the same name, the skill takes precedence"

즉 동일 이름 skill이 **실행** precedence를 가져간다. 따라서 command wrapper를 추가해도 실행은 기존 skill이 그대로 담당하고, wrapper는 UI에 chip을 노출하는 역할만 수행.

## 작업 내용

### Phase 1 — 파일럿 (lk-persona 단건)

- `leeloo-kit/commands/lk-persona.md` 생성
- marketplaces + cache 경로에도 수동 반영
- `/reload-plugins` 후 `/lk-persona` 입력 시 chip 복원 실측 확인

### Phase 2 — 자동 생성 스크립트 + 일괄 적용

`leeloo-kit/scripts/generate-commands.js` 신규:

- 모든 `*/skills/*/SKILL.md` frontmatter 파싱 (순정 Node, 의존성 없음)
- `user_invocable: true`인 스킬 대상으로 `*/commands/<name>.md` 생성
- `--check` 모드: drift 감지(파일 누락/불일치 시 exit 1) — 향후 hook/CI 연결 가능

생성 결과 **32개 wrapper**:

| 플러그인 | 파일 수 |
|---|---|
| leeloo-kit | 3 |
| leeloo-workflow | 4 |
| leeloo-git | 2 |
| leeloo-agent | 2 |
| leeloo-doc | 5 |
| leeloo-bitbucket | 5 |
| leeloo-n8n | 8 |
| leeloo-its | 3 |

wrapper 템플릿:

```markdown
---
description: "<SKILL.md description 그대로>"
argument-hint: "<SKILL.md argument-hint 그대로>"
---
`<skill-name>` 스킬을 실행합니다. 사용자 입력: $ARGUMENTS

서브커맨드 파싱과 대화형 흐름을 포함한 동작 정의는 대응 SKILL.md(`<skill-name>`)를 기준으로 합니다.
```

### Phase 2.5 — cache 동기화 (현재 세션 반영)

첫 번째 스케일링 시도에선 marketplaces만 반영해 `lk-persona`만 chip이 뜨는 문제 발생. 원인은 파일럿 당시 `~/.claude/plugins/cache/leeloo-claude-setup/leeloo-kit/3.5.0/` 디렉토리를 수동 생성·복사했기 때문이었음.

6개 설치된 플러그인의 cache 최신 버전 디렉토리에 일괄 복사:

- leeloo-kit/3.5.0, leeloo-workflow/1.0.2, leeloo-git/1.1.0
- leeloo-agent/1.0.2, leeloo-doc/1.2.1, leeloo-its/1.0.2

leeloo-bitbucket / leeloo-n8n은 이 환경에 미설치 상태라 이번 cache 반영 대상에서 제외 (repo + marketplaces에는 정상 반영됨).

## 결과

- 레포: 32개 wrapper + generate-commands.js 신규
- marketplaces: 32개 전부 반영
- cache: 설치된 6개 플러그인 × 각 최신 버전에 반영 (총 19개 파일)
- `/reload-plugins` 후 chip 정상 노출 확인 (파일럿 `lk-persona`; 나머지 31개는 cache 동기화 후 예상)

## 후속 작업 (다음 커밋 범위)

- `marketplace.json` 각 플러그인 patch bump — 사용자 `/plugin update` 실행 시 cache 재생성 루트 확보
- cache 버전이 이미 marketplace보다 앞선 일부 플러그인(workflow/agent/doc/its)은 marketplace 버전을 cache+1로 맞추는 재정렬 필요
- generate-commands.js에 `--sync` 옵션 추가 고려 — repo → marketplaces/cache 자동 동기화를 스크립트화
