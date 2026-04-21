# lk-persona 스킬 추가 — 세션 페르소나 대화형 관리

## 지시 요약
사용자 요청: "프로젝트 로컬 세션 페르소나를 대화형으로 생성하고 즉시 세션에 적용되는 스킬을 만들어서 leeloo-kit에 추가하고 싶다. 프로젝트별로 격리되어야 하고, 다음 세션에도 자동 로드되어야 한다."

## 배경 — 왜 필요했나
Claude Code의 Output Styles 기능은 공식으로 지원되지만 `/config` 메뉴를 통해서만 전환 가능하고, 세션별 페르소나 스위칭 UX가 번거롭다. 또한 대화형 생성 UI가 없어서 매번 마크다운 파일을 직접 작성해야 한다. 프로젝트 로컬 페르소나를 슬래시 커맨드로 만들고 관리하는 스킬이 필요했다.

## 핵심 설계 결정

### 1. Output Style 체계 위에 구축
- `.claude/output-styles/<name>.md` (프로젝트 로컬 자동 인식)
- `.claude/settings.local.json`의 `outputStyle` 필드로 활성 페르소나 기록
- 글로벌 `~/.claude/`는 건드리지 않음 — 프로젝트 격리 보장

### 2. 하이브리드 적용 메커니즘
Claude Code는 시스템 프롬프트를 세션 시작 시에만 로드하므로, 세션 중 settings.json만 수정해서는 즉시 반영 불가. 두 가지를 병용:
- **현재 세션**: 스킬 실행 결과로 페르소나 본문을 메인 세션 컨텍스트에 주입 (최신 지시라 강하게 따름)
- **다음 세션**: settings.local.json의 outputStyle이 정식 Output Style로 자동 로드 (시스템 프롬프트 레벨)

### 3. 대화형 생성 3종 모드
- **빠른 모드 (기본)**: 이름·정체성·말투 3개만 입력 → Claude가 본문 자동 확장
- **상세 모드 (--detail)**: 7개 항목 모두 입력 (전문성·톤/스타일·제약·초점·선호도·컨텍스트·예시)
- **프리셋 모드 (--preset)**: 내장 프리셋(senior-dev / brief-pm / teacher / reviewer / designer) 5종

### 4. 현실 비유
Output Styles 체계는 "배우 대본"과 같다. `.claude/output-styles/`는 "대본 보관소", `settings.local.json`의 outputStyle은 "오늘 상연할 대본 지정", 세션 시작은 "배우(Claude)가 대본을 읽고 무대에 오르는 시점". 

lk-persona 스킬은 "대본 작가 + 무대감독" 역할을 한다:
- **대본 작가**: 사용자의 요구를 바탕으로 대본 초안을 쓴다. 빠른 모드에서는 사용자가 3개 핵심 요소(제목, 정체성, 말투)만 제공하면, Claude가 나머지 전문성·톤·제약·초점·선호도·컨텍스트·예시를 자동으로 확장하여 풍부한 대본으로 완성한다.
- **무대감독**: 쓴 대본을 보관소에 보관하고, 현재 배우(Claude)에게 "지금부터 이 대본처럼 연기하세요"라고 속삭인다(컨텍스트 주입). 
- **극장 관리**: 다음 공연(세션)부터는 대본이 정식으로 채택되어 무대 시작 전(시스템 프롬프트 로드 시점)부터 적용된다.

## 구현 내역

### 신규 파일
- `leeloo-kit/skills/lk-persona/SKILL.md` — 470+ 줄, 7개 서브커맨드 절차 + 프리셋 5종 정의

### 서브커맨드
| 커맨드 | 동작 |
|--------|------|
| `create` | 대화형 생성 (빠른/상세/프리셋 모드) + 즉시 주입 |
| `use <name>` | 기존 페르소나로 전환 + 즉시 주입 |
| `list` | 목록 + 활성 표시 |
| `show <name>` | 내용 출력 |
| `current` | 활성 페르소나 확인 |
| `delete <name>` | 삭제 (활성이면 해제) |
| `clear` | 활성 해제 (파일 유지) |

### 프리셋 5종
| 이름 | 용도 |
|------|------|
| `senior-dev` | 시니어 개발자 멘토 (코드 리뷰, 아키텍처 컨설팅) |
| `brief-pm` | 간결한 PM (요구사항·계획 수립, 실행 통제) |
| `teacher` | 교사 (상세 설명, 단계별 학습) |
| `reviewer` | 비평가 (비판적 분석, 개선점 지적) |
| `designer` | 디자이너 (UX/미학 중심, 창의성 강조) |

### 버전 변경
- leeloo-kit: v3.2.0 → **v3.3.0**
- plugin.json + marketplace.json 동기화

### 변경 파일 요약
- `leeloo-kit/skills/lk-persona/SKILL.md` (신규, ~470줄)
- `leeloo-kit/plugin.json` (v3.2.0 → v3.3.0)
- `leeloo-kit/CLAUDE.md` (skills 목록 2 → 3)
- `CLAUDE.md` (루트, leeloo-kit 섹션 갱신)
- `.claude-plugin/marketplace.json` (leeloo-kit 버전 동기화)

## 결과
- 사용자는 `/lk-persona create --preset senior-dev` 한 번으로 시니어 개발자 멘토 페르소나를 즉시 적용 가능
- 빠른 모드에서는 이름·정체성·말투 3개 입력만으로 풍부한 페르소나 생성
- 프로젝트별 페르소나 격리 → 레포 간 충돌 없음
- 다음 세션 재시작 시 Output Style로 자동 로드되어 시스템 프롬프트 레벨 적용

## 제약 (문서화됨)
Claude Code 구조상 시스템 프롬프트 완전 치환은 세션 시작 시에만 가능. 현재 세션에서는 컨텍스트 주입 수준으로 적용되며, 완전 치환이 필요하면 세션 재시작 필요. SKILL.md에 "재시작 없이 적용되는 범위" 섹션으로 명시.

## 관련 파일
- `leeloo-kit/skills/lk-persona/SKILL.md` (신규)
- `leeloo-kit/plugin.json` (v3.3.0)
- `leeloo-kit/CLAUDE.md` (skills 목록)
- `CLAUDE.md` (루트, leeloo-kit 섹션)
- `.claude-plugin/marketplace.json` (버전 동기화)
