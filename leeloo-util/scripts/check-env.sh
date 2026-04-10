#!/usr/bin/env bash
# leeloo-util 환경 사전 점검 스크립트
# Usage: bash check-env.sh [--fix]
#   --fix: 누락된 의존성 자동 설치 시도
#
# 비전 모드 기반: tesseract 불필요, poppler(pdf2image)만 필수

set -euo pipefail

FIX_MODE=false
[[ "${1:-}" == "--fix" ]] && FIX_MODE=true

PASS=0
FAIL=0
WARN=0

ok()   { echo "  [OK]   $1"; ((PASS++)); }
fail() { echo "  [FAIL] $1"; ((FAIL++)); }
warn() { echo "  [WARN] $1"; ((WARN++)); }

echo "=== leeloo-util 환경 점검 ==="
echo ""

# --- 1. 시스템 도구 ---
echo "## 시스템 도구"

# poppler (pdftoppm) — 필수: PDF → 이미지 변환
if command -v pdftoppm &>/dev/null; then
  ok "poppler-utils (pdftoppm)"
else
  fail "poppler-utils 미설치 (pdftoppm 없음) — PDF → 이미지 변환에 필수"
  if $FIX_MODE; then
    echo "       → 설치 시도: brew install poppler"
    brew install poppler && ok "poppler 설치 완료" || fail "poppler 설치 실패"
  fi
fi

# python3
if command -v python3 &>/dev/null; then
  VER=$(python3 --version 2>&1)
  ok "python3 ($VER)"
else
  fail "python3 미설치"
fi

echo ""

# --- 2. Python 패키지 ---
echo "## Python 패키지"

# pytesseract 제외 — Claude Vision으로 대체
PACKAGES=(pypdf pdfplumber pdf2image openpyxl Pillow)
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

# --- 3. kordoc (한국 공문서 파서) ---
echo "## kordoc (HWP/HWPX/PDF → 마크다운)"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"

# node_modules에 kordoc가 설치되어 있는지 확인
if [[ -d "$PLUGIN_DIR/node_modules/kordoc" ]]; then
  KORDOC_VER=$(node -e "console.log(require('$PLUGIN_DIR/node_modules/kordoc/package.json').version)" 2>/dev/null || echo "unknown")
  ok "kordoc ($KORDOC_VER) — 로컬 설치"
else
  fail "kordoc 미설치 (node_modules/kordoc 없음)"
  if $FIX_MODE; then
    echo "       → 설치 시도: cd $PLUGIN_DIR && npm install"
    (cd "$PLUGIN_DIR" && npm install) && ok "kordoc 설치 완료" || fail "kordoc 설치 실패"
  fi
fi

# Node.js >= 18 확인
if command -v node &>/dev/null; then
  NODE_VER=$(node -v | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
  if [[ "$NODE_MAJOR" -ge 18 ]]; then
    ok "Node.js (v$NODE_VER)"
  else
    fail "Node.js v$NODE_VER — kordoc는 v18 이상 필요"
  fi
else
  fail "Node.js 미설치 — kordoc 실행에 필요"
fi

echo ""

# --- 4. 참고 사항 ---
echo "## 참고"
echo "  - tesseract-ocr: 불필요 (Claude Vision이 도면을 직접 분석)"
echo "  - pytesseract: 불필요 (CAD 도면 정확도 낮아 제외)"
echo "  - 비전 모드: PDF → PNG 변환 후 Claude가 이미지를 직접 판독"

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
  echo "  환경 준비 완료. /lk-doc-pdf-extract, /lk-doc-parse, /lk-doc-compare, /lk-doc-form 을 사용할 수 있습니다."
  exit 0
fi
