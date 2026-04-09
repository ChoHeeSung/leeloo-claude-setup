---
name: lk-skill-create
description: "Git 히스토리 + 프로젝트 구조 분석으로 SKILL.md 자동 생성. 팀 패턴을 스킬로 변환."
user_invocable: true
argument-hint: "<skill-name> [--quick]"
---

# /lk-skill-create — Skill 자동 생성기

Git 히스토리와 프로젝트 구조를 분석하여 팀의 반복 패턴을 Claude Code 스킬(SKILL.md)로 자동 생성합니다.

## 서브커맨드

```
/lk-skill-create <skill-name>           — 전체 프로세스 (분석 + 질문 + 생성)
/lk-skill-create <skill-name> --quick   — 질문 건너뛰고 자동 생성
```

## 출력 파일

- `skills/{skill-name}/SKILL.md`

## Procedure

### 인자 파싱

사용자 입력에서 다음을 파싱합니다:
- `<skill-name>`: 생성할 스킬 이름 (필수, lowercase-hyphenated)
- `--quick`: 빠른 모드 플래그 (선택)

skill-name 인자가 없으면:
```
사용법: /lk-skill-create <skill-name> [--quick]
예: /lk-skill-create code-review-java
예: /lk-skill-create deploy-checklist --quick
```
출력 후 중단.

---

### Phase 1: 프로젝트 분석

1. **Git 히스토리 분석**: `git log --oneline -50` 실행하여 최근 커밋 패턴 파악.
2. **파일 구조 확인**: Glob으로 `**/*.{ts,js,py,java,go,rs,erl,ex}` 패턴 검색, 주요 언어/프레임워크 파악.
3. **기존 스킬 확인**: Glob으로 `skills/*/SKILL.md` 검색, 중복 방지.

분석 결과 요약:
```
## 프로젝트 분석 완료

- 주요 언어: {감지된 언어}
- 커밋 패턴: {주요 패턴 3개}
- 기존 스킬: {목록}
- 감지된 반복 작업: {패턴}
```

---

### Phase 2: 스킬 정의 (대화형, `--quick` 시 건너뜀)

AskUserQuestion으로 순차 질문:

1. **스킬 목적**: "이 스킬이 해결할 문제는 무엇인가요?"
2. **트리거 조건**: "어떤 상황에서 이 스킬이 활성화되어야 하나요? (예: PR 생성 시, 특정 파일 수정 시)"
3. **출력 형식**: "스킬의 출력은 어떤 형식이어야 하나요? (코드 수정 / 문서 생성 / 검증 리포트 / 대화형 가이드)"

---

### Phase 3: SKILL.md 생성

Read로 기존 SKILL.md 하나를 참조하여 구조를 파악한 후, 다음 구조로 생성:

```markdown
---
name: {skill-name}
description: "{한 줄 설명}"
user_invocable: true
argument-hint: "{인자 힌트}"
---

# /{skill-name} — {제목}

{스킬 설명 1~2문장}

## 사용법

\`\`\`
/{skill-name} {인자}
\`\`\`

## 활성화 조건

- {트리거 조건 1}
- {트리거 조건 2}

## Procedure

### Phase 1: {단계명}
{상세 절차}

### Phase 2: {단계명}
{상세 절차}

## Anti-Patterns

- {하지 말아야 할 것 1}
- {하지 말아야 할 것 2}
```

---

### Phase 4: 저장 및 안내

1. `mkdir -p skills/{skill-name}/`
2. Write → `skills/{skill-name}/SKILL.md`

완료 안내:
```
스킬 생성 완료

파일: skills/{skill-name}/SKILL.md

다음 단계:
- plugin.json의 skills 목록에 추가 필요 시 수동 등록
- /lk-code-review skills/{skill-name}/SKILL.md — 스킬 품질 리뷰
```
