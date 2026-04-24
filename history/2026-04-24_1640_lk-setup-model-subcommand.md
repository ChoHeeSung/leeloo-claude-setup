# lk-setup model 서브커맨드 추가

## 지시 요약
/lk-setup 스킬에 model 서브커맨드를 신규 추가하여 Claude Code 세션의 기본 모델을 조회 및 변경하는 기능을 구현합니다.

## 작업 내용

### 1. SKILL.md frontmatter 수정
- description 필드: "설치, 상태 조회, 플러그인 토글 및 모델 설정" 추가
- argument-hint 필드: `{setup|model|toggle-plugin|install} [flags]` 형식으로 model 추가

### 2. 서브커맨드 목록 확장
- 기존: setup, toggle-plugin, install
- 신규: model (기본 모델 조회 및 설정)

### 3. 인자 파싱 로직
- model 케이스 추가 (Bash 스크립트의 case 문)
- settings.json의 model 필드를 읽어 현재 설정값 조회

### 4. status 동작 개선
- 상태 조회 시 settings.json의 model 필드에서 현재 기본 모델 읽기
- 상태 테이블에 새 행 추가: "기본 모델" 필드 표시
- 모델 변경 방법 안내 추가

### 5. model 동작 구현
- AskUserQuestion으로 4개 모델 중 단일 선택:
  - Claude 3.5 Opus 4.7
  - Claude 3.5 Sonnet 4.6
  - Claude 3.5 Sonnet 4.6 (1M context)
  - Claude 3.5 Haiku 4.5
- 선택 결과를 settings.json의 model 필드에 저장
- 재시작 시 새 모델이 적용되도록 안내

## 결과

### 변경 사항
- 파일: leeloo-kit/skills/lk-setup/SKILL.md
- 추가 라인: 56라인
- 삭제 라인: 2라인

### 기능 정리
1. `/lk-setup status` 실행 시 → 현재 기본 모델 표시 가능
2. `/lk-setup model` 실행 시 → 4개 모델 선택 UI 제시, settings.json 업데이트
3. 사용자가 모델 변경 후 세션 재시작 → 새 모델로 Claude Code 동작

## 현실 비유
```
기존 상황: 손목시계(settings.json)에 저장된 사용자 선호도는 있지만,
         시간을 읽을 때(status 명령) 화면에 표시되지 않고,
         시간을 변경하는 명확한 버튼(model 명령)이 없었음.

개선 사항: 시계 화면에 현재 시간을 보여주고(status + model 행),
         버튼을 눌러 서로 다른 시간대(모델)로 쉽게 전환하는 UI 추가.
         세션 재시작 시 새로운 시간대(모델)가 반영됨.
```

## 기술 세부사항
- model 필드는 settings.json의 최상위 depth에 위치
- 4개 모델 선택지는 Claude Code가 지원하는 주요 모델의 최신 버전 사용
- 설정 변경 후 재시작 안내는 status 명령 시에도 표시됨
