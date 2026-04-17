# 플러그인 버전 동기화 + leeloo-kit 배너 하드코딩 제거

## 지시 요약

- 사용자: "leeloo-kit 버전이 업데이트가 안됐는데?"
- 확인 결과: 직전 커밋 `d4c2173`에서 `plugin.json` / `marketplace.json`의 버전 필드만 3.2.0으로 범프됐고, 다음 5곳은 구 버전(v3.1.0)으로 남아있었음:
  1. `CLAUDE.md` — leeloo-kit 섹션 헤더
  2. `leeloo-kit/CLAUDE.md` — Testing 섹션 기대 출력
  3. `README.md` — 플러그인 목록 테이블
  4. `leeloo-kit/leeloo.config.json` — 최상위 `version` 필드
  5. `leeloo-kit/scripts/session-start.js` — SessionStart 배너 문자열 2곳
- 사용자 후속 지시: "모두 업데이트하고 하드코딩은 안해야하지 않겠냐?" → 문서 갱신 + 런타임 하드코딩 제거를 동시에 요구.

## 작업 내용

### 1. 하드코딩 제거 (3곳)

**`leeloo-kit/scripts/session-start.js`**
- `getPluginVersion()` 헬퍼 추가: `CLAUDE_PLUGIN_ROOT/plugin.json`을 `fs.readFileSync`로 읽어 `version`을 반환. 실패 시 빈 문자열.
- `CLAUDE_PLUGIN_ROOT`가 없을 때는 `path.resolve(__dirname, '..')`로 폴백 (로컬 개발/테스트용).
- `main()` 말미의 출력부에서 하드코딩된 `'leeloo-kit v3.1.0'` 두 줄을 `banner = version ? `leeloo-kit v${version}` : 'leeloo-kit'`로 대체.

**`leeloo-kit/leeloo.config.json`**
- 최상위 `"version": "3.1.0"` 필드 삭제. 전체 코드베이스에서 이 필드를 읽는 곳이 한 군데도 없음(grep으로 `config.version` / `cfg.version` / `_config.version` 0건 확인) → 데드 데이터.

**`leeloo-kit/scripts/lib/config.js`**
- 설정 파일 누락 시 반환되는 fallback 객체에서 `version: '3.0.0'` 라인 제거. 위와 동일 이유.

### 2. 문서 동기화 (6곳)

| 파일 | 변경 |
|------|------|
| `CLAUDE.md` | 플러그인 목록 8개 헤더 버전 — leeloo-kit v3.2.0, 나머지 7개 v1.0.1 / leeloo-doc v1.1.1 |
| `README.md` | 플러그인 목록 테이블 동일 갱신 (버전 컬럼 8행) |
| `leeloo-kit/CLAUDE.md` | Testing 섹션: `v3.1.0` → `v{plugin.json version}` 표기로 변경하고 "하드코딩 아님 — plugin.json에서 동적 로드" 주석 추가 |
| `leeloo-its/CLAUDE.md` | Architecture 섹션 plugin.json 버전 — 1.0.0 → 1.0.1 |
| `leeloo-doc/CLAUDE.md` | Architecture 섹션 plugin.json 버전 — 1.1.0 → 1.1.1 |

### 3. 검증

```bash
# 동적 로드 확인
CLAUDE_PLUGIN_ROOT=./leeloo-kit node -e "..."
# → version: 3.2.0

# config.js에 version 키 없는지 확인
node -e "const {loadConfig}=require('./leeloo-kit/scripts/lib/config'); ..."
# → keys: harness,crossValidation,statePaths
# → hasVersion: false
```

## 결과

- 총 8개 파일 수정 (3개 코드 + 5개 문서).
- plugin.json을 **단일 진실 공급원**(Single Source of Truth)으로 확립. 다음 버전 범프 시 `plugin.json` / `marketplace.json`만 수정하면 SessionStart 배너가 자동으로 따라옴.
- 문서 표기는 여전히 수동 갱신이 필요하지만, 동기화가 빠졌을 때 눈에 띄는 배너/CLI 출력은 더 이상 실패하지 않음.

## 핵심 코드 스니펫

### 동적 버전 로드 (`session-start.js`)

```javascript
function getPluginVersion() {
  try {
    const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
    const pkg = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'plugin.json'), 'utf8'));
    return pkg.version || '';
  } catch (e) {
    return '';
  }
}

// 출력부
const version = getPluginVersion();
const banner = version ? `leeloo-kit v${version}` : 'leeloo-kit';
```

## 현실 비유

**"가격표 한 장만 붙이는 가게"**

편의점에서 상품 가격이 오르면, 보통은 POS 시스템의 가격을 바꾸고 매대 가격표도 손으로 바꿔야 한다. 매대 가격표를 깜박하면 계산대에서만 새 가격이 나와 손님이 혼란스러워한다 — 이번 `d4c2173` 커밋이 딱 그 상황이었다. `plugin.json`(POS)은 3.2.0으로 갱신했는데, 배너·README·CLAUDE.md(매대 가격표)는 3.1.0으로 남아있었다.

이번 수정은 두 가지를 동시에 했다:
1. **매대 가격표 전체 교체** — 남은 문서들을 수동으로 3.2.0/1.0.1/1.1.1로 갱신.
2. **전광판 연동** — SessionStart 배너를 "가격 표시 전광판"으로 바꿔, POS가 바뀌면 전광판도 자동으로 따라 바뀌게 만들었다(`getPluginVersion()`). 다음부턴 손으로 바꿀 일이 없다.

매대 종이 가격표는 여전히 손으로 바꿔야 하지만(마크다운 테이블은 코드 실행 시점이 없음), 적어도 손님 눈에 띄는 전광판은 이제 자동이다.
