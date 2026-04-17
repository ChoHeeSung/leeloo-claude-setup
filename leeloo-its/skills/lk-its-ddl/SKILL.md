---
name: lk-its-ddl
description: "ITS DB 테이블 DDL 생성/수정. 대화형으로 테이블 설계 → DB 직접 실행. /lk-its-ddl [create|alter|show|check|dict]"
user_invocable: true
argument-hint: "[create|alter|show|check|dict] [테이블명]"
---

# /lk-its-ddl — ITS DB 테이블 DDL 생성/수정

대화형으로 테이블을 설계하고, Oracle DB에 직접 실행합니다.
인자 없이 `/lk-its-ddl`만 입력하면 대화형 메뉴가 시작됩니다.

## DB 접속 정보

Read 도구로 `${CLAUDE_PLUGIN_ROOT}/resources/db-connection.md`를 읽어 접속 정보를 확인합니다.
모든 DB 작업은 Bash + python3 + oracledb로 실행합니다.

## Procedure

### 인자 없음 → 대화형 메뉴

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

### create 동작 (완전 대화형)

**Step 1: 도메인 선택**
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

**Step 2: 테이블 기본 정보**
AskUserQuestion 순차:
1. "테이블 이름을 입력하세요 (접두사 제외, 예: WEATHER_ALERT)"
2. "이 테이블의 용도를 설명해주세요 (한글)"

**Step 3: 컬럼 설계 (반복)**
AskUserQuestion:
```
컬럼을 추가하세요. 형식: 한글명 또는 영문명
예시: "장비ID(PK), 장비명, 방향코드, 위도, 경도, 사용여부"
또는 하나씩: "장비ID" → 다음 → "장비명" → 다음 → "완료"
```

각 컬럼에 대해:
- Read 도구로 `${CLAUDE_PLUGIN_ROOT}/resources/domain-dictionary.yaml` 읽기
- 한글명 → 영문 컬럼명 자동 매핑 (용어사전)
- 도메인 자동 결정 (ID/CD/NM/DTM/YN/COORD 등)
- PK/FK/NOT NULL 자동 판단
- 매핑 결과를 사용자에게 확인:
  ```
  컬럼 매핑 결과:
  | 입력 | 영문명 | 도메인 | 타입 | PK | FK |
  | 장비ID | EQUIP_ID | ID | VARCHAR2(20) | O | |
  | 장비명 | EQUIP_NM | NM | VARCHAR2(200) | | |
  | 방향코드 | DIRECTION_CD | CD | VARCHAR2(30) | | COM_CODE_ITEM(DIRECTION) |
  | 위도 | LATITUDE | COORD | NUMBER(12,8) | | |
  
  맞으면 "확인", 수정하려면 컬럼명을 입력하세요.
  ```

**Step 4: FK 설정**
AskUserQuestion:
```
FK 참조가 있나요?
- 예 (부모 테이블 지정)
- 아니오
```
"예" 선택 시: 부모 테이블과 참조 컬럼 입력

**Step 5: DDL 프리뷰 (Haiku Task)**

DDL 문자열 생성은 Haiku 서브 에이전트에게 위임한다. 메인 세션은 프롬프트 구성 + 결과 검증만 수행.

먼저 Read 도구로 `${CLAUDE_PLUGIN_ROOT}/resources/system-prompt.md`를 읽어 규칙 전문을 확보한다.

**Agent tool 호출:**
- `subagent_type`: `task`
- `task_model`: `haiku`
- `prompt`: 아래 템플릿에 데이터를 삽입

```
아래 테이블 설계 내역을 기반으로 Oracle DDL을 생성하라.

## DDL 생성 규칙 (system-prompt.md 전문)
{system_prompt_md 본문 삽입}

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

**결과 검증 (메인 세션):**
- [ ] CREATE TABLE, COMMENT ON, PK/FK, INDEX 4개 섹션이 모두 존재
- [ ] 입력 컬럼 목록의 모든 컬럼이 DDL에 포함됨
- [ ] 입력에 없는 컬럼/FK/CHECK가 hallucination되지 않음
- [ ] 모든 COMMENT ON이 한글 코멘트를 포함
- [ ] FK 참조 테이블/컬럼이 입력과 일치

**품질 미달 시 폴백:** 메인 세션에서 system-prompt.md 규칙을 직접 적용해 재생성.

검증 통과한 DDL을 사용자에게 표시한다.

AskUserQuestion:
```
생성된 DDL을 확인하세요:
- DB에 실행 (테이블 생성 + COMMENT + FK)
- DDL 파일에 저장 (ddl/ 디렉토리)
- 수정 (변경사항 입력)
- 취소
```

**Step 6: DB 실행**
"DB에 실행" 선택 시:
1. DB 접속 (db-connection.md 참조)
2. CREATE TABLE 실행
3. COMMENT ON TABLE/COLUMN 실행
4. FK/INDEX/CHECK 실행
5. 실행 결과 보고:
   ```
   테이블 생성 완료!
   - ITS.{TABLE_NAME}: {N}개 컬럼, PK 1개, FK {N}개
   - COMMENT: 테이블 1건 + 컬럼 {N}건
   ```

**Step 7: 사전 갱신 안내**
새 컬럼이 domain-dictionary.yaml에 없으면:
```
다음 컬럼이 표준 사전에 없습니다. 추가하시겠습니까?
- {COLUMN_NAME}: {TYPE} — "{COMMENT}"
```

---

### alter 동작 (대화형)

**Step 1: 테이블 선택**
인자 없으면 AskUserQuestion: "수정할 테이블 이름을 입력하세요"

**Step 2: 현재 구조 조회**
DB에서 현재 테이블 구조를 조회하여 표시:
```python
cursor.execute("""
  SELECT column_name, data_type, data_length, nullable, data_default
  FROM all_tab_columns WHERE owner='ITS' AND table_name=:tn
  ORDER BY column_id
""", {'tn': table_name})
```

**Step 3: 변경 유형 선택**
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

**Step 4: 변경 내용 입력** (선택에 따라)
대화형으로 변경 사항 수집.

**Step 5: ALTER DDL 생성 + 프리뷰 (Haiku Task)**

ALTER 문 생성도 동일하게 Haiku 서브 에이전트에 위임한다.

**Agent tool 호출:**
- `subagent_type`: `task`
- `task_model`: `haiku`
- `prompt`: "아래 변경 내용을 Oracle ALTER TABLE/COMMENT ON/DROP INDEX 등 DDL로 생성하라. 입력 외 변경은 추가하지 않는다." + 현재 구조/변경 내용/system-prompt.md 규칙 삽입.

**결과 검증 (메인 세션):**
- [ ] 변경 유형(ADD/MODIFY/RENAME/DROP) 정확히 매핑됨
- [ ] 입력 외 컬럼 변경 없음
- [ ] COMMENT ON이 변경된 컬럼에만 갱신됨

**품질 미달 시 폴백:** 메인 세션 재생성.

**Step 6: DB 실행**
ALTER TABLE 실행 + COMMENT ON 갱신 + ddl/ 원본 파일도 동기화.

---

### show 동작

**Step 1**: 테이블명 입력 (인자 또는 대화형)
**Step 2**: DB에서 조회:
```python
# 테이블 구조
cursor.execute("SELECT * FROM all_tab_columns WHERE owner='ITS' AND table_name=:tn ORDER BY column_id", {'tn': name})
# 제약조건
cursor.execute("SELECT constraint_name, constraint_type, search_condition FROM all_constraints WHERE owner='ITS' AND table_name=:tn", {'tn': name})
# COMMENT
cursor.execute("SELECT comments FROM all_tab_comments WHERE owner='ITS' AND table_name=:tn", {'tn': name})
cursor.execute("SELECT column_name, comments FROM all_col_comments WHERE owner='ITS' AND table_name=:tn", {'tn': name})
```
**Step 3**: 깔끔한 테이블 형식으로 출력.

---

### check 동작

Bash로 consistency_checker.py 실행:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/tools/consistency_checker.py ddl/
```
결과 파싱 후 위반 항목별 표시 + 자동 수정 제안.

---

### dict 동작 (대화형 검색)

AskUserQuestion: "검색할 용어를 입력하세요 (한글 또는 영문, 예: 방향, EQUIP, 속도)"

domain-dictionary.yaml에서 검색하여 결과 표시:
```
검색 결과: "방향"
| 컬럼명 | 도메인 | 타입 | 코멘트 |
| DIRECTION_CD | CD | VARCHAR2(30) | 방향 코드 — 허용값: HAEUNDAE/GIMHAE/... |
| INSTALL_DIRECTION_CD | CD | VARCHAR2(30) | 설치 방향 |
```
