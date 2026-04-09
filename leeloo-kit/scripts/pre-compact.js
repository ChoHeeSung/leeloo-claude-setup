'use strict';

const fs = require('fs');
const path = require('path');
const { readStdin, respond, postContext } = require('./lib/io');
const { ensureStateDir } = require('./lib/paths');
const { getFailureMemoryStats } = require('./lib/failure-log');

/**
 * pre-compact.js — 전략적 컨텍스트 압축 전 처리 (PreCompact)
 *
 * ECC 패턴: 경량 마커만 기록 + 핵심 정보 postContext로 보존
 * - compaction-log.txt에 타임스탬프 기록
 * - Failure Memory 최근 3건 + 현재 작업 상태 주입
 */

function appendCompactionLog() {
  try {
    const stateDir = ensureStateDir();
    const logPath = path.join(stateDir, 'compaction-log.txt');
    const entry = `[${new Date().toISOString()}] context compacted\n`;
    fs.appendFileSync(logPath, entry, 'utf8');
  } catch (e) {
    // 무시
  }
}

function getRecentFailures() {
  try {
    const memDir = path.join(process.cwd(), '.leeloo/failure-memory');
    if (!fs.existsSync(memDir)) return '';

    const allEntries = [];
    const files = fs.readdirSync(memDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(memDir, file), 'utf8');
      const lines = content.split('\n').filter(l => l.startsWith('- ['));
      allEntries.push(...lines.map(l => ({ type: file.replace('.md', ''), line: l })));
    }

    // 최근 3건
    return allEntries.slice(-3).map(e => `  ${e.type}: ${e.line}`).join('\n');
  } catch (e) {
    return '';
  }
}

function getCurrentTodoState() {
  try {
    const todoPath = path.join(process.cwd(), 'TODO.md');
    if (!fs.existsSync(todoPath)) return '';
    const content = fs.readFileSync(todoPath, 'utf8');
    const match = content.match(/완료:\s*(\d+)\/(\d+)/);
    if (match) return `TODO 진행: ${match[1]}/${match[2]}`;
    return '';
  } catch (e) {
    return '';
  }
}

async function main() {
  try {
    await readStdin();
  } catch (e) {
    // 무시
  }

  // 1. compaction 시점 기록
  appendCompactionLog();

  // 2. 핵심 정보 수집
  const parts = [];

  const stats = getFailureMemoryStats();
  if (stats) {
    const typeSummary = Object.entries(stats.stats)
      .map(([type, count]) => `${type}(${count})`)
      .join(', ');
    parts.push(`Failure Memory: ${typeSummary}`);
  }

  const recentFailures = getRecentFailures();
  if (recentFailures) {
    parts.push(`최근 실패:\n${recentFailures}`);
  }

  const todoState = getCurrentTodoState();
  if (todoState) {
    parts.push(todoState);
  }

  // 3. postContext로 보존 정보 주입
  if (parts.length > 0) {
    postContext(
      `[leeloo-kit] 컨텍스트 압축 중. 보존 핵심 정보:\n${parts.join('\n')}`
    );
    return;
  }

  respond({});
}

main().catch(() => {
  process.stdout.write(JSON.stringify({}) + '\n');
});
