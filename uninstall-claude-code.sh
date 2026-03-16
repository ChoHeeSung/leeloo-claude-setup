#!/bin/bash
# =============================================================================
# Leeloo Claude Code 환경 제거 스크립트
# 백업에서 원래 파일 복원, 설치가 새로 만든 파일 삭제, 마커 정리.
# 멱등성 보장 (여러 번 실행해도 안전).
# 참고: gemini-cli, Node.js 등 시스템 패키지는 제거하지 않음.
# =============================================================================

CLAUDE_DIR="$HOME/.claude"
MARKER_FILE="$CLAUDE_DIR/.leeloo-setup-done"
BACKUP_DIR="$CLAUDE_DIR/.leeloo-backup"

MANAGED_FILES="settings.json settings.local.json statusline-leeloo.sh CLAUDE.md"

echo "[leeloo-uninstall] 사내 표준 환경 제거를 시작합니다..."

# ---------------------------------------------------------------------------
# Step 1: 백업에서 복원 또는 삭제
# ---------------------------------------------------------------------------
for f in $MANAGED_FILES; do
    if [ -f "$BACKUP_DIR/$f" ]; then
        # 백업이 있으면 복원 (설치 전 상태로 되돌림)
        cp "$BACKUP_DIR/$f" "$CLAUDE_DIR/$f"
        echo "[leeloo-uninstall] 복원: $f (백업에서)"
    elif [ -f "$CLAUDE_DIR/$f" ]; then
        # 백업이 없으면 설치가 새로 만든 파일 → 삭제
        rm -f "$CLAUDE_DIR/$f"
        echo "[leeloo-uninstall] 삭제: $f (설치가 생성한 파일)"
    fi
done

# ---------------------------------------------------------------------------
# Step 2: 마커 파일 삭제
# ---------------------------------------------------------------------------
if [ -f "$MARKER_FILE" ]; then
    rm -f "$MARKER_FILE"
    echo "[leeloo-uninstall] 마커 파일 삭제"
fi

# ---------------------------------------------------------------------------
# Step 3: 백업 디렉토리 정리
# ---------------------------------------------------------------------------
if [ -d "$BACKUP_DIR" ]; then
    rm -rf "$BACKUP_DIR"
    echo "[leeloo-uninstall] 백업 디렉토리 정리"
fi

echo "[leeloo-uninstall] 제거 완료! Claude Code를 재시작하면 원래 설정이 적용됩니다."
