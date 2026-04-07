# lk-setup install/reinstall 파라미터 추가

## 지시 요약
lk-setup 스킬에 `install`(일괄 설치)과 `reinstall`(강제 재설치) 서브커맨드를 추가.

## 작업 내용

### install 동작
- 모든 항목(statusline, CLAUDE.md, serena, plugins, gemini) 상태를 한 번에 확인
- 미설치 항목만 자동 설치 (이미 설치된 항목은 건너뜀)
- 사용자 확인 없이 자동 진행

### reinstall 동작
- 시작 전 사용자에게 한 번만 확인 ("모든 설정 파일을 덮어쓸까요?")
- 모든 항목을 강제로 재설치 (기존 파일 덮어쓰기)

## 결과
- lk-setup SKILL.md에 107줄 추가 (install + reinstall 절차)
- 기존 6개 서브커맨드에 2개 추가 → 총 8개
