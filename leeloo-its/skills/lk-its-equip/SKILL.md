---
name: lk-its-equip
description: |
  ITS 현장 시설물·장비 인터랙티브 등록·수정·조회·이동·삭제 — Oracle DB 직접 반영.
  시설물, 장비, 장비 등록, 장비 수정, 장비 이동, 현장, ITS, equipment, facility, register, oracle
user_invocable: true
argument-hint: "[add|modify|list|show|status|move|delete] [장비유형|장비ID]"
---

> Output language: Korean. This English instruction governs Claude's behavior; all user-facing output (reports, generated documents, chat messages) MUST be in Korean.

# /lk-its-equip — ITS Field Equipment Management

Interactively register/edit field equipment and execute directly against the Oracle DB.
Running `/lk-its-equip` with no arguments starts the interactive menu.

## DB Connection Info

Read `${CLAUDE_PLUGIN_ROOT}/resources/db-connection.md` via the Read tool to obtain connection info.

## Equipment Type Mapping

| EQUIP_TYPE_CD | Subtype Table | ID Prefix | Description |
|---------------|---------------|-----------|-------------|
| VDS | VDS_EQUIPMENT | VD | 차량검지기 |
| CCTV | CCTV_EQUIPMENT | CC | CCTV 카메라 |
| VMS | VMS_EQUIPMENT | VM | 전광판 |
| LCS | LCS_EQUIPMENT | LC | 차로제어시스템 |
| FIRE_DETECTOR | TGMS_FIRE_EQUIPMENT | FD | 화재감지기 |
| CLOSED_WALL | TGMS_CLOSED_WALL_EQUIPMENT | CW | 차단벽 |
| VIDS | TGMS_VIDS_EQUIPMENT | VI | 영상유고감지 |
| EMC_PHONE | EPC_EQUIPMENT | EM | 비상전화 |

## Procedure

### No argument → Interactive menu

AskUserQuestion:
```
무엇을 하시겠습니까?
- 새 시설물 등록 (add)
- 기존 시설물 수정 (modify)
- 시설물 목록 (list)
- 시설물 상세 (show)
- 사용 여부 변경 (status)
- 위치 변경 (move)
- 시설물 비활성화 (delete)
```

---

### add action (fully interactive)

**Step 1: Equipment type selection**
AskUserQuestion:
```
장비 유형을 선택하세요:
- VDS (차량검지기)
- CCTV (카메라)
- VMS (전광판)
- LCS (차로제어)
- FIRE_DETECTOR (화재감지기)
- CLOSED_WALL (차단벽)
- VIDS (영상유고감지)
- EMC_PHONE (비상전화)
```

**Step 2: Auto-numbering EQUIP_ID**
Query current max ID from DB:
```python
cursor.execute("""
  SELECT MAX(EQUIP_ID) FROM ITS.COM_EQUIPMENT 
  WHERE EQUIP_TYPE_CD = :type
""", {'type': equip_type})
```
Auto-assign next number. Confirm with user:
```
장비 ID: 0015VD01S (자동 채번)
이 ID를 사용할까요? (사용/직접입력)
```

**Step 3: Common attributes** (AskUserQuestion in sequence)

(1) "장비명을 입력하세요" (required)

(2) "설치 위치를 입력하세요"
AskUserQuestion:
```
위치 정보:
- 위도, 경도 (쉼표 구분, 예: 35.1796, 129.0756)
- 입력하지 않으려면 엔터
```

(3) "설치 이정을 입력하세요 (km, 예: 12.345)"

(4) "설치 방향을 선택하세요"
Query direction codes from DB:
```python
cursor.execute("SELECT ITEM_CD, ITEM_NM FROM ITS.COM_CODE_ITEM WHERE GROUP_CD='DIRECTION' ORDER BY SORT_ORDER")
```
Show as AskUserQuestion list:
```
- HAEUNDAE (해운대 방향)
- GIMHAE (김해 방향)
- HAEUNDAE_BRANCH (해운대 지선)
- GIMHAE_BRANCH (김해 지선)
- 입력하지 않으려면 엔터
```

(5) "IP/포트를 입력하세요 (예: 192.168.1.100:5000, 엔터로 건너뛰기)"

(6) "제조사를 입력하세요 (엔터로 건너뛰기)"

(7) "설치일을 입력하세요 (YYYY-MM-DD, 엔터로 건너뛰기)"

**Step 4: Type-specific attributes**

**VDS:**
- "차로 수" / "루프 수" / "기본 속도 (km/h)"
- "상세 유형을 선택하세요"
  ```python
  cursor.execute("SELECT ITEM_CD, ITEM_NM FROM ITS.COM_CODE_ITEM WHERE GROUP_CD='EQUIP_VDS_TYPE' ORDER BY SORT_ORDER")
  ```

**CCTV:**
- "RTSP URL" / "HLS URL" / "WebRTC URL"
- "상세 유형" (DOME/BOX/PTZ etc.)
- "OSD IP/포트"

**VMS:**
- "모듈 크기" / "가로 모듈 수" / "세로 모듈 수"
- "운영 모드" / "연결 구간 LINK_ID"
- "전원 스케줄 사용 (Y/N)"

**LCS:**
- "사고 대응 여부 (Y/N)" / "웹캠 URL"

**FIRE_DETECTOR/CLOSED_WALL/VIDS:**
- type-specific attributes (based on the subtype table columns in DB)

**EPC:**
- emergency phone–specific attributes

**Step 5: Registration preview**
```
시설물 등록 확인

[공통 정보]
  장비 ID: 0015VD01S
  장비 유형: VDS (차량검지기)
  장비명: 해운대IC VDS
  위치: 35.1796, 129.0756
  이정: 12.345 km
  방향: HAEUNDAE (해운대 방향)
  IP: 192.168.1.100:5000

[VDS 전용]
  차로 수: 4
  루프 수: 2
  기본 속도: 80 km/h
  상세 유형: LOOP

DB에 등록할까요? (등록/수정/취소)
```

**Step 6: DB execute** (simultaneous INSERT into 2 tables)
```python
# 1. COM_EQUIPMENT
cursor.execute("""
  INSERT INTO ITS.COM_EQUIPMENT (
    EQUIP_ID, EQUIP_TYPE_CD, EQUIP_NM, LATITUDE, LONGITUDE,
    INSTALL_MILEAGE, INSTALL_DIRECTION_CD, EQUIP_IP, EQUIP_PORT,
    MANUFACTURER, INSTALL_DT, USE_YN, CREATE_DTM
  ) VALUES (:id, :type, :nm, :lat, :lng, :milg, :dir, :ip, :port, :mfr, :dt, 'Y', SYSTIMESTAMP)
""", params)

# 2. Subtype table
cursor.execute("""
  INSERT INTO ITS.VDS_EQUIPMENT (EQUIP_ID, EQUIP_DETAIL_TYPE_CD, LANE_COUNT, LOOP_COUNT, DEFAULT_SPEED)
  VALUES (:id, :detail, :lane, :loop, :spd)
""", sub_params)

conn.commit()
```

**Step 7: Result**
```
등록 완료!
  장비 ID: 0015VD01S
  COM_EQUIPMENT: 1건 INSERT
  VDS_EQUIPMENT: 1건 INSERT

추가 장비를 등록하시겠습니까? (예/아니오)
```
"예" → loop from Step 1 (skip Step 1 if same type)

---

### modify action (interactive)

**Step 1**: AskUserQuestion — "수정할 장비 ID를 입력하세요"

**Step 2**: Query current data from DB and display:
```python
cursor.execute("""
  SELECT e.*, s.* FROM ITS.COM_EQUIPMENT e
  LEFT JOIN ITS.{sub_table} s ON e.EQUIP_ID = s.EQUIP_ID
  WHERE e.EQUIP_ID = :id
""", {'id': equip_id})
```

**Step 3**: AskUserQuestion (multiSelect):
```
변경할 항목을 선택하세요 (복수 선택 가능):
- 장비명
- 위치 (좌표/이정/방향)
- IP/포트
- 제조사
- 상세 유형
- [장비별 전용 속성]
```

**Step 4**: Collect new values per selected item (interactive)

**Step 5**: UPDATE SQL preview:
```
변경 사항:
  장비명: 해운대IC VDS → 해운대IC 신형 VDS
  차로 수: 4 → 6

DB에 반영할까요? (반영/취소)
```

**Step 6**: DB execute:
```python
cursor.execute("UPDATE ITS.COM_EQUIPMENT SET EQUIP_NM=:nm, UPDATE_DTM=SYSTIMESTAMP WHERE EQUIP_ID=:id", params)
cursor.execute("UPDATE ITS.VDS_EQUIPMENT SET LANE_COUNT=:cnt WHERE EQUIP_ID=:id", sub_params)
conn.commit()
```

---

### list action (interactive)

AskUserQuestion:
```
조회할 장비 유형을 선택하세요:
- 전체 요약 (유형별 건수)
- VDS (차량검지기)
- CCTV (카메라)
- VMS (전광판)
- LCS (차로제어)
- TGMS (터널 장비)
- EPC (비상전화)
- 비활성 포함 (전체)
```

**Overall summary:**
```python
cursor.execute("""
  SELECT EQUIP_TYPE_CD, COUNT(*) total,
         SUM(CASE WHEN USE_YN='Y' THEN 1 ELSE 0 END) active
  FROM ITS.COM_EQUIPMENT GROUP BY EQUIP_TYPE_CD ORDER BY 1
""")
```
```
장비 현황:
| 유형 | 전체 | 활성 | 비활성 |
| VDS | 14 | 14 | 0 |
| CCTV | 79 | 79 | 0 |
| VMS | 22 | 22 | 0 |
...
| 합계 | 369 | 369 | 0 |
```

**Per-type list:**
```
VDS 장비 목록 (14건):
| ID | 장비명 | 방향 | 위치 | 상태 |
| 0001VD01S | 해운대IC VDS | HAEUNDAE | 35.18, 129.08 | 활성 |
...
```

---

### show action

Equipment ID input → display COM_EQUIPMENT + subtype + related history counts.

---

### status action

AskUserQuestion: "장비 ID와 상태를 입력하세요 (예: 0001VD01S N)"
→ `UPDATE ITS.COM_EQUIPMENT SET USE_YN=:yn, UPDATE_DTM=SYSTIMESTAMP WHERE EQUIP_ID=:id`

---

### move action

AskUserQuestion in sequence:
1. "장비 ID"
2. "새 위도, 경도 (쉼표 구분)"
3. "새 이정 (km)"
4. "새 방향 (코드 목록 표시)"

→ run UPDATE

---

### delete action

AskUserQuestion: "비활성화할 장비 ID를 입력하세요"
Confirm: "정말 비활성화하시겠습니까? 이력 데이터는 유지됩니다. (예/아니오)"
→ `UPDATE ITS.COM_EQUIPMENT SET USE_YN='N', UPDATE_DTM=SYSTIMESTAMP WHERE EQUIP_ID=:id`

---

## Auto-validate Code References

On equipment register/modify, auto-verify code values exist in COM_CODE_ITEM:
```python
cursor.execute("SELECT 1 FROM ITS.COM_CODE_ITEM WHERE GROUP_CD=:grp AND ITEM_CD=:cd", {'grp': group, 'cd': value})
if not cursor.fetchone():
    # "'{value}'가 {group} 그룹에 없습니다. /lk-its-code add-item {group}으로 추가하세요."
```

## Skill Linkage

- Missing code value → suggest `/lk-its-code add-item {GROUP}`
- New equipment type needed → chain `/lk-its-code add-group` + `/lk-its-ddl create`
