'use strict';

const { readStdin, respond, stopApprove } = require('./lib/io');
const { loadConfig } = require('./lib/config');
const {
  getRepeatedFailures,
  writeFailureMemory,
  updateClaudeMdSummary,
  archiveAndClear
} = require('./lib/failure-log');

/**
 * unified-stop.js — Failure Memory Loop (Stop 이벤트)
 *
 * 세션 종료 시:
 * 1. 반복 실패를 유형별 .leeloo/failure-memory/{type}.md에 기록
 * 2. 프로젝트 CLAUDE.md에 최근 3건 요약만 유지
 * 3. failure-log.json을 failure-archive/에 아카이브
 *
 * Back-pressure: 반복 실패 없으면 침묵
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

  // 반복 실패 확인
  const repeated = getRepeatedFailures();

  if (repeated.length === 0) {
    // 반복 실패 없음: 침묵 + 로그 아카이브만
    try { archiveAndClear(); } catch (e) { /* ignore */ }
    respond({});
    return;
  }

  // 반복 실패 있음: Failure Memory 기록
  try {
    // 1) 유형별 상세 파일에 기록
    writeFailureMemory(repeated);

    // 2) 프로젝트 CLAUDE.md 요약 업데이트
    updateClaudeMdSummary(repeated);

    // 3) failure-log.json 아카이브
    archiveAndClear();

    const count = repeated.length;
    const types = [...new Set(repeated.map(r => r.type))].join(', ');
    stopApprove(
      `[leeloo-kit] ${count}건의 반복 실패 기록 완료 (${types}).\n` +
      `상세: .leeloo/failure-memory/ 참조`
    );
  } catch (e) {
    // 기록 실패해도 세션 종료를 막지 않음
    try { archiveAndClear(); } catch (e2) { /* ignore */ }
    respond({});
  }
}

main().catch(() => {
  process.stdout.write(JSON.stringify({}) + '\n');
});
