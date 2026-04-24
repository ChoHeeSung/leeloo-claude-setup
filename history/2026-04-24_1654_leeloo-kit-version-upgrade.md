# leeloo-kit 버전 업그레이드 3.5.11 → 3.6.0

## 작업 요약

leeloo-kit 플러그인의 minor 버전을 3.5.11에서 3.6.0으로 업데이트하고, 마켓플레이스 메니페스트를 동기화했습니다.

## 변경 배경

이전 커밋(eaee13c)에서 `lk-setup` 서브커맨드에 **model 기능**(session model 조회 및 변경)이 추가되었습니다. 이는 신규 기능 추가에 해당하므로 Semantic Versioning의 minor 버전 업데이트로 반영되었습니다.

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `leeloo-kit/plugin.json` | `version`: 3.5.11 → 3.6.0 |
| `.claude-plugin/marketplace.json` | `leeloo-kit` 플러그인 버전 동기화: 3.5.11 → 3.6.0 |

## 결과

- 마켓플레이스 및 플러그인 메니페스트 간 버전 일관성 유지
- lk-setup의 model 서브커맨드 신규 기능을 minor 버전으로 공식 반영
- 사용자가 Claude Code 마켓플레이스에서 3.6.0으로 업데이트된 플러그인 설치 가능
