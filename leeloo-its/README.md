# leeloo-its

ITS DB 테이블 DDL 생성/수정 Claude Code 플러그인.

## 설치

이 폴더를 Claude Code 플러그인 디렉토리에 복사:
```bash
cp -r plugins/lk-its-ddl-tool ~/.claude/plugins/lk-its-ddl-tool
```

또는 심볼릭 링크:
```bash
ln -s $(pwd)/plugins/lk-its-ddl-tool ~/.claude/plugins/lk-its-ddl-tool
```

## 사용법

```
/lk-its-ddl create COM_NEW_TABLE      — 새 테이블 DDL 생성 (대화형)
/lk-its-ddl create --from design.md   — 설계서에서 DDL 생성
/lk-its-ddl alter COM_EQUIPMENT       — 기존 테이블 수정 (컬럼 추가/변경/삭제)
/lk-its-ddl show TFC_LINK             — 현재 DDL 조회
/lk-its-ddl check ddl/                — DDL 정합성 검증
/lk-its-ddl dict                      — 도메인/컬럼 사전 검색
```

## 구조

```
its-ddl-tool/
├── plugin.json                    — 플러그인 매니페스트
├── README.md                      — 이 파일
├── skills/
│   └── its-ddl/
│       └── SKILL.md               — 스킬 정의 (서브커맨드 6개)
├── resources/
│   ├── system-prompt.md           — P1~P10 원칙 + 도메인/컬럼 사전 + Few-shot
│   └── domain-dictionary.yaml     — 데이터 표준 사전 (Single Source of Truth)
└── tools/
    └── consistency_checker.py     — DDL 정합성 자동 검증 (7개 항목)
```

## 특징

- **Claude 자체가 DDL 생성** — 별도 API 호출 불필요
- **데이터 표준 사전 자동 참조** — 도메인/컬럼명/타입이 항상 일관
- **COMMENT ON 자동 생성** — _CD 컬럼에 허용값 패턴 자동 포함
- **정합성 자동 검증** — 저장 시 consistency_checker.py 자동 실행
- **기존 DDL 수정 지원** — ALTER + 원본 DDL 동기화
