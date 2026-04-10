'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { readStdin, respond, sessionMessage } = require('./lib/io');
const { loadConfig } = require('./lib/config');
const { ensureSessionsDir } = require('./lib/paths');
const {
  getRepeatedFailures,
  writeFailureMemory,
  updateClaudeMdSummary,
  archiveAndClear
} = require('./lib/failure-log');
const { clearEditedFiles } = require('./lib/edit-accumulator');

/**
 * session-end.js — 세션 종료 처리 (SessionEnd 이벤트)
 *
 * 세 가지 역할:
 * 1. 세션 요약 영속화 (.leeloo/sessions/{date}-session.md)
 * 2. Context Checkpoint 병합 (context-summary.md → 세션 파일 → 초기화)
 * 3. Failure Memory Loop (기존 unified-stop.js 로직)
 *
 * ECC 패턴: 디스크에 요약 기록 → 다음 SessionStart에서 복원
 * HTML 주석 마커로 멱등성 보장
 */

const SUMMARY_START = '<!-- LEELOO:SUMMARY:START -->';
const SUMMARY_END = '<!-- LEELOO:SUMMARY:END -->';

// ── 세션 요약 생성 ──

function collectSessionMetadata() {
  const meta = {
    date: new Date().toISOString(),
    cwd: process.cwd(),
    project: path.basename(process.cwd()),
    branch: 'unknown'
  };

  try {
    const result = spawnSync('git', ['branch', '--show-current'], {
      encoding: 'utf8',
      timeout: 3000,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    if (result.status === 0 && result.stdout) {
      meta.branch = result.stdout.trim();
    }
  } catch (e) { /* ignore */ }

  return meta;
}

function collectModifiedFiles() {
  try {
    // git diff로 세션 중 변경된 파일 목록
    const result = spawnSync('git', ['diff', '--name-only', 'HEAD~1'], {
      encoding: 'utf8',
      timeout: 5000,
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe']
    });
    if (result.status === 0 && result.stdout) {
      return result.stdout.trim().split('\n').filter(Boolean).slice(0, 30);
    }
  } catch (e) { /* ignore */ }
  return [];
}

function loadContextSummary() {
  try {
    const summaryPath = path.join(process.cwd(), '.leeloo/context-summary.md');
    if (!fs.existsSync(summaryPath)) return '';
    return fs.readFileSync(summaryPath, 'utf8').trim();
  } catch (e) {
    return '';
  }
}

function clearContextSummary() {
  try {
    const summaryPath = path.join(process.cwd(), '.leeloo/context-summary.md');
    if (fs.existsSync(summaryPath)) {
      fs.writeFileSync(summaryPath, '', 'utf8');
    }
  } catch (e) {
    // 무시
  }
}

function buildSessionSummary(meta, modifiedFiles, contextSummary) {
  const lines = [];
  lines.push(`프로젝트: ${meta.project} (${meta.branch})`);
  lines.push(`종료: ${meta.date}`);

  if (contextSummary) {
    lines.push(`작업 맥락:`);
    // 최대 20줄
    const ctxLines = contextSummary.split('\n').slice(-20);
    lines.push(...ctxLines);
  }

  if (modifiedFiles.length > 0) {
    lines.push(`수정 파일 (${modifiedFiles.length}개):`);
    for (const f of modifiedFiles.slice(0, 10)) {
      lines.push(`  - ${f}`);
    }
    if (modifiedFiles.length > 10) {
      lines.push(`  ... 외 ${modifiedFiles.length - 10}개`);
    }
  }

  return lines.join('\n');
}

function writeSessionFile(summary) {
  try {
    const sessDir = ensureSessionsDir();
    const date = new Date().toISOString().slice(0, 10);
    const filePath = path.join(sessDir, `${date}-session.md`);

    let content = '';
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf8');
    }

    const newBlock = `${SUMMARY_START}\n${summary}\n${SUMMARY_END}`;

    // 기존 마커가 있으면 교체 (멱등성)
    if (content.includes(SUMMARY_START) && content.includes(SUMMARY_END)) {
      const regex = new RegExp(
        SUMMARY_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
        '[\\s\\S]*?' +
        SUMMARY_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'g'
      );
      content = content.replace(regex, newBlock);
    } else {
      // 새 파일 또는 마커 없음
      content = `# Session: ${date}\n\n${newBlock}\n`;
    }

    fs.writeFileSync(filePath, content, 'utf8');
  } catch (e) {
    // 세션 파일 기록 실패해도 세션 종료를 막지 않음
  }
}

// ── Failure Memory Loop (unified-stop 로직) ──

function processFailureMemory(config) {
  const enabled = config.harness && config.harness.failureMemory && config.harness.failureMemory.enabled;
  if (!enabled) {
    try { archiveAndClear(); } catch (e) { /* ignore */ }
    return null;
  }

  const repeated = getRepeatedFailures();

  if (repeated.length === 0) {
    try { archiveAndClear(); } catch (e) { /* ignore */ }
    return null;
  }

  try {
    writeFailureMemory(repeated);
    updateClaudeMdSummary(repeated);
    archiveAndClear();

    const count = repeated.length;
    const types = [...new Set(repeated.map(r => r.type))].join(', ');
    return `${count}건의 반복 실패 기록 (${types})`;
  } catch (e) {
    try { archiveAndClear(); } catch (e2) { /* ignore */ }
    return null;
  }
}

// ── 메인 ──

async function main() {
  try {
    await readStdin();
  } catch (e) {
    respond({});
    return;
  }

  const config = loadConfig();
  const messages = [];

  // 1. 세션 요약 영속화 (Context Checkpoint 포함)
  try {
    const meta = collectSessionMetadata();
    const modifiedFiles = collectModifiedFiles();
    const contextSummary = loadContextSummary();
    const summary = buildSessionSummary(meta, modifiedFiles, contextSummary);
    writeSessionFile(summary);
    // context-summary.md 초기화 (세션 파일로 이동 완료)
    if (contextSummary) clearContextSummary();
  } catch (e) {
    // 무시
  }

  // 2. Failure Memory Loop
  const failureMsg = processFailureMemory(config);
  if (failureMsg) {
    messages.push(failureMsg);
  }

  // 3. 편집 파일 목록 정리
  try {
    clearEditedFiles();
  } catch (e) {
    // 무시
  }

  // 출력
  if (messages.length > 0) {
    sessionMessage(`[leeloo-kit] 세션 종료: ${messages.join('. ')}. 상세: .leeloo/failure-memory/ 참조`);
  } else {
    respond({});
  }
}

main().catch(() => {
  process.stdout.write(JSON.stringify({}) + '\n');
});
