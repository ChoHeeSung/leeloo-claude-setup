#!/bin/bash
# =============================================================================
# Leeloo Claude Code 환경 자동 설정 스크립트
# SessionStart 훅에서 호출됨. 멱등성 보장 (마커 파일로 중복 실행 방지).
# =============================================================================

CLAUDE_DIR="$HOME/.claude"
MARKER_FILE="$CLAUDE_DIR/.leeloo-setup-done"
PLUGIN_ROOT="$(cd "$(dirname "$0")" && pwd)"
RESOURCES="$PLUGIN_ROOT/resources"

# ---------------------------------------------------------------------------
# OS 감지
# ---------------------------------------------------------------------------
OS_TYPE="$(uname -s)"

# ---------------------------------------------------------------------------
# 마커 확인: 이미 설정 완료면 즉시 종료
# ---------------------------------------------------------------------------
if [ -f "$MARKER_FILE" ]; then
    exit 0
fi

# ---------------------------------------------------------------------------
# jq 필수 확인
# ---------------------------------------------------------------------------
if ! command -v jq &> /dev/null; then
    if [ "$OS_TYPE" = "Darwin" ]; then
        echo "[leeloo-setup] jq가 필요합니다. brew install jq 로 설치해주세요." >&2
    else
        echo "[leeloo-setup] jq가 필요합니다. sudo apt install jq 로 설치해주세요." >&2
    fi
    exit 1
fi

echo "[leeloo-setup] 사내 표준 환경 설정을 시작합니다..."

# ---------------------------------------------------------------------------
# Step 1: 디렉토리 구조 생성
# ---------------------------------------------------------------------------
mkdir -p "$CLAUDE_DIR"

# ---------------------------------------------------------------------------
# Step 2: settings.json 머지 (기존 설정 보존 + 사내 설정 추가)
# ---------------------------------------------------------------------------
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
TEMPLATE="$RESOURCES/settings-template.json"

# 템플릿 플레이스홀더 치환: __HOME__ (sed), 알림 훅 주입 (jq)
if [ "$OS_TYPE" = "Darwin" ]; then
    NOTIFY_STOP="osascript -e 'display notification \"작업이 완료되었습니다\" with title \"Claude Code\" sound name \"Glass\"'"
    NOTIFY_INPUT="osascript -e 'display notification \"사용자 입력을 기다리고 있습니다\" with title \"Claude Code\" sound name \"Ping\"'"
else
    NOTIFY_STOP="notify-send -a 'Claude Code' '작업 완료' '작업이 완료되었습니다' 2>/dev/null || true"
    NOTIFY_INPUT="notify-send -a 'Claude Code' '입력 대기' '사용자 입력을 기다리고 있습니다' 2>/dev/null || true"
fi

# __HOME__만 sed로 치환 (안전한 경로 문자열)
TEMPLATE_RESOLVED=$(sed "s|__HOME__|$HOME|g" "$TEMPLATE")

# 알림 훅은 jq로 안전하게 주입 (특수문자 이스케이프 불필요)
TEMPLATE_RESOLVED=$(echo "$TEMPLATE_RESOLVED" | jq \
    --arg stop_cmd "$NOTIFY_STOP" \
    --arg input_cmd "$NOTIFY_INPUT" \
    '.hooks = {
        "Stop": [{"hooks": [{"type": "command", "command": $stop_cmd}]}],
        "Notification": [{"hooks": [{"type": "command", "command": $input_cmd}]}]
    }')

if [ -f "$SETTINGS_FILE" ]; then
    # 기존 설정이 있으면 딥 머지 (템플릿 값이 기존 값 위에 덮어씀)
    MERGED=$(jq -s '.[0] * .[1]' "$SETTINGS_FILE" <(echo "$TEMPLATE_RESOLVED"))
    echo "$MERGED" > "$SETTINGS_FILE"
    echo "[leeloo-setup] settings.json 머지 완료 (기존 설정 보존)"
else
    echo "$TEMPLATE_RESOLVED" > "$SETTINGS_FILE"
    echo "[leeloo-setup] settings.json 신규 생성"
fi

# ---------------------------------------------------------------------------
# Step 3: settings.local.json (없을 때만 생성)
# ---------------------------------------------------------------------------
LOCAL_SETTINGS="$CLAUDE_DIR/settings.local.json"
if [ ! -f "$LOCAL_SETTINGS" ]; then
    cp "$RESOURCES/settings.local.json" "$LOCAL_SETTINGS"
    echo "[leeloo-setup] settings.local.json 생성"
else
    echo "[leeloo-setup] settings.local.json 이미 존재 (스킵)"
fi

# ---------------------------------------------------------------------------
# Step 4: 상태바 스크립트 설치
# ---------------------------------------------------------------------------
cp "$RESOURCES/statusline-leeloo.sh" "$CLAUDE_DIR/statusline-leeloo.sh"
chmod +x "$CLAUDE_DIR/statusline-leeloo.sh"
echo "[leeloo-setup] statusline-leeloo.sh 설치 완료"

# ---------------------------------------------------------------------------
# Step 5: gemini-cli 설치 (없을 때만)
# ---------------------------------------------------------------------------
# Node.js >= 20 필요 (gemini-cli 요구사항)
NODE_MIN_VERSION=20
NEED_NODE_INSTALL=false

if ! command -v node &> /dev/null; then
    NEED_NODE_INSTALL=true
else
    NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
    if [ "$NODE_MAJOR" -lt "$NODE_MIN_VERSION" ] 2>/dev/null; then
        echo "[leeloo-setup] Node.js v${NODE_MAJOR} 감지. gemini-cli는 v${NODE_MIN_VERSION}+ 필요. 업그레이드 중..."
        NEED_NODE_INSTALL=true
    fi
fi

if [ "$NEED_NODE_INSTALL" = true ]; then
    echo "[leeloo-setup] Node.js ${NODE_MIN_VERSION} 설치 중..."
    if [ "$OS_TYPE" = "Darwin" ]; then
        if command -v brew &> /dev/null; then
            brew install node 2>/dev/null || echo "[leeloo-setup] Node.js 자동 설치 실패. brew install node 로 수동 설치해주세요." >&2
        else
            echo "[leeloo-setup] Homebrew가 없어 Node.js를 설치할 수 없습니다." >&2
        fi
    else
        if command -v sudo &> /dev/null && command -v curl &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_${NODE_MIN_VERSION}.x | sudo -E bash - 2>/dev/null \
                && sudo apt install -y nodejs 2>/dev/null \
                || echo "[leeloo-setup] Node.js ${NODE_MIN_VERSION} 자동 설치 실패. 수동 설치: https://nodejs.org/" >&2
        else
            echo "[leeloo-setup] sudo 또는 curl이 없어 Node.js를 설치할 수 없습니다." >&2
        fi
    fi
fi

# gemini-cli 설치
if ! command -v gemini &> /dev/null; then
    if command -v npm &> /dev/null; then
        echo "[leeloo-setup] gemini-cli 설치 중..."
        sudo npm install -g @google/gemini-cli 2>/dev/null \
            || npm install -g @google/gemini-cli 2>/dev/null \
            || echo "[leeloo-setup] gemini-cli 자동 설치 실패. 수동 설치: https://github.com/google-gemini/gemini-cli" >&2
        if command -v gemini &> /dev/null; then
            echo "[leeloo-setup] gemini-cli 설치 완료"
        fi
    else
        echo "[leeloo-setup] npm이 없어 gemini-cli를 설치할 수 없습니다." >&2
    fi
else
    echo "[leeloo-setup] gemini-cli 이미 설치됨 (스킵)"
fi

# ---------------------------------------------------------------------------
# Step 6: 글로벌 CLAUDE.md 배포 (없을 때만)

# ---------------------------------------------------------------------------
if [ ! -f "$CLAUDE_DIR/CLAUDE.md" ]; then
    cp "$RESOURCES/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
    echo "[leeloo-setup] 글로벌 CLAUDE.md 생성"
else
    echo "[leeloo-setup] 글로벌 CLAUDE.md 이미 존재 (스킵)"
fi

# ---------------------------------------------------------------------------
# Step 7: 마커 파일 생성
# ---------------------------------------------------------------------------
echo "installed=$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$MARKER_FILE"

echo "[leeloo-setup] 사내 표준 환경 설정 완료! Claude Code를 재시작하면 모든 설정이 적용됩니다."
