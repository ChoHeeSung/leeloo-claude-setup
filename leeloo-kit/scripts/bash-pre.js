'use strict';

const { readStdin, preAllow, preDeny } = require('./lib/io');

/**
 * bash-pre.js — 위험 명령 차단 (PreToolUse:Bash)
 */

const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+\//,
  /rm\s+-rf\s+~/,
  /git\s+push\s+--force/,
  /git\s+push\s+-f(\s|$)/,
  /git\s+reset\s+--hard/,
  /git\s+clean\s+-f/
];

async function main() {
  let event = {};
  try {
    event = await readStdin();
  } catch (e) {
    preAllow();
    return;
  }

  const command = (event.tool_input && event.tool_input.command) || '';

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      preDeny('위험 명령 차단: ' + command.slice(0, 100));
      return;
    }
  }

  preAllow();
}

main().catch(() => {
  process.stdout.write(JSON.stringify({}) + '\n');
});
