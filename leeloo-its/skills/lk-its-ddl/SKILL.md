---
name: lk-its-ddl
description: |
  ITS Oracle DB 테이블 DDL 인터랙티브 설계·생성·수정·점검.
  DDL, 테이블 생성, 테이블 수정, 오라클, ITS DB, 데이터 사전, ddl, oracle ddl, create table, alter table
user_invocable: true
argument-hint: "[create|alter|show|check|dict] [테이블명]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-its-ddl — ITS DB Table DDL Generation/Modification

Interactively design tables and execute DDL directly against the Oracle DB.
Running `/lk-its-ddl` with no arguments starts the interactive menu.

## DB Connection Info

Read `${CLAUDE_PLUGIN_ROOT}/resources/db-connection.md` via the Read tool to obtain connection info.
All DB operations run via Bash + python3 + oracledb.

## Procedure

### No argument → Interactive menu

AskUserQuestion:
```
무엇을 하시겠습니까?
- 새 테이블 만들기 (create)
- 기존 테이블 수정 (alter)
- 테이블 구조 보기 (show)
- DDL 정합성 검증 (check)
- 도메인/컬럼 사전 검색 (dict)
```

---

### create action (fully interactive)

**Step 1: Domain selection**
AskUserQuestion:
```
이 테이블의 도메인을 선택하세요:
- COM_ (공통 — 코드, 사고, 운영자, 기상, 장비)
- TFC_ (교통 — 차로, 지점, 구간, 통계, 패턴)
- VDS_ (차량검지기)
- CCTV_ (영상감시)
- VMS_ (전광판)
- LCS_ (차로제어)
- TGMS_ (터널/방재)
- EPC_ (비상전화)
- ERS_ (기준링크)
```

**Step 2: Basic table info**
AskUserQuestion in sequence:
1. "테이블 이름을 입력하세요 (접두사 제외, 예: WEATHER_ALERT)"
2. "이 테이블의 용도를 설명해주세요 (한글)"

**Step 3: Column design (loop)**
AskUserQuestion:
```
컬럼을 추가하세요. 형식: 한글명 또는 영문명
예시: "장비ID(PK), 장비명, 방향코드, 위도, 경도, 사용여부"
또는 하나씩: "장비ID" → 다음 → "장비명" → 다음 → "완료"
```

For each column:
- Read `${CLAUDE_PLUGIN_ROOT}/resources/domain-dictionary.yaml` via the Read tool
- Auto-map Korean name → English column name (dictionary)
- Auto-determine domain (ID/CD/NM/DTM/YN/COORD, etc.)
- Auto-determine PK/FK/NOT NULL
- Confirm mapping result with user:
  ```
  컬럼 매핑 결과:
  | 입력 | 영문명 | 도메인 | 타입 | PK | FK |
  | 장비ID | EQUIP_ID | ID | VARCHAR2(20) | O | |
  | 장비명 | EQUIP_NM | NM | VARCHAR2(200) | | |
  | 방향코드 | DIRECTION_CD | CD | VARCHAR2(30) | | COM_CODE_ITEM(DIRECTION) |
  | 위도 | LATITUDE | COORD | NUMBER(12,8) | | |

  맞으면 "확인", 수정하려면 컬럼명을 입력하세요.
  ```

**Step 4: FK setup**
AskUserQuestion:
```
FK 참조가 있나요?
- 예 (부모 테이블 지정)
- 아니오
```
On "예": collect parent table and reference columns

**Step 5: DDL preview (Haiku Task)**

Delegate DDL string generation to a Haiku sub-agent. The main session only builds the prompt and verifies the result.

First read `${CLAUDE_PLUGIN_ROOT}/resources/system-prompt.md` via the Read tool to obtain the full ruleset.

**Agent tool invocation:**
- `subagent_type`: `task`
- `task_model`: `haiku`
- `prompt`: insert data into the template below

```
아래 테이블 설계 내역을 기반으로 Oracle DDL을 생성하라.

## DDL 생성 규칙 (system-prompt.md 전문)
{system_prompt_md content}

## 입력 데이터

### 테이블 기본 정보
- 도메인 접두사: {domain_prefix}
- 테이블명: {full_table_name} (예: ITS.COM_WEATHER_ALERT)
- 설명: {table_desc}

### 컬럼 매핑 결과 (Step 3 확정)
| 컬럼 | 영문명 | 도메인 | 타입 | PK | NOT NULL | FK 참조 | 코멘트 |
{column_rows}

### FK/INDEX/CHECK (Step 4 확정)
{fk_list}

## 출력 형식
순서대로 4개 섹션으로 출력:

```sql
-- 1) CREATE TABLE
CREATE TABLE ITS.{TABLE} (
  ...
);

-- 2) COMMENT ON
COMMENT ON TABLE ITS.{TABLE} IS '...';
COMMENT ON COLUMN ITS.{TABLE}.{COL} IS '...';

-- 3) PK / FK / CHECK
ALTER TABLE ITS.{TABLE} ADD CONSTRAINT ...;

-- 4) INDEX (있으면)
CREATE INDEX ... ON ITS.{TABLE}(...);
```

다른 설명이나 마크다운 코드블록 래핑 없이 SQL만 출력.
```

**Result verification (main session):**
- [ ] All 4 sections (CREATE TABLE, COMMENT ON, PK/FK, INDEX) exist
- [ ] All input columns are present in the DDL
- [ ] No hallucinated columns/FKs/CHECKs absent from input
- [ ] Every COMMENT ON includes a Korean comment
- [ ] FK reference table/columns match input

**Fallback on quality failure:** regenerate in the main session by directly applying system-prompt.md rules.

Display the verified DDL to the user.

AskUserQuestion:
```
생성된 DDL을 확인하세요:
- DB에 실행 (테이블 생성 + COMMENT + FK)
- DDL 파일에 저장 (ddl/ 디렉토리)
- 수정 (변경사항 입력)
- 취소
```

**Step 6: DB execute**
On "DB에 실행":
1. Connect to DB (per db-connection.md)
2. Run CREATE TABLE
3. Run COMMENT ON TABLE/COLUMN
4. Run FK/INDEX/CHECK
5. Report execution result:
   ```
   테이블 생성 완료!
   - ITS.{TABLE_NAME}: {N}개 컬럼, PK 1개, FK {N}개
   - COMMENT: 테이블 1건 + 컬럼 {N}건
   ```

**Step 7: Dictionary update prompt**
For new columns missing from domain-dictionary.yaml:
```
다음 컬럼이 표준 사전에 없습니다. 추가하시겠습니까?
- {COLUMN_NAME}: {TYPE} — "{COMMENT}"
```

---

### alter action (interactive)

**Step 1: Table selection**
If no argument, AskUserQuestion: "수정할 테이블 이름을 입력하세요"

**Step 2: Query current structure**
Query the DB and display current table structure:
```python
cursor.execute("""
  SELECT column_name, data_type, data_length, nullable, data_default
  FROM all_tab_columns WHERE owner='ITS' AND table_name=:tn
  ORDER BY column_id
""", {'tn': table_name})
```

**Step 3: Change type selection**
AskUserQuestion:
```
무엇을 변경하시겠습니까?
- 컬럼 추가
- 컬럼 타입/크기 변경
- 컬럼 이름 변경
- 컬럼 삭제
- FK 추가
- FK 삭제
- INDEX 추가
- COMMENT 수정
```

**Step 4: Collect change details** (per selection)
Gather changes interactively.

**Step 5: ALTER DDL generation + preview (Haiku Task)**

ALTER statements are likewise delegated to a Haiku sub-agent.

**Agent tool invocation:**
- `subagent_type`: `task`
- `task_model`: `haiku`
- `prompt`: "Generate Oracle ALTER TABLE/COMMENT ON/DROP INDEX DDL from the changes below. Do not introduce changes beyond the input." + insert current structure / changes / system-prompt.md rules.

**Result verification (main session):**
- [ ] Change type (ADD/MODIFY/RENAME/DROP) mapped correctly
- [ ] No column changes outside the input
- [ ] COMMENT ON updates only the changed columns

**Fallback on quality failure:** regenerate in the main session.

**Step 6: DB execute**
Run ALTER TABLE + update COMMENT ON + sync the original ddl/ file.

---

### show action

**Step 1**: Table name input (argument or interactive)
**Step 2**: Query the DB:
```python
# Table structure
cursor.execute("SELECT * FROM all_tab_columns WHERE owner='ITS' AND table_name=:tn ORDER BY column_id", {'tn': name})
# Constraints
cursor.execute("SELECT constraint_name, constraint_type, search_condition FROM all_constraints WHERE owner='ITS' AND table_name=:tn", {'tn': name})
# COMMENT
cursor.execute("SELECT comments FROM all_tab_comments WHERE owner='ITS' AND table_name=:tn", {'tn': name})
cursor.execute("SELECT column_name, comments FROM all_col_comments WHERE owner='ITS' AND table_name=:tn", {'tn': name})
```
**Step 3**: Output as a clean table.

---

### check action

Run consistency_checker.py via Bash:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/tools/consistency_checker.py ddl/
```
Parse the result, display violations per item, and propose auto-fixes.

---

### dict action (interactive search)

AskUserQuestion: "검색할 용어를 입력하세요 (한글 또는 영문, 예: 방향, EQUIP, 속도)"

Search domain-dictionary.yaml and display results:
```
검색 결과: "방향"
| 컬럼명 | 도메인 | 타입 | 코멘트 |
| DIRECTION_CD | CD | VARCHAR2(30) | 방향 코드 — 허용값: HAEUNDAE/GIMHAE/... |
| INSTALL_DIRECTION_CD | CD | VARCHAR2(30) | 설치 방향 |
```
