# 2026-03-30 — leeloo-util 확장 및 HWP 스킬 추가

## 플러그인 리네이밍: leeloo-its-util → leeloo-util

**지시 요약**: `leeloo-its-util` 플러그인을 범용 유틸리티 플러그인 `leeloo-util`로 리네이밍. HWP 스킬 추가를 위한 구조 확장.

**작업 내용**:
- `git mv leeloo-its-util leeloo-util` — 디렉토리 이동 (git 히스토리 보존)
- `leeloo-util/plugin.json` — name, description 업데이트
- `.claude-plugin/marketplace.json` — leeloo-its-util 항목을 leeloo-util로 변경, category: "utility"
- `leeloo-util/CLAUDE.md` — 범용 유틸리티로 설명 확장, lk-hwp- 스킬 목록 추가
- 루트 `CLAUDE.md` — 트리/Plugins/네임스페이스 섹션 갱신
- `README.md` — 플러그인 테이블, enabledPlugins 경로, 섹션명, 구조 트리, 설계 원칙 갱신

**결과**:
- 기존 `lk-iu-pdf-extract` 스킬 파일은 그대로 유지 (이동만)
- `lk-hwp-setup`, `lk-hwp-parse`, `lk-hwp-compare` 스킬은 목록에만 추가 (파일은 skill-writer가 담당)
- 현실 비유: leeloo-its-util이 "ITS 전담 창구"였다면, leeloo-util은 ITS + HWP 등 다양한 업무를 처리하는 "종합 민원 창구"로 확장된 것.

---

## kordoc 레포지토리 분석 (조사만, 코드 작성 없음)

**지시 요약**: `https://github.com/chrisryugj/kordoc.git` 레포를 `/tmp/kordoc`에 클론하여 구조, MCP 도구, API, 의존성, 설치/실행 방식을 조사.

**작업 내용**:
- 레포 클론 및 디렉토리 구조 파악
- README.md, package.json, tsconfig.json, tsup.config.ts 읽기
- `src/mcp.ts` 전체 분석 -- 7개 MCP 도구의 이름, 설명, 파라미터, 동작 확인
- `src/types.ts` 분석 -- IRBlock, ParseResult 등 핵심 타입 구조 파악
- CLAUDE.md 분석 -- 아키텍처 설계 결정 확인

**결과**:
- **정체**: 한국 공문서(HWP 5.x, HWPX, PDF) -> 마크다운 변환 라이브러리 (v1.6.1, MIT)
- **인터페이스 3종**: 라이브러리 API, CLI(`kordoc`), MCP 서버(`kordoc-mcp`)
- **MCP 도구 7개**: parse_document, detect_format, parse_metadata, parse_pages, parse_table, compare_documents, parse_form
- **외부 API 호출 없음**: 로컬 파일 파싱 전용. 인증/환경변수 불필요
- **파이프라인**: Buffer -> detectFormat(매직바이트) -> 포맷별 파서 -> IRBlock[] -> blocksToMarkdown() -> Markdown
- **현실 비유**: kordoc는 "만능 번역기"와 같음. HWP/HWPX/PDF라는 서로 다른 "외국어"를 IRBlock이라는 "공용어"로 먼저 번역하고, 그 공용어를 마크다운이라는 "최종 언어"로 변환.
- **핵심 의존성**: @modelcontextprotocol/sdk, @xmldom/xmldom, cfb, jszip, zod, commander. PDF는 pdfjs-dist(선택)

---

## leeloo-util 스킬 작성: lk-hwp-setup, lk-hwp-parse, lk-hwp-compare

**지시 요약**: CLI/Node.js API 조사 결과를 바탕으로 leeloo-hwp HWP 파서 스킬 3개 작성.

**작업 내용**:
- `leeloo-util/skills/lk-hwp-setup/SKILL.md` — 설치 상태 확인 및 npm 글로벌 설치
- `leeloo-util/skills/lk-hwp-parse/SKILL.md` — doc/metadata/pages/table/form/detect 6개 서브커맨드
- `leeloo-util/skills/lk-hwp-compare/SKILL.md` — 두 문서 비교, compare API Node.js 인라인 호출

**핵심 설계**:
```bash
# CLI로 처리 가능한 경우 (doc, pages)
leeloo-hwp "$FILE"
leeloo-hwp "$FILE" --pages "$RANGE"

# Node.js API 필요한 경우 (metadata, table, form, detect, compare)
PKG_PATH=$(npm root -g)/leeloo-hwp
[ -d "$PKG_PATH" ] || PKG_PATH=$(npm root -g)/kordoc  # 패키지명 fallback
node -e "const {parse}=require('$PKG_PATH'); ..."
```

**주의사항**: 설치 후 패키지명이 `leeloo-hwp` 또는 `kordoc`일 수 있어 fallback 로직 포함.

**결과**: 3개 스킬 파일 생성 완료. /lk-hwp-setup → /lk-hwp-parse → /lk-hwp-compare 순서로 사용 가능.

---

## HISTORY.md 구조 개편

**지시 요약**: 단일 HISTORY.md 파일을 날짜별 분리 파일로 쪼개고, HISTORY.md를 인덱스 테이블로 교체.

**작업 내용**:
- `history/` 디렉토리 생성
- 기존 날짜별 섹션을 개별 md 파일로 분리
- HISTORY.md를 인덱스 테이블 형식으로 재작성

**결과**: HISTORY.md는 한 눈에 보이는 인덱스, 상세 내용은 history/ 하위 파일에서 관리.

**비유**: 두꺼운 일기장 한 권(단일 HISTORY.md)을 월별 파일함(history/ 디렉토리)으로 정리한 것. 표지(HISTORY.md)에는 "언제 어떤 내용"만 요약해 두고, 자세한 내용은 해당 날짜 파일을 열어 확인한다.
