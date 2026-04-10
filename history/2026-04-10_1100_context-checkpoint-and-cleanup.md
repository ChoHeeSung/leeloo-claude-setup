# Context Checkpoint 구현 + MCP 헬스체크 제거 + lk-iu-pdf-extract 리네임

## 지시
1. 컨텍스트 압축 시 작업 맥락이 소실되지 않도록 스마트 요약 기능 요청
2. MCP 헬스체크 미사용으로 제거 요청
3. leeloo-kit CLAUDE.md Skills 테이블 불필요 — 제거
4. lk-iu-pdf-extract → lk-doc-pdf-extract 네임스페이스 통일

## 작업 내용

### Context Checkpoint (신규)
토큰 절약하면서 과거 기억을 보존하는 패턴.
- Claude가 주요 결정/발견을 `.leeloo/context-summary.md`에 기록 (최대 20줄, 100자/줄)
- `pre-compact.js` — context-summary.md를 postContext로 주입 (압축 후에도 생존)
- `session-end.js` — context-summary를 세션 파일에 병합 후 초기화
- `session-start.js` — 복원 상한 500자 → 800자 (맥락 포함 여유)
- 추가 비용: 세션당 ~1,000토큰 (100만 컨텍스트 대비 0.1%)

### MCP 헬스체크 제거
- `mcp-health-check.js` 삭제
- `hooks.json`에서 PostToolUseFailure 이벤트 제거 (7개 → 6개)
- 관련 문서/상태 파일 참조 정리

### Skills 테이블 제거
- leeloo-kit CLAUDE.md에서 9줄 Skills 테이블 제거 (plugin.json + SKILL.md로 충분)

### lk-iu-pdf-extract → lk-doc-pdf-extract
- 디렉토리 리네임 + SKILL.md 내 11곳 수정
- leeloo-util CLAUDE.md 네임스페이스 설명 변경 (lk-iu-* → lk-doc-* 통일)
- 루트 CLAUDE.md, README.md, check-env.sh 참조 수정
- docs/, history/는 과거 기록이므로 미수정

## 결과
11 files changed, +114 -702 (mcp-health-check.js 122줄 삭제 + SKILL.md 이동)
