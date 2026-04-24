# refactor(leeloo-kit): lint 플래그 호환성 + Go linter 업데이트 (v3.5.9)

## 지시 요약

사용자가 smart-commit 레포(`@blum84/smart-commit@0.9.0`)에서 lint 훅 실패를 보고했다. 사용자의 `package.json`에 정의한 `npm run lint` 스크립트가 tsc 등 다양한 도구를 사용 중인데, leeloo-kit의 Stop 훅이 강제로 `--quiet` 플래그를 주입해서 호환성 오류가 발생한 것. golangci-lint v2 문서를 Context7로 교차검증한 결과 `--fast` 플래그도 v2에서 제거됐으므로 함께 수정했다.

## 작업 내용

### 1. npm run lint 매개변수 강제 주입 제거
**파일**: `leeloo-kit/scripts/stop-quality-check.js` (41번 줄)

**변경 전**:
```javascript
args: ['run', 'lint', '--', '--quiet']
```

**변경 후**:
```javascript
args: ['run', 'lint']
```

**이유**: Stop 훅이 `--quiet` 플래그를 강제로 주입하면, 사용자가 정의한 `"lint": "tsc --noEmit"` 같은 스크립트에 추가 인자가 전달된다. tsc는 `--quiet` 옵션을 지원하지 않으므로 `error TS5023: Unknown compiler option '--quiet'.` 오류가 발생한다. 사용자 정의 스크립트의 옵션 호환성을 존중하기 위해 강제 주입을 제거했다.

### 2. golangci-lint --fast → --fast-only 업그레이드
**파일**: `leeloo-kit/scripts/stop-quality-check.js` (114번 줄)

**변경 전**:
```javascript
args: ['run', '--fast']
```

**변경 후**:
```javascript
args: ['run', '--fast-only']
```

**이유**: golangci-lint v2 공식 문서(VSCode 통합 가이드)에서 `--fast` 플래그가 제거되고 `--fast-only`로 변경됐다. Context7을 통해 최신 호환성을 확인했고, 이미 v2를 사용 중인 사용자 환경에서 명령 실패를 피하기 위해 업그레이드했다.

### 3. 버전 업데이트
**파일**: `marketplace.json` (12번 줄)

```json
"version": "3.5.9"
```

leeloo-kit 버전을 3.5.8에서 3.5.9로 업데이트했다.

## 결과

- **npm run lint 호환성**: 사용자가 정의한 모든 lint 스크립트(tsc, biome, ruff, mypy, cargo, mvn, gradle, mix, rebar3 등)가 추가 플래그 충돌 없이 실행된다.
- **golangci-lint v2 대응**: 최신 Go 환경(VSCode 통합 기준)에서 `--fast-only` 플래그로 정상 작동한다.
- **마켓플레이스 일관성**: 모든 플러그인 메타데이터가 v3.5.9로 동기화됐다.

## 핵심 코드 스니펫

### stop-quality-check.js (41번 줄 근처)
```javascript
// Before
const lintCommand = {
  name: 'lint',
  args: ['run', 'lint', '--', '--quiet']
};

// After
const lintCommand = {
  name: 'lint',
  args: ['run', 'lint']
};
```

### stop-quality-check.js (114번 줄 근처)
```javascript
// Before
const goCommand = {
  name: 'golangci-lint',
  args: ['run', '--fast']
};

// After
const goCommand = {
  name: 'golangci-lint',
  args: ['run', '--fast-only']
};
```

## 현실 비유

**Stop 훅의 강제 옵션 주입은 식당에서 손님 요청서를 무시하고 임의로 조미료를 더하는 것과 같다.**

손님이 "저는 tsc로만 타입 체크를 하고 싶어요"라고 요청서를 줬는데, 주방장(Stop 훅)이 "내가 정한 것이니 소금(--quiet)을 추가해서 만들겠다"고 일방적으로 추가한다. 그 결과 손님의 요리(tsc)는 망가진다(TS5023 에러). 

마찬가지로 golangci-lint도 옛 레시피(--fast)를 고집했는데 새 요리사(v2)는 더 이상 그 레시피를 모른다(제거됨). 그래서 최신 레시피(--fast-only)로 업데이트해야 한다.

**수정의 철학**: 사용자가 정의한 빌드 프로세스를 존중하되, 도구의 최신 호환성은 우리 책임이다.
