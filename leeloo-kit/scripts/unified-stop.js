'use strict';

const { readStdin, respond, stopApprove } = require('./lib/io');
const { loadContext } = require('./lib/context');

/**
 * unified-stop.js — Stop 디스패처 (Stop 이벤트)
 */

function handleGapDetector(context) {
  const matchRate = context.matchRate != null ? context.matchRate : null;
  if (matchRate == null) {
    return '[leeloo-kit] gap-detector 완료. matchRate를 확인하여 다음 단계를 결정하세요.';
  }
  if (matchRate >= 90) {
    return `[leeloo-kit] gap-detector 완료 (matchRate: ${matchRate}%). 기준 달성!\n  - /lk-pdca report — 최종 리포트 생성 권장`;
  }
  return `[leeloo-kit] gap-detector 완료 (matchRate: ${matchRate}%). 기준 미달.\n  - 자동 개선 사이클 시작\n  - /lk-plan — Plan 재작성`;
}

function handlePdcaIterator(context) {
  const iterations = context.iterations != null ? context.iterations : 0;
  const maxIterations = context.maxIterations || 5;
  if (iterations >= maxIterations) {
    return `[leeloo-kit] pdca-iterator 완료 (${iterations}/${maxIterations} 반복). 최대 반복 도달.\n  - /lk-pdca report — 현재 상태로 리포트 생성`;
  }
  return `[leeloo-kit] pdca-iterator 진행 중 (${iterations}/${maxIterations} 반복).`;
}

function handleReportGenerator(context) {
  const reportPath = context.reportPath || '';
  if (reportPath) {
    return `[leeloo-kit] report-generator 완료. 리포트: ${reportPath}`;
  }
  return '[leeloo-kit] report-generator 완료.';
}

async function main() {
  let event = {};
  try {
    event = await readStdin();
  } catch (e) {
    respond({});
    return;
  }

  // active-context.json에서 마지막 활성 에이전트/스킬 확인
  let context = {};
  try {
    context = loadContext();
  } catch (e) {
    // 무시
  }

  const activeAgent = context.activeAgent || '';

  let message = null;

  if (activeAgent === 'gap-detector') {
    message = handleGapDetector(context);
  } else if (activeAgent === 'pdca-iterator') {
    message = handlePdcaIterator(context);
  } else if (activeAgent === 'report-generator') {
    message = handleReportGenerator(context);
  }

  stopApprove(message);
}

main().catch(() => {
  process.stdout.write(JSON.stringify({}) + '\n');
});
