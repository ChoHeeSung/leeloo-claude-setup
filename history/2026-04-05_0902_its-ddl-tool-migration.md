# its-ddl-tool 플러그인 마켓플레이스 마이그레이션

**날짜**: 2026-04-05 09:02

## 지시 요약

사용자가 별도로 만든 its-ddl-tool 플러그인(스킬 3개: DDL 관리, 코드 관리, 시설물 관리)을 leeloo-claude-setup 마켓플레이스 구조에 맞게 마이그레이션.

## 작업 내용

### 마이그레이션 항목

| 항목 | 변경 |
|------|------|
| plugin.json | `skills`/`resources` 배열 제거, author 표준 형식 |
| CLAUDE.md | 신규 생성 |
| marketplace.json | its-ddl-tool 등록 (category: database) |
| 스킬 접두사 | `its-` → `lk-its-` (네이밍 규칙 통일) |
| 디렉토리명 | `its-ddl/` → `lk-its-ddl/` 등 |
| db-connection.md | DB 비밀번호 → `${DB_PASSWORD}` 플레이스홀더로 교체 |
| CLAUDE.md, README.md (루트) | 플러그인 목록, 디렉토리 트리, 네임스페이스 업데이트 |

### 스킬 목록

| 스킬 | 설명 |
|------|------|
| `/lk-its-ddl` | 테이블 DDL 생성/수정, 정합성 검증, 도메인 사전 |
| `/lk-its-code` | 코드 그룹/항목, 교통 패턴, 공휴일 관리 |
| `/lk-its-equip` | 현장 시설물(VDS, CCTV, VMS 등) 등록/수정/조회 |

## 결과

- 마켓플레이스에 5번째 플러그인으로 등록
- 모든 스킬 `lk-its-` 접두사로 통일
- DB 비밀번호 원격 노출 방지
