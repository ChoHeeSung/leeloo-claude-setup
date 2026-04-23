#!/bin/bash
# Leeloo statusline — claude theme (merged engine + theme)

# --- Theme: claude ---
FG_LEFT="\033[38;2;31;30;29m"
BG_LEFT="\033[48;2;31;30;29m"
FG_LEFT_TEXT="\033[38;2;198;97;63m"
FG_MID="\033[38;2;255;255;255m"
BG_MID="\033[48;2;255;255;255m"
FG_MID_TEXT="\033[38;2;46;52;64m"
FG_RIGHT="\033[38;2;139;90;43m"
BG_RIGHT="\033[48;2;139;90;43m"
FG_RIGHT_TEXT="\033[38;2;255;255;255m"
FG_STATS="\033[38;2;46;125;50m"
BG_STATS="\033[48;2;46;125;50m"
FG_STATS_TEXT="\033[38;2;255;255;255m"
FG_BUDGET="\033[38;2;120;90;170m"
BG_BUDGET="\033[48;2;120;90;170m"
FG_BUDGET_TEXT="\033[38;2;255;255;255m"

# --- Engine ---
CAP_LEFT=$(printf '\xee\x82\xb6')
CAP_RIGHT=$(printf '\xee\x82\xb4')

ICON_FOLDER=$(printf '\xef\x81\xbc')
ICON_GITHUB=$(printf '\xef\x82\x9b')
ICON_BRANCH=$(printf '\xee\x9c\xa5')
ICON_BRAIN=$(printf '\xf3\xb0\xaf\x89')
ICON_MONITOR=$(printf '\xef\x8b\x90')
ICON_DOLLAR=$(printf '\xee\xb7\xa8')
ICON_KEY=$(printf '\xf3\xb0\x8c\xb7')
ICON_CHART=$(printf '\xef\x82\x80')
ICON_BOLT=$(printf '\xef\x83\xa7')
ICON_COIN=$(printf '\xef\x80\x95')

BOLD="\033[1m"
RESET="\033[0m"

input=$(cat)

session_id=$(echo "$input" | jq -r '.session_id // "unknown"')
session_short="${session_id:0:8}"
project_dir=$(echo "$input" | jq -r '.workspace.project_dir // .workspace.current_dir // "."')
short_path=$(echo "$project_dir" | sed "s|$HOME|~|")

git_branch=""
git_dirty=""
if git -C "$project_dir" rev-parse --git-dir > /dev/null 2>&1; then
    git_branch=$(git -C "$project_dir" branch --show-current 2>/dev/null)
    if [ -n "$git_branch" ]; then
        if ! git -C "$project_dir" diff --quiet 2>/dev/null || ! git -C "$project_dir" diff --cached --quiet 2>/dev/null; then
            git_dirty=" ≠"
        fi
    fi
fi

model=$(echo "$input" | jq -r '.model.id // .model // "unknown"')
case "$model" in
    *opus*4.6*|*opus-4-6*) model_display="Opus 4.6" ;;
    *opus*4.5*|*opus-4-5*) model_display="Opus 4.5" ;;
    *opus*4*|*opus-4*) model_display="Opus 4" ;;
    *sonnet*4.6*|*sonnet-4-6*) model_display="Sonnet 4.6" ;;
    *sonnet*4.5*|*sonnet-4-5*) model_display="Sonnet 4.5" ;;
    *sonnet*4*|*sonnet-4*) model_display="Sonnet 4" ;;
    *sonnet*3.5*|*sonnet-3-5*) model_display="Sonnet 3.5" ;;
    *haiku*4.5*|*haiku-4-5*) model_display="Haiku 4.5" ;;
    *haiku*3.5*|*haiku-3-5*) model_display="Haiku 3.5" ;;
    *) model_display="$model" ;;
esac

usage=$(echo "$input" | jq '.context_window.current_usage')
input_tokens=0; output_tokens=0; cache_read=0; cache_write=0; context_pct=0
if [ "$usage" != "null" ]; then
    input_tokens=$(echo "$usage" | jq '.input_tokens // 0')
    output_tokens=$(echo "$usage" | jq '.output_tokens // 0')
    cache_read=$(echo "$usage" | jq '.cache_read_input_tokens // 0')
    cache_write=$(echo "$usage" | jq '.cache_creation_input_tokens // 0')
    current=$((input_tokens + cache_write + cache_read))
    size=$(echo "$input" | jq '.context_window.context_window_size')
    if [ "$size" != "null" ] && [ "$size" -gt 0 ] 2>/dev/null; then
        context_pct=$((current * 100 / size))
    fi
fi

filled=$((context_pct * 5 / 100))
bar=""
for ((i=0; i<5; i++)); do
    if [ $i -lt $filled ]; then bar="${bar}■"; else bar="${bar}□"; fi
done

case "$model_display" in
    Sonnet*) price_input=300; price_output=1500; price_cache_read=30; price_cache_write=375 ;;
    Haiku*) price_input=80; price_output=400; price_cache_read=8; price_cache_write=100 ;;
    *) price_input=1500; price_output=7500; price_cache_read=150; price_cache_write=1875 ;;
esac
cost_input_cents=$(( (input_tokens * price_input) / 1000000 ))
cost_output_cents=$(( (output_tokens * price_output) / 1000000 ))
cost_cache_read_cents=$(( (cache_read * price_cache_read) / 1000000 ))
cost_cache_write_cents=$(( (cache_write * price_cache_write) / 1000000 ))
total_cents=$((cost_input_cents + cost_output_cents + cost_cache_read_cents + cost_cache_write_cents))

total_ctx=$((input_tokens + cache_read + cache_write))
if [ $total_ctx -gt 0 ]; then cache_pct=$((cache_read * 100 / total_ctx)); else cache_pct=0; fi

api_ms=$(echo "$input" | jq '.cost.total_api_duration_ms // 0')
if [ "$api_ms" != "null" ] && [ "$api_ms" -gt 0 ] 2>/dev/null; then
    api_sec=$(awk "BEGIN {printf \"%.1f\", $api_ms / 1000}")
else
    api_sec="0.0"
fi

if [ $total_cents -eq 0 ]; then cost_display="\$0"
elif [ $total_cents -lt 100 ]; then cost_display="\$0.$(printf '%02d' $total_cents)"
else dollars=$((total_cents / 100)); cents=$((total_cents % 100)); cost_display="\$${dollars}.$(printf '%02d' $cents)"
fi

printf "${FG_LEFT}${CAP_LEFT}${RESET}"
printf "${BG_LEFT}${BOLD}${FG_LEFT_TEXT} ${ICON_FOLDER} %s ${RESET}" "$short_path"
printf "${FG_LEFT}${CAP_RIGHT}${RESET}"

if [ -n "$git_branch" ]; then
    printf " "
    printf "${FG_MID}${CAP_LEFT}${RESET}"
    printf "${BG_MID}${BOLD}${FG_MID_TEXT} ${ICON_GITHUB} ${ICON_BRANCH} %s${FG_MID_TEXT}%s${FG_MID_TEXT} ${RESET}" "$git_branch" "$git_dirty"
    printf "${FG_MID}${CAP_RIGHT}${RESET}"
fi

printf " "
printf "${FG_RIGHT}${CAP_LEFT}${RESET}"
printf "${BG_RIGHT}${BOLD}${FG_RIGHT_TEXT} ${ICON_BRAIN} %s ${ICON_MONITOR} %s %d%% ${ICON_DOLLAR} %s ${ICON_KEY} %s ${RESET}" "$model_display" "$bar" "$context_pct" "$cost_display" "$session_short"
printf "${FG_RIGHT}${CAP_RIGHT}${RESET}"

printf " "
printf "${FG_STATS}${CAP_LEFT}${RESET}"
printf "${BG_STATS}${BOLD}${FG_STATS_TEXT} ${ICON_CHART} %d%% ${ICON_BOLT} %ss ${RESET}" "$cache_pct" "$api_sec"
printf "${FG_STATS}${CAP_RIGHT}${RESET}"

# Token budget: 오늘 자동 로드 평균
budget_file="$project_dir/.leeloo/token-budget/$(TZ='Asia/Seoul' date +%Y-%m-%d).jsonl"
if [ -f "$budget_file" ] && command -v jq >/dev/null 2>&1; then
    load_avg=$(jq -s '[.[] | select(.kind=="load") | .tokens_est // 0] | if length > 0 then (add / length | floor) else 0 end' "$budget_file" 2>/dev/null)
    if [ -n "$load_avg" ] && [ "$load_avg" -gt 0 ] 2>/dev/null; then
        budget_display=$(awk "BEGIN {printf \"%.1fK\", $load_avg/1000}")
        printf " "
        printf "${FG_BUDGET}${CAP_LEFT}${RESET}"
        printf "${BG_BUDGET}${BOLD}${FG_BUDGET_TEXT} ${ICON_COIN} %s ${RESET}" "$budget_display"
        printf "${FG_BUDGET}${CAP_RIGHT}${RESET}"
    fi
fi

printf "\n"
