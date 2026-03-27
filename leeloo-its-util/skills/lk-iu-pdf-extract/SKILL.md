---
name: lk-iu-pdf-extract
description: "설계 도면 PDF에서 시설물·장비 정보를 자동 추출하여 Excel로 정리. /lk-iu-pdf-extract <pdf-path> [--output <dir>] [--pages <range>]"
user_invocable: true
argument-hint: "<pdf-path> [--output <dir>] [--pages <range>]"
---

# /lk-iu-pdf-extract — PDF 도면 시설물 추출

설계 도면 PDF에서 시설물·장비 정보를 자동 추출하여 Excel로 정리하는 범용 스킬.
특정 장비 유형이나 ID 체계에 의존하지 않고, 도면을 먼저 분석하여 패턴을 스스로 발견한 뒤 전체 페이지에 적용한다.

## 사용 예시

```
/lk-iu-pdf-extract CM-001_통신관로_평면도.pdf
/lk-iu-pdf-extract 전력배선평면도.pdf --output 수정본/
/lk-iu-pdf-extract 도면.pdf --pages 3-7
```

## 핵심 설계 원칙

> **하드코딩 금지**: 장비 유형, ID 접두사, 텍스트 박스 레이아웃 등을 코드에 고정하지 않는다.
> 모든 패턴은 Phase 1(탐색)에서 실제 도면을 분석하여 자동 발견한다.
> 현장·프로젝트·도면 형식이 달라도 동일 스킬로 대응 가능해야 한다.

---

## Procedure

### 인자 파싱

사용자 입력에서 PDF 경로와 옵션을 파싱한다:
- `<pdf-path>` → 필수. PDF 파일 경로
- `--output <dir>` → 선택. 출력 폴더 (기본: PDF와 같은 위치)
- `--pages <range>` → 선택. 처리할 페이지 범위 (예: "3-7", "1,3,5-10")

PDF 경로가 없으면:
```
사용법: /lk-iu-pdf-extract <pdf-path> [--output <dir>] [--pages <range>]
예: /lk-iu-pdf-extract CM-001_평면도.pdf
    /lk-iu-pdf-extract 도면.pdf --pages 3-7
    /lk-iu-pdf-extract 도면.pdf --output 결과/
```
출력 후 중단.

---

### Phase 0: 환경 준비

> **기존 스킬 활용 필수**: PDF 읽기·처리는 반드시 `pdf` 스킬(SKILL.md)을, Excel 생성은 반드시 `xlsx` 스킬(SKILL.md)을 먼저 읽고 그 지침을 따른다.

1. **환경 점검**: Bash 도구로 `${CLAUDE_PLUGIN_ROOT}/scripts/check-env.sh` 실행.
   - 실패 항목이 있으면 `--fix` 옵션으로 재실행하여 자동 설치 시도.
   - 자동 설치 후에도 실패하면 사용자에게 누락 항목을 안내하고 중단.
2. **pdf 스킬 SKILL.md 읽기**: Read 도구로 `.claude/skills/pdf/SKILL.md` 읽기 → PDF 처리 방법 확인.
3. **xlsx 스킬 SKILL.md 읽기**: Read 도구로 `.claude/skills/xlsx/SKILL.md` 읽기 → Excel 생성 방법 확인.
4. **입력 파일 확인**: PDF 파일 존재 여부 검증.
5. **출력 폴더 확인**: `--output` 지정 시 해당 폴더, 미지정 시 PDF와 같은 디렉토리.
6. **총 페이지 수 확인**: pypdf로 페이지 수 확인.
   ```python
   from pypdf import PdfReader
   reader = PdfReader(pdf_path)
   total_pages = len(reader.pages)
   ```
7. **텍스트 추출 방식 판별** (pdf 스킬 지침 참고):
   - pdfplumber로 첫 2~3페이지 텍스트 추출 시도
   - 텍스트가 추출되면 → **텍스트 모드** (빠름)
   - 텍스트가 없거나 극히 적으면 → **OCR 모드** (CAD 벡터 도면)
8. **OCR 모드인 경우 환경 설정**:
   - `/tmp/tessdata` 디렉토리 생성
   - `eng.traineddata` 복사
   - `kor.traineddata` 없으면 다운로드: `https://github.com/tesseract-ocr/tessdata/raw/main/kor.traineddata`
   - `TESSDATA_PREFIX` 환경변수 설정
9. **OCR 불가 시 대체 모드 (이미지 모드)**:
   - tesseract 미설치 또는 OCR 실패 시 → **이미지 모드**로 전환
   - 각 페이지를 이미지(PNG)로 변환하여 Claude의 비전(Vision) 기능으로 직접 분석
   - 이미지 모드에서도 SubAgent에 동일한 권한이 필요:
     · **Read**: PDF 파일 및 변환된 이미지 파일 읽기
     · **Bash**: pdf2image로 페이지→이미지 변환 스크립트 실행
     · **Write**: JSON 결과 파일 저장
   - 이미지 모드 SubAgent도 `mode: "bypassPermissions"` 적용

환경 준비 완료 후 요약 출력:
```
## 환경 준비 완료

- PDF: {파일명} ({total_pages}페이지)
- 추출 모드: {텍스트 모드 / OCR 모드}
- 출력 폴더: {출력 경로}
- 처리 범위: {전체 / 지정 페이지}
```

---

### Phase 1: 탐색 (패턴 발견) — 가장 중요한 단계

**목적**: 이 도면에서 사용되는 장비 유형, ID 체계, 텍스트 배치 형태를 자동으로 파악한다.

#### 1-1. 샘플 페이지 선정
- 전체 페이지 중 앞(1~2p), 중간(1p), 뒤(1p) 총 3~4페이지를 샘플로 선택
- 각 샘플을 이미지로 변환(DPI=300)하여 OCR 수행
  ```python
  from pdf2image import convert_from_path
  images = convert_from_path(pdf_path, first_page=p, last_page=p, dpi=300)
  ```

#### 1-2. 원시 텍스트 분석

샘플 OCR 결과에서 아래 항목을 자동 탐지:

**A. 도면 구간 형식 발견**
```
- "STA.0+000 ~ STA.0+800" 같은 구간 표기가 있는지
- "NO.xx+xx.xx" 같은 측점 표기가 있는지
- 페이지 제목에 "[1]", "[2]" 같은 도엽 번호가 있는지
- 기타 위치 참조 형식 (KP, km, 측점 등)
```

**B. 시설물 정보 블록 구조 발견**
```
- OCR 텍스트에서 반복되는 구조적 패턴을 찾는다
- 예시 패턴들 (이 중 어떤 것이든 될 수 있음):
  · "명칭 + ID코드" 가 2~3줄 연속 반복
  · "장비유형 #번호(위치설명)" 형태
  · 테이블/표 형태로 정리된 목록
  · 범례(Legend) 영역에 일괄 기재
- 핵심: 어떤 형식이든 "반복 구조"를 찾아내는 것
```

**C. 장비 유형 키워드 발견**
```
- OCR 텍스트에서 자주 등장하는 영문 약어 추출 (대문자 2~5자)
- 한글 장비명 추출 (예: CCTV, 비상전화, 전광판, 검지기 등)
- 발견된 키워드 목록을 구성 → 이후 파싱에 사용
- ※ 사전 정의된 목록에 의존하지 않음
```

**D. ID 코드 체계 발견**
```
- 영문+숫자 조합의 코드 패턴을 수집
- 접두사 유형 분류 (예: CTS, HPS, VDS 등 → 현장마다 다름)
- 접두사-장비유형 매핑 추론 (같은 블록에 등장하는 장비명과 ID를 연결)
- ID 자릿수 패턴 파악 (접두사 길이 + 숫자 길이)
- 방향 구분 규칙 추론 (접두사 끝자리 S/N, 또는 별도 표기 등)
```

**E. 방향·위치 구분 체계 발견**
```
- 상행/하행, 좌/우, 터널/본선, 진입/진출 등의 방향 키워드 탐지
- ID 코드 내 방향 구분자 존재 여부 확인
- 도면 레이아웃 상 상하 분리 여부 확인
```

#### 1-3. 발견 결과 정리

탐색 결과를 아래 형태로 정리하여 Phase 2에 전달:
```json
{
  "text_mode": "ocr 또는 text",
  "section_format": "STA 구간 형식 설명",
  "facility_keywords": ["발견된 장비 유형 키워드 목록"],
  "id_patterns": [
    {"prefix": "CTS", "digits": 5, "mapped_type": "CCTV", "direction": "상행"}
  ],
  "block_structure": "시설물 블록의 텍스트 배치 패턴 설명",
  "direction_system": "방향 구분 체계 설명",
  "location_format": "위치 표기 형식 (STA, KP 등)",
  "confidence_notes": "탐색 중 불확실했던 사항"
}
```

#### 1-4. 사용자 확인

발견된 패턴을 사용자에게 요약 보고:
```
## Phase 1 탐색 결과

### 추출 모드
{텍스트 / OCR}

### 발견된 장비 유형 ({N}종)
{키워드 목록 — 테이블}

### ID 코드 체계
{접두사-유형 매핑 테이블}

### 도면 구간 형식
{STA, KP 등 형식 설명}

### 방향 체계
{상행/하행 등 구분 방식}

### 불확실 사항
{confidence_notes}
```

AskUserQuestion — "이 패턴으로 전체 처리를 진행할까요? (진행/수정)"
- "수정" 선택 시: 사용자 피드백 반영 후 패턴 정보 갱신
- "진행" 선택 시: Phase 2로 이동

---

### Phase 2: 페이지별 추출 (SubAgent 병렬)

Phase 1에서 발견한 패턴 정보를 각 SubAgent에 전달한다.

#### 2-1. 그룹 분할
- 총 페이지를 4~5개 그룹으로 나눔
- 예: 20페이지 → [1-4], [5-9], [10-14], [15-20]

#### 2-2. SubAgent 병렬 발생

Agent 도구로 각 그룹마다 SubAgent를 병렬 실행한다.

**SubAgent 권한 설정 (모든 모드 공통):**
- `mode`: `"bypassPermissions"` — 아래 작업을 사용자 확인 없이 수행해야 하므로 권한 우회 필수.
  - **Read**: PDF 원본 파일, 변환된 이미지 파일 읽기
  - **Bash**: Python 스크립트 실행 (pdf2image, pdfplumber, pytesseract, openpyxl)
  - **Write**: JSON 결과 파일 저장 (/tmp/)

각 SubAgent에 전달할 정보:
- PDF 파일 경로
- 담당 페이지 범위
- Phase 1 발견 패턴 JSON (전체)
- 추출 모드: `text` / `ocr` / `image` (3가지 중 하나)
- OCR 모드인 경우 TESSDATA_PREFIX 경로
- 결과 저장 경로: `/tmp/facility_result_p{시작}-{끝}.json`

각 SubAgent가 담당 페이지에 대해 수행할 작업:

**텍스트 모드** (pdfplumber 텍스트 추출 가능):
1. pdfplumber로 텍스트 추출
2. Phase 1 패턴 기반 시설물 파싱
3. 결과를 JSON 파일로 저장

**OCR 모드** (tesseract 사용 가능):
1. 이미지 변환 (DPI=300)
2. pytesseract로 OCR 텍스트 추출
3. Phase 1 패턴 기반 시설물 파싱
4. 결과를 JSON 파일로 저장

**이미지 모드** (tesseract 미설치 또는 OCR 실패):
1. pdf2image로 페이지를 PNG 이미지로 변환 (DPI=300)
2. 이미지를 `/tmp/facility_page_{N}.png`로 저장
3. Read 도구로 이미지 파일을 읽어 Claude Vision으로 직접 분석
4. Vision 결과에서 Phase 1 패턴 기반 시설물 파싱
5. 결과를 JSON 파일로 저장

#### SubAgent 파싱 로직

```
각 페이지에 대해:
1. 도면 구간(STA 범위 등) 추출
2. 발견된 facility_keywords로 시설물 텍스트 블록 위치 식별
3. 각 블록에서:
   - 장비 유형 (한글명 또는 영문 약어)
   - 명칭 (번호, 위치설명 포함한 전체 표기)
   - ID 코드 (발견된 id_patterns와 매칭)
   - 설치 위치 (STA, KP 등)
   - 방향 (발견된 direction_system 기준)
4. 신뢰도 판별 → 비고란 "확인 필요" 여부 결정
```

#### 신뢰도 판별 기준

아래 조건에 해당하면 비고란에 "확인 필요" 표기:
- ID 코드가 Phase 1에서 발견한 자릿수 패턴과 불일치
- 장비 유형 키워드를 인식했지만 매칭되는 ID를 찾지 못한 경우
- ID를 인식했지만 매칭되는 장비 유형을 찾지 못한 경우
- OCR 결과에 깨진 문자 포함 (자음만 있는 한글, 의미없는 특수문자 등)
- 동일 위치에 동일 유형 시설물이 2개 이상 중복 감지
- Phase 1에서 발견하지 못한 새로운 ID 접두사가 등장한 경우

#### SubAgent 결과 JSON 형식

```json
{
  "pages": [
    {
      "page": 3,
      "section": "STA.0+000 ~ STA.0+400",
      "facilities": [
        {
          "type": "CCTV",
          "name": "CCTV #12(터널입구)",
          "id": "CTS00012",
          "location": "STA.0+120",
          "direction": "상행",
          "note": ""
        }
      ]
    }
  ],
  "new_patterns": ["Phase 1에서 미발견된 새 패턴"],
  "error_pages": []
}
```

---

### Phase 3: 통합 및 Excel 생성

> **xlsx 스킬 지침을 반드시 따를 것** — 서식, 수식, recalc 등 xlsx SKILL.md의 모든 규칙 적용.

#### 3-1. 결과 수집 및 정리
1. 모든 SubAgent JSON 결과 파일 수집 (`/tmp/facility_result_p*.json`)
2. 페이지 순서대로 정렬
3. 중복 제거 (페이지 경계에서 동일 시설물이 두 번 잡힐 수 있음)
   - 동일 ID + 동일 유형 → 먼저 등장한 것 유지
4. 순번(No.) 재할당

#### 3-2. Excel 파일 생성 (openpyxl)

xlsx 스킬 지침에 따라 Excel 파일을 생성한다. 수식이 있으면 recalc.py 실행.

출력 파일명: `{입력파일명}_시설물목록.xlsx`

**시트1: "시설물 목록"**

| 열 | 내용 | 너비 |
|----|------|------|
| A | No. | 6 |
| B | 페이지 | 8 |
| C | 도면 구간 | 25 |
| D | 시설물 유형 | 15 |
| E | 명칭 | 30 |
| F | ID | 18 |
| G | 설치 위치 | 15 |
| H | 방향 | 12 |
| I | 비고 | 25 |

**시트2: "요약"**
- 방향별 x 시설물 유형별 수량 집계 피벗 테이블
- 전체 추출 건수, "확인 필요" 건수 표시

**시트3: "발견 패턴"**
- Phase 1에서 탐지한 ID 체계, 장비 유형, 방향 규칙 등 기록
- 사용자가 다음 작업 시 참고할 수 있도록 문서화

**서식:**
- 헤더: 진한 파랑 배경(`003366`) + 흰색 볼드 글자, Arial 10pt
- 데이터: Arial 9pt, 얇은 테두리 적용
- "확인 필요" 포함 셀: 노란 배경(`FFFF00`)
- 방향별 행 배경색: 서로 다른 연한 색상으로 구분 (발견된 방향 수에 따라 동적 할당)
- 자동 필터 적용
- 첫 행 고정(틀 고정)

---

### Phase 4: 검증

추출 완료 후 검증 결과를 출력한다:

```
## 추출 완료

### 결과 파일
{출력 파일 경로}

### 추출 통계
- 총 추출 건수: {N}건
- 시설물 유형: {M}종
- "확인 필요" 건수: {K}건

### 페이지별 요약
| 페이지 | 구간 | 시설물 수 |
|--------|------|----------|
| 1 | STA.0+000~0+400 | 12 |
| ... | ... | ... |

### "확인 필요" 사유 분류
| 사유 | 건수 |
|------|------|
| ID 자릿수 불일치 | 3 |
| 장비-ID 미매칭 | 2 |
| OCR 깨짐 | 1 |

### 경고
- {시설물 0건인 페이지 목록 (표지·범례 제외)}

### 새로 발견된 패턴
- {Phase 2에서 새로 나타난 ID 접두사나 장비 유형}
```

---

## 의존성

### 필수 스킬 (실행 전 반드시 SKILL.md를 읽을 것)
- **pdf 스킬**: `.claude/skills/pdf/SKILL.md` — PDF 읽기, 분할, 텍스트/테이블 추출, OCR
- **xlsx 스킬**: `.claude/skills/xlsx/SKILL.md` — Excel 생성, 서식, 수식, recalc

### Python 패키지
- pypdf, pdf2image, pytesseract, pdfplumber, openpyxl, Pillow

### 시스템
- tesseract-ocr, poppler-utils
- Tesseract data: eng.traineddata, kor.traineddata (한글 도면인 경우)

## 중요 주의사항

1. **CAD 벡터 도면 판별**: pdfplumber로 텍스트가 안 나오면 무조건 OCR 모드. 이미지 변환 후 OCR 필수.
2. **패턴 발견이 핵심**: Phase 1을 충분히 수행해야 Phase 2 정확도가 올라감. 샘플을 3~4페이지 이상 확인할 것.
3. **OCR 한계 인정**: 정확도 85~90%. 불확실한 항목은 반드시 "확인 필요"로 표기하여 사용자가 수동 검수할 수 있게 한다.
4. **SubAgent 환경 전달**: 병렬 처리 시 각 Agent에 OCR 환경설정(TESSDATA_PREFIX)과 Phase 1 발견 패턴을 모두 전달해야 한다.
5. **새 패턴 대응**: Phase 2 도중 Phase 1에서 못 본 패턴이 나타나면 무시하지 말고 "확인 필요"로 수집하여 Phase 4에서 보고한다.
