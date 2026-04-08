'use strict';

const { readStdin, respond } = require('./lib/io');

/**
 * bash-post.js — PostToolUse:Bash
 *
 * Claude Code의 PostToolUse hook은 tool_response에 stdout/stderr를 빈 문자열로 전달하므로
 * Bash 실패를 hook에서 감지하는 것은 불가능합니다.
 * Bash 실패 기록은 CLAUDE.md의 Failure Memory 규칙에 따라 Claude가 직접 수행합니다.
 *
 * 이 hook은 향후 Claude Code가 tool_response에 실제 출력을 포함하게 되면 활성화됩니다.
 */

async function main() {
  try {
    await readStdin();
  } catch (e) {
    // ignore
  }
  respond({});
}

main().catch(() => {
  process.stdout.write(JSON.stringify({}) + '\n');
});
