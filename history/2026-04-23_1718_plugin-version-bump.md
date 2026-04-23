# 플러그인 버전 업 — leeloo-kit 3.5.0 + leeloo-git 1.1.0 + 6개 patch

## 지시 요약

사용자 지적: 직전 커밋(`233e263` 세션 토큰 최적화)에서 변경 범위가 컸음에도 plugin.json 버전이 그대로였음. 각 플러그인의 변경 성격에 맞춰 SemVer 버전을 올리고 marketplace.json도 동기화할 것.

또한 이번 push는 **모든 리모트(origin=Bitbucket + github)** 에 반영.

## 작업 내용

### 버전 증분 결정 기준

각 플러그인의 직전 커밋 내 변경 성격을 SemVer로 매핑:

| 플러그인 | 현재 → 신규 | 증분 유형 | 근거 |
|---|---|---|---|
| **leeloo-kit** | 3.4.0 → **3.5.0** | minor | `lk-setup plugins` 서브커맨드 확장(list/toggle/audit/mcp-list/mcp-toggle 5종 신규), `resources/context-checkpoint.md`·`model-delegation.md` 분리, hook 출력 동작 변경 |
| **leeloo-git** | 1.0.1 → **1.1.0** | minor | `lk-commit` Step 11 UX 변경 (AskUserQuestion → 텍스트 안내) |
| leeloo-doc | 1.2.0 → **1.2.1** | patch | SKILL.md description 압축만 |
| leeloo-agent | 1.0.1 → **1.0.2** | patch | 동상 |
| leeloo-bitbucket | 1.0.1 → **1.0.2** | patch | 동상 |
| leeloo-its | 1.0.1 → **1.0.2** | patch | 동상 |
| leeloo-n8n | 1.0.1 → **1.0.2** | patch | 동상 |
| leeloo-workflow | 1.0.1 → **1.0.2** | patch | 동상 |

### 규칙

- **minor**: 사용자 대면 기능 추가 또는 UX 동작 변화(호환성 유지)
- **patch**: 문구 정리·내부 문서 압축 등 동작 변화 없는 수정

**비유**: 자동차 연식 표기와 같다. 엔진 오일 주기 문서만 고쳤으면(patch) 같은 연식을 유지하지만, 대시보드에 새 기능을 추가했으면(minor) 연식을 올린다. 완전히 다른 차가 됐으면(major) 새 모델명이 필요하다.

### marketplace.json 동기화

`.claude-plugin/marketplace.json`의 `plugins` 배열 각 엔트리 `version` 필드도 동일하게 갱신. 이 파일은 마켓플레이스가 읽어가는 단일 소스이므로 플러그인 개별 `plugin.json`과 **반드시 일치**해야 한다.

## 결과

- 변경 파일: `*/plugin.json` 8개 + `.claude-plugin/marketplace.json` + `HISTORY.md` + `history/...`
- 푸시 대상: **origin** (Bitbucket), **github** (GitHub) — 두 리모트 모두

## 확인 방법

```bash
# 각 플러그인 버전 확인
for f in */plugin.json; do grep -E '"(name|version)"' "$f"; done

# marketplace.json 버전 일치 확인
grep -E '"(name|version)"' .claude-plugin/marketplace.json

# 두 리모트 동기화 확인
git log --oneline origin/main..HEAD   # origin 기준 미푸시
git log --oneline github/main..HEAD   # github 기준 미푸시
```
