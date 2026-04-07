# SessionStart 린터 미설치 자동 감지

## 지시 요약
세션 시작 시 프로젝트에 린터/타입체커가 없으면 사용자에게 설치 여부를 확인하도록 추가.

## 작업 내용
- `session-start.js`에 린터 감지 로직 추가 (섹션 5)
- 프로젝트 타입별 감지: Node.js(eslint/typescript), Python(ruff), Elixir(credo)
- `.leeloo/lint-setup-done` 플래그로 한 번만 확인 (매 세션 반복 방지)
- 린터가 이미 있거나 해당 프로젝트가 아니면 플래그 자동 생성

## 동작 흐름
```
세션 시작 → lint-setup-done 존재? → 건너뜀
         → 미존재 → 프로젝트 타입 감지
           → 린터 있음 → 플래그 생성
           → 린터 없음 → systemMessage로 Claude에 안내
             → Claude가 사용자에게 설치 여부 질문
             → 설치/거부 후 플래그 생성
```

## 결과
- session-start.js에 약 55줄 추가
- Node.js, Python, Elixir 프로젝트 자동 감지
