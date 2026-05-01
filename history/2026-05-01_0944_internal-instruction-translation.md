# 내부 지침 영문 변환 — 토큰 ~85% 절감, description 트리거 보강

**날짜**: 2026-05-01 09:44 KST
**커밋**: refactor: 내부 지침 영문 변환 — 토큰 ~85% 절감, description 트리거 보강
**변경 파일**: 54개 (+3,325 / -3,216)

## 지시 요약

> "이 프로젝트에 작성된 지침들을 모두 영문으로 작성해줘. 사용자에게 노출되는 부분은(스킬 설명이라던지) 한국어로 유지하고. 내가 이 작업을 하는 이유는 한국어 지침이 훨씬 더 많은 토큰을 소모하기 때문이야."

추가 요구:
- 스킬에서 생성된 산출물 문서는 한국어 유지
- 실패 메모리 기존 기록과 docs/는 손대지 않음
- 내 프로젝트에서 만든 스킬 및 지침만 적용

## 작업 절차 (3 Phase)

### Phase 1 — 본문 영문 변환 (53개 파일)

| 카테고리 | 파일 수 | 처리 방식 |
|---|---:|---|
| `CLAUDE.md` (루트 + 8 플러그인 + leeloo-kit/resources/CLAUDE.md) | 9 | 메인이 루트 1개 샘플 → 서브에이전트 A가 나머지 |
| `SKILL.md` 본문 | 34 | 서브에이전트 B(16) + C(18) 병렬 |
| `agents/code-analyzer.md` | 1 | 서브에이전트 A |
| `output-styles/*.md` | 4 | 서브에이전트 A (단, harness-claude-expert는 sandbox 권한 거부 → 메인이 처리) |
| `resources/*.md` | 6 | 서브에이전트 A |

**3개 서브에이전트 병렬 실행** — 메인 컨텍스트 보호. 각 에이전트는 동일 가이드라인(용어집·frontmatter 보존·코드블록 보호) + 담당 파일 목록을 받아 자체 컨텍스트에서 Read → 영문 번역 → Write로 일괄 처리.

### Phase 2 — frontmatter description 트리거 키워드 보강 (34개)

description은 **사용자 노출 + LLM의 skill auto-trigger 핵심 시그널** 양쪽 역할. 단순 명사구 1줄(`"Bitbucket PR 관리(목록/조회/생성/머지/댓글)"`)을 멀티라인 블록으로 확장:

```yaml
description: |
  Bitbucket Pull Request 관리(목록·조회·생성·머지·댓글).
  PR, 풀리퀘스트, 풀리퀘, 머지, 코드리뷰, 풀리퀘 올려, pull request, merge, code review, bitbucket
```

1줄: 자연어 동사형 핵심 설명. 2줄: 한국어 트리거 키워드 → 영문 트리거 키워드. 자동 트리거 정확도 + 한·영 query 양방향 매칭 확보.

### Phase 3 — C5 정밀 영문화 (옵션 C)

검증 단계에서 한글 잔존 1,192줄 중 **Claude/sub-agent 내부 지침 본문(C5)**이 ~250줄 영문화 가능으로 식별. 가장 안전한 2개 파일만 정밀 처리:

- `lk-commit/SKILL.md`: Haiku에게 보내는 Conventional Commits 표준 본문(구조·type·subject/body 규칙·피해야 할 메시지) 영문화. **한국어 출력 정책(`Write in Korean`, 한국어 커밋 예시)은 보존**.
- `lk-code-review/SKILL.md`: Sonnet/Gemini sub-agent 프롬프트의 리뷰 기준 골격 영문화. **페르소나 정체성(`당신은 시니어 코드 리뷰어입니다`) + 출력 표 헤더(`코드 품질`, `발견 사항`, `권장 조치`)는 한국어 보존** + `**한국어로 응답하세요**` 강제 라인 추가.

## 결과

| 지표 | 수치 |
|---|---:|
| 변경 파일 | 54개 |
| 한글 잔존 | 1,192 → 1,137줄 (모두 의도적 — 사용자 출력·도메인 명사·페르소나 정체성·frontmatter description) |
| 변환 대상 한국어 본문 | 약 23,000자 |
| 추정 토큰 절감 | ~38K tokens (약 85%) |
| Always-on 절감 (CLAUDE.md, 매 turn) | ~10K tokens/turn |
| Cache hit 시 100-turn 절감 | Sonnet ~$0.30 / Opus ~$1.5 |

## 출력 언어 다중 안전망

영문 지침이 사용자 응답 언어로 새지 않도록 3중 보호:

1. **모든 SKILL.md 상단 hint** (frontmatter 직후 1줄):
   ```
   > Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.
   ```
2. **페르소나 시스템 프롬프트 내** `**한국어로 응답하세요**` 강제
3. **출력 표/결과 템플릿 헤더 한국어 보존** — sub-agent가 그대로 채우면 한국어 출력 자동 보장

## 현실 비유 (개념 정리)

- **토큰 절감 (한→영)**: 한국어로 쓴 두꺼운 매뉴얼을 영문 요약본으로 갈음한 격. 책장은 가벼워지고 도서관 책상(prompt cache prefix)에 항상 펼쳐 두기 좋아짐.
- **frontmatter description 한·영 키워드 혼합**: 가게 간판에 한국어·영어 둘 다 써 두는 것. "PR 올려줘"라고 묻는 손님과 "open a PR"이라고 묻는 손님 모두 같은 가게로 들어오게 함.
- **C5 정밀 영문화 (페르소나·출력 헤더는 한국어)**: 식당의 **주방 지시문은 영문**으로(요리사 효율↑), 손님 테이블에 나가는 **그릇 라벨은 한국어**로(손님 응대 일관성). 주방 운영 비용은 줄지만 손님 경험은 그대로.
- **Cache prefix 안정화**: 매일 도서관에 출근할 때마다 사전을 새로 들고 가는 대신, 책상에 항상 비치된 사전을 쓰는 것. CLAUDE.md를 영문으로 한 번 바꾸면 그날 한 번만 새로 펼치고, 이후 모든 세션에서 같은 사전을 그대로 사용.

## 핵심 코드 변경 스니펫

**SKILL.md 상단 Output Language Policy 강제 주입** (34개 파일 공통):

```markdown
---
name: lk-bb-pr
description: |
  Bitbucket Pull Request 관리(목록·조회·생성·머지·댓글).
  PR, 풀리퀘스트, 풀리퀘, 머지, 코드리뷰, 풀리퀘 올려, pull request, merge, code review, bitbucket
user_invocable: true
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

(English instruction body...)
```

**lk-code-review의 sub-agent 프롬프트 영문화 + 한국어 보호** 예:

```
당신은 시니어 코드 리뷰어입니다. 다음 코드를 리뷰하세요. **한국어로 응답하세요.**

## Review criteria

### Code quality
- Logical correctness, edge cases
- Naming, structure, readability
...

## Output format (Korean — keep these headers verbatim)
### Score Card
| 항목 | 점수 (1-10) | 근거 요약 |
|------|-----------|----------|
| 코드 품질 | X | ... |
...
```

## 검증

| 항목 | 결과 |
|---|---|
| frontmatter `name`/`description` 한국어 보존 | ✓ 모두 보존 |
| Output Language Policy 1줄 주입 | ✓ 34/34 SKILL.md |
| 페르소나·출력 표 헤더 한국어 보존 | ✓ |
| Gemini review prompt 한국어 응답 강제 명시 | ✓ "Follow the format below exactly, written in Korean" |
| 코드블록 fence 짝수 (구조 무결성) | ✓ |
| 잔존 한글 카테고리 분류 | ✓ 모두 정책 부합 (사용자 노출·도메인 명사·페르소나 정체성) |

## 다음 액션 (실사용 검증)

- 다음 세션 첫 turn에 cache miss 1회 발생 (~$0.04, Sonnet 기준) — CLAUDE.md prefix 변경 효과
- lk-coding-guard 톤 점검 — 강한 명령("절대 금지", "즉시 분해")이 영문에서도 게이트 효력 유지하는지 1~2회 실사용 검증
- skill auto-trigger 정확도 — 한국어 자연어 query("PR 올려줘", "도면 뽑아줘", "리뷰해줘")가 보강된 description으로 정상 매칭되는지 확인
