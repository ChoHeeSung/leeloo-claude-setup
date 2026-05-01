---
name: lk-its-code
description: |
  ITS 코드/패턴코드 관리 — Oracle DB에 코드 그룹·항목·패턴·공휴일 추가/검색.
  ITS 코드, 코드 추가, 패턴코드, 공휴일, 코드 검색, 오라클, its code, pattern code, holiday, oracle
user_invocable: true
argument-hint: "[add-group|add-item|add-pattern|add-holiday|list|search] [그룹코드|검색어]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-its-code — ITS Code and Pattern Code Management

Interactively add codes and execute them directly against the Oracle DB.
Running `/lk-its-code` with no arguments starts the interactive menu.

## DB Connection Info

Read `${CLAUDE_PLUGIN_ROOT}/resources/db-connection.md` via the Read tool to obtain connection info.

## Procedure

### No argument → Interactive menu

AskUserQuestion:
```
무엇을 하시겠습니까?
- 코드 그룹 추가 (add-group)
- 코드 항목 추가 (add-item)
- 교통 패턴 추가 (add-pattern)
- 공휴일 추가 (add-holiday)
- 코드 목록 조회 (list)
- 코드 검색 (search)
```

---

### add-group action (interactive)

**Step 1**: AskUserQuestion — "그룹 코드를 입력하세요 (영문 대문자_언더스코어, 예: WEATHER_ALERT)"

**Step 2**: AskUserQuestion — "한글 그룹명을 입력하세요 (예: 기상경보 유형 코드)"

**Step 3**: AskUserQuestion:
```
소속 도메인을 선택하세요:
- COM (공통)
- TFC (교통)
- VDS (검지기)
- CCTV (영상감시)
- VMS (전광판)
- LCS (차로제어)
- TGMS (터널/방재)
- EPC (비상전화)
- ERS (기준링크)
```

**Step 4**: AskUserQuestion — "설명을 입력하세요 (선택, 엔터로 건너뛰기)"

**Step 5**: DB duplicate check:
```python
cursor.execute("SELECT GROUP_CD, GROUP_NM FROM ITS.COM_CODE_GROUP WHERE GROUP_CD=:cd", {'cd': group_cd})
```
If exists: "이미 존재하는 그룹입니다. 항목을 추가하시겠습니까?" → chain into add-item

**Step 6**: INSERT preview + confirmation:
```
코드 그룹 추가:
  GROUP_CD: WEATHER_ALERT
  GROUP_NM: 기상경보 유형 코드
  DOMAIN: COM

  DB에 추가할까요? (추가/취소)
```

**Step 7**: DB execute:
```python
cursor.execute("""
  INSERT INTO ITS.COM_CODE_GROUP (GROUP_CD, DOMAIN_CD, GROUP_NM, SORT_ORDER, USE_YN)
  VALUES (:cd, :dom, :nm, (SELECT NVL(MAX(SORT_ORDER),0)+1 FROM ITS.COM_CODE_GROUP), 'Y')
""", {'cd': group_cd, 'dom': domain, 'nm': group_nm})
conn.commit()
```

**Step 8**: Result + follow-up prompt:
```
추가 완료: WEATHER_ALERT (기상경보 유형 코드)

이어서 코드 항목을 추가하시겠습니까? (예/아니오)
```
"예" → auto-chain into add-item (auto-pass GROUP_CD)

---

### add-item action (interactive)

**Step 1**: Group selection
If GROUP_CD is given as argument, use it. Otherwise:
```python
cursor.execute("SELECT GROUP_CD, GROUP_NM, DOMAIN_CD FROM ITS.COM_CODE_GROUP ORDER BY DOMAIN_CD, GROUP_CD")
```
Display the list, then AskUserQuestion: "그룹 코드를 입력하세요 (또는 번호 선택)"

**Step 2**: Display existing items:
```python
cursor.execute("SELECT ITEM_CD, ITEM_NM, SORT_ORDER FROM ITS.COM_CODE_ITEM WHERE GROUP_CD=:cd ORDER BY SORT_ORDER", {'cd': group_cd})
```
```
현재 DIRECTION 그룹 항목:
  1. HAEUNDAE — 해운대 방향
  2. GIMHAE — 김해 방향
  3. HAEUNDAE_BRANCH — 해운대 지선
  4. GIMHAE_BRANCH — 김해 지선
```

**Step 3**: Item input (interactive loop)
AskUserQuestion:
```
추가할 코드 항목을 입력하세요.
형식: 영문코드=한글명 (여러 건은 쉼표 구분)
예: STORM=폭풍, FOG=안개, HAIL=우박
또는 하나씩 입력 후 "완료"
```

**Step 4: Mapping parse + preview table generation (Haiku Task)**

Delegate input parsing + SORT_ORDER auto-assignment + preview table to a Haiku sub-agent.

**Agent tool invocation:**
- `subagent_type`: `task`
- `task_model`: `haiku`
- `prompt`: insert data into the template below

```
아래 코드 항목 입력을 파싱하고 INSERT 프리뷰 테이블을 생성하라.

## 입력 데이터

### 그룹 코드
{group_cd}

### 사용자 입력 (영문코드=한글명, 쉼표 구분)
{user_input}

### 기존 최대 SORT_ORDER
{max_sort_order}

## 작업
1. 사용자 입력을 쉼표 기준으로 분리하고 '='로 ITEM_CD/ITEM_NM을 파싱한다.
2. 영문 대문자 + 언더스코어만 허용. 위반 시 해당 항목을 'ERROR' 라인에 기록.
3. SORT_ORDER는 {max_sort_order}+1부터 순차 할당.
4. 다음 마크다운 테이블 형식으로 출력:

```
추가할 항목:
| ITEM_CD | ITEM_NM | SORT_ORDER |
|---------|---------|------------|
| STORM | 폭풍 | {n+1} |
| FOG | 안개 | {n+2} |
| HAIL | 우박 | {n+3} |

ERRORS (있으면):
- '3'은 숫자 코드입니다. 영문 약어로 재입력 필요.
```

## 출력
위 테이블만 출력. 다른 설명 없이.
```

**Result verification (main session):**
- [ ] input item count = output item count (including ERROR)
- [ ] SORT_ORDER is contiguous starting at max+1
- [ ] ITEM_CD naming violations are listed in the ERROR section
- [ ] No items beyond input were added

**Fallback on quality failure:** parse and format directly in the main session.

Display the verified table to the user, then:
```
DB에 추가할까요? (추가/수정/취소)
```

**Step 5**: DB execute (multiple rows at once):
```python
for item in items:
    cursor.execute("""
      INSERT INTO ITS.COM_CODE_ITEM (GROUP_CD, ITEM_CD, ITEM_NM, SORT_ORDER, USE_YN)
      VALUES (:grp, :cd, :nm, :sort, 'Y')
    """, item)
conn.commit()
```

**Step 6**: Result + COMMENT update prompt:
```
3건 추가 완료: STORM, FOG, HAIL

이 그룹을 참조하는 _CD 컬럼의 COMMENT ON을 갱신해야 합니다:
  COMMENT ON COLUMN ITS.{TABLE}.WEATHER_ALERT_CD IS
    '기상경보 유형 — 참조: COM_CODE_ITEM(WEATHER_ALERT). 허용값: STORM/FOG/HAIL';

COMMENT를 자동 갱신할까요? (예/아니오)
```
"예" → find matching `_CD` columns in DB and auto-UPDATE COMMENT ON

---

### add-pattern action (interactive)

**Step 1**: AskUserQuestion:
```
패턴 그룹을 선택하세요:
- WEEKDAY (평일)
- WEEKEND (주말)
- LUNAR_NEW_YEAR (설날 연휴)
- CHUSEOK (추석 연휴)
- PUBLIC_HOLIDAY (공휴일)
- 새 그룹 (직접 입력)
```

**Step 2**: AskUserQuestion — "패턴 코드 (영문, 예: ELECTION_DAY)"
**Step 3**: AskUserQuestion — "한글 명칭 (예: 선거일)"
**Step 4**: For holidays, AskUserQuestion — "기준일 대비 오프셋 (-2~+2, 해당 없으면 엔터)"

**Step 5**: DB execute + result:
```
패턴 추가 완료: ELECTION_DAY (선거일) — PUBLIC_HOLIDAY 그룹

공휴일 달력에도 추가하시겠습니까? (예/아니오)
```
"예" → auto-chain into add-holiday

---

### add-holiday action (interactive)

**Step 1**: AskUserQuestion — "공휴일 날짜를 입력하세요 (YYYY-MM-DD, 예: 2026-06-03)"

**Step 2**: Pattern code selection:
```python
cursor.execute("SELECT PATTERN_SUB_CD, PATTERN_NM, CATEGORY FROM ITS.COM_TRAFFIC_PATTERN ORDER BY CATEGORY, PATTERN_SUB_CD")
```
Display the list, then AskUserQuestion: "패턴 코드를 선택하세요"

**Step 3**: AskUserQuestion — "공휴일 명칭 (한글, 예: 지방선거일)"
**Step 4**: AskUserQuestion — "대체공휴일인가요? (Y/N)"

**Step 5**: DB execute:
```python
cursor.execute("""
  INSERT INTO ITS.COM_HOLIDAY_CALENDAR (YEAR, MONTH, DAY, PATTERN_SUB_CD, HOLIDAY_NM, SUBSTITUTE_YN)
  VALUES (EXTRACT(YEAR FROM DATE :dt), EXTRACT(MONTH FROM DATE :dt), EXTRACT(DAY FROM DATE :dt), :pcd, :nm, :yn)
""", {'dt': date, 'pcd': pattern_cd, 'nm': name, 'yn': subst})
conn.commit()
```

**Step 6**: Result:
```
공휴일 추가 완료: 2026-06-03 (지방선거일) — ELECTION_DAY
```

Allow adding another holiday on the same day: "같은 날 다른 공휴일도 추가하시겠습니까? (예/아니오)"

---

### list action (interactive)

AskUserQuestion:
```
무엇을 조회하시겠습니까?
- 코드 그룹 목록
- 특정 그룹의 항목 (그룹코드 입력)
- 교통 패턴 목록
- 공휴일 달력 (연도 입력)
```

For each choice, query the DB and output as a table.

---

### search action (interactive)

AskUserQuestion: "검색어를 입력하세요 (한글 또는 영문)"

DB search:
```python
cursor.execute("""
  SELECT g.GROUP_CD, g.GROUP_NM, i.ITEM_CD, i.ITEM_NM
  FROM ITS.COM_CODE_ITEM i JOIN ITS.COM_CODE_GROUP g ON i.GROUP_CD = g.GROUP_CD
  WHERE UPPER(i.ITEM_CD) LIKE '%'||UPPER(:kw)||'%'
     OR i.ITEM_NM LIKE '%'||:kw||'%'
     OR g.GROUP_NM LIKE '%'||:kw||'%'
  ORDER BY g.GROUP_CD, i.SORT_ORDER
""", {'kw': keyword})
```

Display results + allow repeat ("다른 검색어?").

---

## Code Value Naming Rules (auto-validated)

Code values are auto-validated on input:
- Allow only uppercase letters + underscores (no numeric codes)
- Self-explanatory: meaning must be apparent
- On violation: "'{value}'는 숫자 코드입니다. 영문 약어로 입력해주세요 (예: SMOOTH, CONGESTED)"
