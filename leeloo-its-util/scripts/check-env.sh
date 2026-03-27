#!/usr/bin/env bash
# leeloo-its-util 환경 사전 점검 스크립트
# Usage: bash check-env.sh [--fix]
#   --fix: 누락된 의존성 자동 설치 시도

set -euo pipefail

FIX_MODE=false
[[ "${1:-}" == "--fix" ]] && FIX_MODE=true

PASS=0
FAIL=0
WARN=0

ok()   { echo "  [OK]   $1"; ((PASS++)); }
fail() { echo "  [FAIL] $1"; ((FAIL++)); }
warn() { echo "  [WARN] $1"; ((WARN++)); }

echo "=== leeloo-its-util 환경 점검 ==="
echo ""

# --- 1. 시스템 도구 ---
echo "## 시스템 도구"

# tesseract
if command -v tesseract &>/dev/null; then
  VER=$(tesseract --version 2>&1 | head -1)
  ok "tesseract-ocr ($VER)"
else
  fail "tesseract-ocr 미설치"
  if $FIX_MODE; then
    echo "       → 설치 시도: brew install tesseract"
    brew install tesseract && ok "tesseract-ocr 설치 완료" || fail "tesseract-ocr 설치 실패"
  fi
fi

# poppler (pdftoppm)
if command -v pdftoppm &>/dev/null; then
  ok "poppler-utils (pdftoppm)"
else
  fail "poppler-utils 미설치 (pdftoppm 없음)"
  if $FIX_MODE; then
    echo "       → 설치 시도: brew install poppler"
    brew install poppler && ok "poppler 설치 완료" || fail "poppler 설치 실패"
  fi
fi

echo ""

# --- 2. Python 패키지 ---
echo "## Python 패키지"

PACKAGES=(pypdf pdfplumber pdf2image pytesseract openpyxl Pillow)
MISSING_PKGS=()

for pkg in "${PACKAGES[@]}"; do
  # Pillow는 import 이름이 PIL
  import_name="$pkg"
  [[ "$pkg" == "Pillow" ]] && import_name="PIL"

  if python3 -c "import $import_name" 2>/dev/null; then
    ok "$pkg"
  else
    fail "$pkg 미설치"
    MISSING_PKGS+=("$pkg")
  fi
done

if $FIX_MODE && [[ ${#MISSING_PKGS[@]} -gt 0 ]]; then
  echo ""
  echo "       → pip install 시도: ${MISSING_PKGS[*]}"
  pip install "${MISSING_PKGS[@]}" && ok "Python 패키지 설치 완료" || fail "일부 패키지 설치 실패"
fi

echo ""

# --- 3. Tesseract 학습 데이터 ---
echo "## Tesseract 학습 데이터"

# tessdata 경로 탐색
TESSDATA_DIR=""
if [[ -n "${TESSDATA_PREFIX:-}" ]] && [[ -d "$TESSDATA_PREFIX" ]]; then
  TESSDATA_DIR="$TESSDATA_PREFIX"
elif command -v tesseract &>/dev/null; then
  # tesseract --print-parameters로 datapath 추출
  CANDIDATE=$(tesseract --print-parameters 2>/dev/null | grep "tessdata" | head -1 | awk '{print $2}' 2>/dev/null || true)
  if [[ -n "$CANDIDATE" ]] && [[ -d "$CANDIDATE" ]]; then
    TESSDATA_DIR="$CANDIDATE"
  fi
  # brew 기본 경로 시도
  if [[ -z "$TESSDATA_DIR" ]]; then
    for d in /opt/homebrew/share/tessdata /usr/local/share/tessdata /usr/share/tesseract-ocr/*/tessdata /usr/share/tessdata; do
      [[ -d "$d" ]] && TESSDATA_DIR="$d" && break
    done
  fi
fi

if [[ -z "$TESSDATA_DIR" ]]; then
  warn "tessdata 디렉토리를 찾을 수 없음 (tesseract 미설치이거나 비표준 경로)"
else
  echo "  경로: $TESSDATA_DIR"

  # eng
  if [[ -f "$TESSDATA_DIR/eng.traineddata" ]]; then
    ok "eng.traineddata"
  else
    fail "eng.traineddata 없음"
  fi

  # kor
  if [[ -f "$TESSDATA_DIR/kor.traineddata" ]]; then
    ok "kor.traineddata"
  else
    warn "kor.traineddata 없음 (한글 도면 OCR 시 필요)"
    if $FIX_MODE; then
      echo "       → 다운로드 시도..."
      curl -fsSL -o "$TESSDATA_DIR/kor.traineddata" \
        "https://github.com/tesseract-ocr/tessdata/raw/main/kor.traineddata" \
        && ok "kor.traineddata 다운로드 완료" \
        || fail "kor.traineddata 다운로드 실패"
    fi
  fi
fi

echo ""

# --- 결과 요약 ---
echo "=== 점검 결과 ==="
echo "  통과: $PASS  |  실패: $FAIL  |  경고: $WARN"

if [[ $FAIL -gt 0 ]]; then
  echo ""
  echo "  실패 항목이 있습니다. --fix 옵션으로 자동 설치를 시도하세요:"
  echo "  bash check-env.sh --fix"
  exit 1
else
  echo ""
  echo "  환경 준비 완료. /lk-iu-pdf-extract 를 사용할 수 있습니다."
  exit 0
fi
