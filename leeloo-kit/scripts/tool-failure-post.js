'use strict';

const { readStdin, respond, postContext } = require('./lib/io');
const { loadConfig } = require('./lib/config');
const { appendFailure, getRepeatedFailures } = require('./lib/failure-log');

/**
 * tool-failure-post.js — Write|Edit 및 MCP 도구 실패 감지 (PostToolUse)
 *
 * 역할: 도구 실행 에러 감지 → failure-log 기록
 * 품질체크는 stop-quality-check.js에서 배치 처리 (ECC 패턴)
 */

function detectError(toolResponse) {
  if (!toolResponse) return null;

  const responseStr = typeof toolResponse === 'string'
    ? toolResponse
    : JSON.stringify(toolResponse);

  if (toolResponse.error) return toolResponse.error;
  if (toolResponse.Error) return toolResponse.Error;

  const errorPatterns = [
    /error[:\s]/i,
    /failed[:\s]/i,
    /ENOENT/,
    /EACCES/,
    /EPERM/,
    /permission denied/i,
    /no such file/i,
    /not found/i,
    /cannot (?:read|write|access)/i,
    /timed? ?out/i
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(responseStr)) {
      const lines = responseStr.split('\n');
      const errorLine = lines.find(l => pattern.test(l)) || lines[0];
      return errorLine.slice(0, 200);
    }
  }

  return null;
}

function classifyToolFailure(toolName) {
  if (!toolName) return 'general';
  if (toolName === 'Write' || toolName === 'Edit') return 'file-io';
  if (toolName.startsWith('mcp_')) return 'mcp';
  return 'general';
}

async function main() {
  let event = {};
  try {
    event = await readStdin();
  } catch (e) {
    respond({});
    return;
  }

  const config = loadConfig();
  const toolName = event.tool_name || '';
  const toolResponse = event.tool_response || {};
  const toolInput = event.tool_input || {};
  const failureEnabled = config.harness && config.harness.failureMemory && config.harness.failureMemory.enabled;

  // 도구 에러 감지
  const errorMsg = detectError(toolResponse);

  if (errorMsg && failureEnabled) {
    let inputSummary = '';
    if (toolName === 'Write' || toolName === 'Edit') {
      inputSummary = toolInput.file_path || '';
    } else {
      const keys = Object.keys(toolInput);
      inputSummary = keys.length > 0 ? `${keys[0]}=${String(toolInput[keys[0]]).slice(0, 30)}` : '';
    }
    const pattern = `${toolName} ${inputSummary}`.trim();
    const type = classifyToolFailure(toolName);

    try {
      appendFailure({
        pattern,
        command: `${toolName}(${JSON.stringify(toolInput).slice(0, 200)})`,
        error: errorMsg.slice(0, 500),
        exitCode: null,
        timestamp: new Date().toISOString(),
        type
      });
    } catch (e) { /* ignore */ }

    const repeated = getRepeatedFailures();
    const thisRepeated = repeated.find(r => r.pattern === pattern);

    if (thisRepeated && thisRepeated.count >= 2) {
      postContext(
        `[leeloo-kit] ${toolName} 에러가 ${thisRepeated.count}회 반복: \`${pattern}\`\n` +
        `유형: ${type} | 세션 종료 시 .leeloo/failure-memory/${type}.md에 자동 기록.\n` +
        `이전과 다른 접근법을 시도하세요.`
      );
      return;
    }
  }

  // 성공 또는 첫 실패: 침묵
  respond({});
}

main().catch(() => {
  process.stdout.write(JSON.stringify({}) + '\n');
});
