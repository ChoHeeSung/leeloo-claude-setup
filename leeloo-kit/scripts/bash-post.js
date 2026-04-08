'use strict';

const { readStdin, respond, postContext } = require('./lib/io');
const { loadConfig } = require('./lib/config');
const { appendFailure, normalizePattern, classifyFailure, getRepeatedFailures } = require('./lib/failure-log');

/**
 * bash-post.js — Bash 실패 감지 (PostToolUse:Bash)
 *
 * Back-pressure 원칙: 성공은 침묵, 실패만 기록
 */

async function main() {
  let event = {};
  try {
    event = await readStdin();
  } catch (e) {
    respond({});
    return;
  }

  const config = loadConfig();
  const enabled = config.harness && config.harness.failureMemory && config.harness.failureMemory.enabled;
  if (!enabled) {
    respond({});
    return;
  }

  // tool_response 또는 tool_result에서 exit_code 확인 (필드명 호환)
  const toolResponse = event.tool_response || event.tool_result || event.response || {};
  const exitCode = toolResponse.exit_code != null ? toolResponse.exit_code : toolResponse.exitCode;
  const command = (event.tool_input && (event.tool_input.command || event.tool_input.cmd)) || '';

  // 성공: 침묵 (back-pressure)
  if (exitCode === 0 || exitCode === undefined || exitCode === null) {
    respond({});
    return;
  }

  // 실패: failure-log에 기록
  const pattern = normalizePattern(command);
  const type = classifyFailure(command);
  const stderr = (toolResponse.stderr || '').trim();
  const stdout = (toolResponse.stdout || '').trim();
  const errorMsg = stderr || stdout.split('\n').slice(-5).join('\n');

  try {
    appendFailure({
      pattern,
      command,
      error: errorMsg.slice(0, 500),
      exitCode,
      timestamp: new Date().toISOString(),
      type
    });
  } catch (e) {
    // 로그 기록 실패해도 에이전트 작업 방해하지 않음
    respond({});
    return;
  }

  // 반복 실패 확인
  const repeated = getRepeatedFailures();
  const thisRepeated = repeated.find(r => r.pattern === pattern);

  if (thisRepeated && thisRepeated.count >= 2) {
    postContext(
      `[leeloo-kit] 이 에러가 ${thisRepeated.count}회 반복되고 있습니다: \`${pattern}\`\n` +
      `유형: ${type} | 세션 종료 시 .leeloo/failure-memory/${type}.md에 자동 기록됩니다.\n` +
      `이전과 다른 접근법을 시도하세요.`
    );
  } else {
    // 첫 발생: 침묵
    respond({});
  }
}

main().catch(() => {
  process.stdout.write(JSON.stringify({}) + '\n');
});
