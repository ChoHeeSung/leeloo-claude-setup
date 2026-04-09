'use strict';

const fs = require('fs');
const path = require('path');
const { readStdin, respond, postContext } = require('./lib/io');
const { ensureStateDir } = require('./lib/paths');

/**
 * mcp-health-check.js — MCP 서버 헬스체크 (PostToolUseFailure: mcp_)
 *
 * ECC 패턴: MCP 도구 실패 시 서버 건강 상태 추적
 * - TTL 기반 캐싱 (건강 상태 2분 유지)
 * - 지수 백오프 재시도 (30초 → 최대 10분)
 * - Fail-open: 헬스체크 자체 실패 시 차단하지 않음
 */

const HEALTH_FILE = '.leeloo/mcp-health.json';
const HEALTHY_TTL_MS = 2 * 60 * 1000;      // 2분
const BASE_RETRY_MS = 30 * 1000;            // 30초
const MAX_RETRY_MS = 10 * 60 * 1000;        // 10분
const WARN_THRESHOLD = 3;

function getHealthPath() {
  return path.join(process.cwd(), HEALTH_FILE);
}

function loadHealthState() {
  const filePath = getHealthPath();
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveHealthState(state) {
  ensureStateDir();
  const filePath = getHealthPath();
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * MCP 서버 이름 추출 (tool_name에서 mcp_ 접두사 뒤 서버명)
 * 예: mcp__claude_ai_Context7__query-docs → claude_ai_Context7
 */
function extractServerName(toolName) {
  if (!toolName || !toolName.startsWith('mcp_')) return null;

  // mcp__{server}__{method} 또는 mcp_{server}_{method} 패턴
  const parts = toolName.replace(/^mcp__?/, '').split('__');
  return parts.length > 0 ? parts[0] : toolName;
}

/**
 * 지수 백오프 계산
 */
function calculateNextRetry(failureCount) {
  const delay = Math.min(BASE_RETRY_MS * Math.pow(2, failureCount - 1), MAX_RETRY_MS);
  return Date.now() + delay;
}

async function main() {
  let event = {};
  try {
    event = await readStdin();
  } catch (e) {
    respond({});
    return;
  }

  const toolName = event.tool_name || '';
  const serverName = extractServerName(toolName);

  if (!serverName) {
    respond({});
    return;
  }

  const state = loadHealthState();
  const now = Date.now();

  // 서버 상태 초기화 (없으면)
  if (!state[serverName]) {
    state[serverName] = {
      status: 'unknown',
      failureCount: 0,
      lastFailure: null,
      nextRetryAfter: 0,
      lastChecked: now
    };
  }

  const server = state[serverName];

  // 실패 기록
  server.failureCount++;
  server.lastFailure = now;
  server.status = 'unhealthy';
  server.nextRetryAfter = calculateNextRetry(server.failureCount);
  server.lastChecked = now;

  saveHealthState(state);

  // 경고 임계값 도달
  if (server.failureCount >= WARN_THRESHOLD) {
    const retryIn = Math.round((server.nextRetryAfter - now) / 1000);
    postContext(
      `[leeloo-kit] MCP 서버 "${serverName}" 연결 불안정 (${server.failureCount}회 실패)\n` +
      `다음 재시도 가능: ${retryIn}초 후\n` +
      `MCP 서버 상태를 확인하세요. 설정: ~/.claude/settings.json mcpServers`
    );
    return;
  }

  // 첫 몇 회 실패: 침묵
  respond({});
}

main().catch(() => {
  process.stdout.write(JSON.stringify({}) + '\n');
});
