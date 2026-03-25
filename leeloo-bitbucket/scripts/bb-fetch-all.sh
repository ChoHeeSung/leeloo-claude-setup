#!/bin/bash
# bb-fetch-all.sh — Bitbucket API 병렬 페이지네이션 유틸리티
#
# 사용법:
#   bb-fetch-all.sh <endpoint> [옵션]
#
# 옵션:
#   --pagelen <N>        페이지당 항목 수 (기본: 100, 최대: 100)
#   --max-parallel <N>   동시 요청 수 제한 (기본: 5)
#   --jq-filter <expr>   각 항목에 적용할 jq 필터 (기본: '.')
#   --query <params>     추가 쿼리 파라미터 (예: "state=OPEN&role=MEMBER")
#
# 예시:
#   bb-fetch-all.sh "/repositories/myworkspace" --jq-filter '{name, slug}'
#   bb-fetch-all.sh "/repositories/myworkspace/myrepo/pullrequests" --query "state=OPEN" --max-parallel 3
#
# 환경변수 필요:
#   BITBUCKET_API_TOKEN   — Bearer 토큰
#
# 출력: JSON 배열 (모든 페이지 결과 병합)

set -euo pipefail

BASE_URL="https://api.bitbucket.org/2.0"
ENDPOINT=""
PAGELEN=100
MAX_PARALLEL=5
JQ_FILTER="."
EXTRA_QUERY=""

# --- 인자 파싱 ---
if [[ $# -lt 1 ]]; then
  echo '{"error": "사용법: bb-fetch-all.sh <endpoint> [--pagelen N] [--max-parallel N] [--jq-filter expr] [--query params]"}' >&2
  exit 1
fi

ENDPOINT="$1"
shift

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pagelen)
      PAGELEN="$2"
      shift 2
      ;;
    --max-parallel)
      MAX_PARALLEL="$2"
      shift 2
      ;;
    --jq-filter)
      JQ_FILTER="$2"
      shift 2
      ;;
    --query)
      EXTRA_QUERY="$2"
      shift 2
      ;;
    *)
      echo "{\"error\": \"알 수 없는 옵션: $1\"}" >&2
      exit 1
      ;;
  esac
done

# --- 환경변수 확인 ---
if [[ -z "${BITBUCKET_API_TOKEN:-}" ]]; then
  echo '{"error": "BITBUCKET_API_TOKEN 환경변수가 설정되지 않았습니다."}' >&2
  exit 1
fi

AUTH_HEADER="Authorization: Bearer $BITBUCKET_API_TOKEN"

# --- URL 구성 헬퍼 ---
build_url() {
  local page="$1"
  local url="${BASE_URL}${ENDPOINT}?pagelen=${PAGELEN}&page=${page}"
  if [[ -n "$EXTRA_QUERY" ]]; then
    url="${url}&${EXTRA_QUERY}"
  fi
  echo "$url"
}

# --- Step 1: 첫 페이지 요청 → 전체 개수 확인 ---
FIRST_URL=$(build_url 1)
FIRST_RESPONSE=$(curl -sf -H "$AUTH_HEADER" "$FIRST_URL" 2>/dev/null) || {
  echo '{"error": "API 요청 실패. 토큰 또는 엔드포인트를 확인하세요.", "endpoint": "'"$ENDPOINT"'"}' >&2
  exit 1
}

TOTAL_SIZE=$(echo "$FIRST_RESPONSE" | jq -r '.size // 0')
if [[ "$TOTAL_SIZE" -eq 0 ]]; then
  echo '[]'
  exit 0
fi

# --- Step 2: 총 페이지 수 계산 ---
TOTAL_PAGES=$(( (TOTAL_SIZE + PAGELEN - 1) / PAGELEN ))

# 첫 페이지 결과를 임시 파일에 저장
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "$FIRST_RESPONSE" | jq -c "[.values[] | $JQ_FILTER]" > "$TMPDIR/page_1.json"

# 1페이지만 있으면 바로 출력
if [[ "$TOTAL_PAGES" -le 1 ]]; then
  cat "$TMPDIR/page_1.json"
  exit 0
fi

# --- Step 3: 나머지 페이지 병렬 요청 (동시 실행 수 제한) ---
RUNNING=0

for ((page=2; page<=TOTAL_PAGES; page++)); do
  PAGE_URL=$(build_url "$page")
  (
    RESPONSE=$(curl -sf -H "$AUTH_HEADER" "$PAGE_URL" 2>/dev/null) || exit 0
    echo "$RESPONSE" | jq -c "[.values[] | $JQ_FILTER]" > "$TMPDIR/page_${page}.json"
  ) &

  RUNNING=$((RUNNING + 1))

  # 동시 실행 수 제한: MAX_PARALLEL에 도달하면 하나가 끝날 때까지 대기
  if [[ "$RUNNING" -ge "$MAX_PARALLEL" ]]; then
    wait -n 2>/dev/null || true
    RUNNING=$((RUNNING - 1))
  fi
done

# 남은 프로세스 모두 대기
wait

# --- Step 4: 결과 병합 ---
# 모든 page_*.json 파일을 페이지 순서대로 병합
jq -s 'add' "$TMPDIR"/page_*.json
