# 2026-03-05 — 상태바 스크립트 파일명 변경

## 상태바 스크립트 파일명 변경

**지시 요약**: `statusline-cc-chips.sh` 파일명을 `statusline-leeloo.sh`로 변경하고, 관련 스크립트 내 참조도 수정

**작업 내용**:
1. 파일명 변경: `statusline-cc-chips.sh` → `statusline-leeloo.sh`
2. `statusline-leeloo.sh` 내 주석 수정: `CC CHIPS` → `Leeloo`
3. `setup-claude-code.sh` 내 참조 5곳 일괄 수정
4. Step 4 섹션 주석도 `Leeloo statusline`으로 변경

**결과**: 모든 참조가 `statusline-leeloo.sh`로 통일됨

**비유**: 마치 회사 이름이 바뀌어서 간판(파일명)과 명함·서류(스크립트 내 참조) 모두를 새 이름으로 교체한 것과 같다.
