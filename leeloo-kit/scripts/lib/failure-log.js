'use strict';

const fs = require('fs');
const path = require('path');
const { loadConfig } = require('./config');
const { ensureStateDir, ensureFailureMemoryDir, ensureFailureArchiveDir, getStatePath } = require('./paths');

/**
 * failure-log.js — Failure Memory Loop CRUD 유틸리티
 */

// ── 실패 로그 (세션 내 임시) ──

function loadFailureLog() {
  try {
    const filePath = getStatePath('failureLog');
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function saveFailureLog(entries) {
  ensureStateDir();
  const filePath = getStatePath('failureLog');
  fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf8');
}

function appendFailure({ pattern, command, error, exitCode, timestamp, type }) {
  const entries = loadFailureLog();
  entries.push({ pattern, command, error, exitCode, timestamp, type });
  saveFailureLog(entries);
}

// ── 패턴 정규화 & 유형 분류 ──

/**
 * 명령어에서 패턴 추출 (첫 2토큰)
 */
function normalizePattern(command) {
  if (!command) return 'unknown';
  const tokens = command.trim().split(/\s+/);
  return tokens.slice(0, 2).join(' ');
}

/**
 * 명령어 패턴으로 실패 유형 분류
 */
function classifyFailure(command) {
  if (!command) return 'general';
  const config = loadConfig();
  const types = (config.harness && config.harness.failureTypes) || {};

  for (const [type, patterns] of Object.entries(types)) {
    for (const p of patterns) {
      if (command.includes(p)) return type;
    }
  }
  return 'general';
}

// ── 반복 실패 감지 ──

/**
 * 반복 횟수 >= threshold인 패턴 반환
 */
function getRepeatedFailures(threshold) {
  const config = loadConfig();
  const th = threshold || (config.harness && config.harness.failureMemory && config.harness.failureMemory.repeatThreshold) || 2;
  const entries = loadFailureLog();

  const counts = {};
  for (const e of entries) {
    const key = e.pattern || normalizePattern(e.command);
    if (!counts[key]) {
      counts[key] = { count: 0, entries: [] };
    }
    counts[key].count++;
    counts[key].entries.push(e);
  }

  const repeated = [];
  for (const [pattern, data] of Object.entries(counts)) {
    if (data.count >= th) {
      const latest = data.entries[data.entries.length - 1];
      repeated.push({
        pattern,
        count: data.count,
        type: latest.type || classifyFailure(latest.command),
        error: latest.error,
        command: latest.command,
        timestamp: latest.timestamp
      });
    }
  }
  return repeated;
}

// ── Failure Memory 파일 기록 (유형별 .md) ──

/**
 * .leeloo/failure-memory/{type}.md에 상세 기록
 */
function writeFailureMemory(failures) {
  if (!failures || failures.length === 0) return;

  const config = loadConfig();
  const maxPerType = (config.harness && config.harness.failureMemory && config.harness.failureMemory.maxEntriesPerType) || 10;
  const memDir = ensureFailureMemoryDir();

  // 유형별 그룹핑
  const byType = {};
  for (const f of failures) {
    const type = f.type || 'general';
    if (!byType[type]) byType[type] = [];
    byType[type].push(f);
  }

  for (const [type, items] of Object.entries(byType)) {
    const filePath = path.join(memDir, `${type}.md`);

    // 기존 항목 로드
    let existingLines = [];
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      existingLines = content.split('\n').filter(l => l.startsWith('- ['));
    }

    // 새 항목 추가
    for (const item of items) {
      const date = item.timestamp ? item.timestamp.slice(0, 10) : new Date().toISOString().slice(0, 10);
      const errorSummary = (item.error || '').split('\n')[0].slice(0, 120);
      const line = `- [${date}] \`${item.pattern}\` — ${errorSummary}`;
      existingLines.push(line);
    }

    // FIFO: maxPerType 초과 시 오래된 것 제거
    if (existingLines.length > maxPerType) {
      existingLines = existingLines.slice(existingLines.length - maxPerType);
    }

    const header = `# Failure Memory: ${type}\n\n`;
    fs.writeFileSync(filePath, header + existingLines.join('\n') + '\n', 'utf8');
  }
}

// ── CLAUDE.md 요약 업데이트 ──

/**
 * 프로젝트 CLAUDE.md의 ## Failure Memory 섹션에 요약만 기록
 * 글로벌 ~/.claude/CLAUDE.md는 절대 수정하지 않음
 */
function updateClaudeMdSummary(failures) {
  if (!failures || failures.length === 0) return;

  const config = loadConfig();
  const summaryCount = (config.harness && config.harness.failureMemory && config.harness.failureMemory.summaryCount) || 3;
  const targetSection = (config.harness && config.harness.failureMemory && config.harness.failureMemory.targetSection) || '## Failure Memory';

  const claudeMdPath = path.join(process.cwd(), 'CLAUDE.md');

  let content = '';
  if (fs.existsSync(claudeMdPath)) {
    content = fs.readFileSync(claudeMdPath, 'utf8');
  } else {
    // CLAUDE.md가 없으면 Failure Memory 섹션만 포함하여 자동 생성
    content = `# ${path.basename(process.cwd())}\n\n${targetSection}\n`;
  }

  // 유형별 건수 집계
  const typeCounts = {};
  for (const f of failures) {
    const type = f.type || 'general';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }
  const countLine = Object.entries(typeCounts)
    .map(([t, c]) => `${t}(${c}건)`)
    .join(', ');

  // 최근 N건 요약
  const recent = failures.slice(-summaryCount);
  const summaryLines = recent.map(f => {
    const errorShort = (f.error || '').split('\n')[0].slice(0, 80);
    return `- \`${f.pattern}\` — ${errorShort}`;
  });

  const newSection = [
    targetSection,
    `${countLine} — 상세: .leeloo/failure-memory/ 참조`,
    ...summaryLines
  ].join('\n');

  // 기존 섹션 교체 또는 추가
  const sectionRegex = new RegExp(
    `${targetSection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n## |$)`,
    'g'
  );

  if (sectionRegex.test(content)) {
    content = content.replace(sectionRegex, newSection + '\n');
  } else {
    content = content.trimEnd() + '\n\n' + newSection + '\n';
  }

  fs.writeFileSync(claudeMdPath, content, 'utf8');
}

// ── 아카이브 ──

function archiveAndClear() {
  const entries = loadFailureLog();
  if (entries.length === 0) return;

  const archDir = ensureFailureArchiveDir();
  const date = new Date().toISOString().slice(0, 10);
  const archPath = path.join(archDir, `${date}.json`);

  // 기존 아카이브에 추가
  let existing = [];
  if (fs.existsSync(archPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(archPath, 'utf8'));
    } catch (e) { /* ignore */ }
  }

  fs.writeFileSync(archPath, JSON.stringify([...existing, ...entries], null, 2), 'utf8');

  // failure-log.json 클리어
  saveFailureLog([]);
}

// ── 전체 실패 카운트 (session-start용) ──

function getFailureMemoryStats() {
  const config = loadConfig();
  const memDir = path.join(process.cwd(), config.statePaths.failureMemory || '.leeloo/failure-memory');
  if (!fs.existsSync(memDir)) return null;

  const stats = {};
  let total = 0;
  try {
    const files = fs.readdirSync(memDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(memDir, file), 'utf8');
      const count = (content.match(/^- \[/gm) || []).length;
      if (count > 0) {
        const type = file.replace('.md', '');
        stats[type] = count;
        total += count;
      }
    }
  } catch (e) { /* ignore */ }

  return total > 0 ? { stats, total } : null;
}

module.exports = {
  loadFailureLog,
  saveFailureLog,
  appendFailure,
  normalizePattern,
  classifyFailure,
  getRepeatedFailures,
  writeFailureMemory,
  updateClaudeMdSummary,
  archiveAndClear,
  getFailureMemoryStats
};
