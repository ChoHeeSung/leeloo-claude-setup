# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`its-ddl-tool`은 ITS(지능형교통시스템) Oracle DB 관리 플러그인입니다.
대화형으로 테이블 DDL 생성/수정, 코드 관리, 시설물 등록을 수행하며, Oracle DB에 직접 실행합니다.

## Architecture

- `plugin.json` — Plugin manifest (name: "its-ddl-tool", version: "1.0.0").
- `skills/` — Skills (its- prefix):
  - `lk-its-ddl/` — DDL 생성/수정 (create, alter, show, check, dict).
  - `lk-its-code/` — 코드/패턴코드 관리 (add-group, add-item, add-pattern, add-holiday, list, search).
  - `lk-its-equip/` — 현장 시설물 등록/수정/조회 (add, modify, list, show, status, move, delete).
- `resources/` — 참조 리소스:
  - `system-prompt.md` — P1~P10 DDL 생성 원칙 + 도메인/컬럼 사전 + Few-shot.
  - `domain-dictionary.yaml` — 데이터 표준 사전 (Single Source of Truth).
  - `db-connection.md` — Oracle DB 접속 정보 + Python 헬퍼.
- `tools/` — 자동화 스크립트:
  - `consistency_checker.py` — DDL 정합성 자동 검증 (7개 항목).

## Key Design Decisions

- **Claude 자체가 DDL 생성**: 별도 API 호출 불필요. system-prompt.md 규칙 기반.
- **데이터 표준 사전 참조**: domain-dictionary.yaml이 모든 컬럼 타입/크기의 Single Source of Truth.
- **Oracle DB 직접 실행**: python3 + oracledb로 CREATE/ALTER/INSERT 즉시 실행.
- **스킬 연계**: its-code ↔ its-equip ↔ its-ddl 간 자동 연계 제안.
- **lk-its- prefix**: ITS DB 전용 네임스페이스.

## Dependencies

- Python 3 + oracledb 패키지
- Oracle DB 접속 (resources/db-connection.md 참조)

## Testing Changes

1. 플러그인 활성화 후 `/lk-its-ddl`, `/lk-its-code`, `/lk-its-equip` 자동완성 확인
2. DB 접속 테스트: `python3 -c "import oracledb; ..."`
3. `/lk-its-ddl dict` → domain-dictionary.yaml 검색 동작 확인
4. `/lk-its-ddl check` → consistency_checker.py 실행 확인
