'use strict';

const { readStdin, allowWithMessage, respond } = require('./lib/io');
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
  return `[leeloo-kit] gap-detector 완료 (matchRate: ${matchRate}%). 기준 미달.\n  - /lk-pdca act    — 자동 개선 사이클 시작\n  - /lk-plan        — Plan 재작성`;
}

function handlePdcaIterator(context) {
  const iterations = context.iterations != null ? context.iterations : 0;
  const maxIterations = context.maxIterations || 5;
  if (iterations >= maxIterations) {
    return `[leeloo-kit] pdca-iterator 완료 (${iterations}/${maxIterations} 반복). 최대 반복 도달.\n  - /lk-pdca report — 현재 상태로 리포트 생성\n  - /lk-pdca act    — 수동 개선 후 재시작`;
  }
  return `[leeloo-kit] pdca-iterator 진행 중 (${iterations}/${maxIterations} 반복).\n  - 분석을 계속하거나 /lk-pdca check 로 결과 확인`;
}

function handleReportGenerator(context) {
  const reportPath = context.reportPath || '';
  if (reportPath) {
    return `[leeloo-kit] report-generator 완료. 리포트 저장됨: ${reportPath}\n  - /lk-todo create — 액션 아이템을 TODO로 변환`;
  }
  return '[leeloo-kit] report-generator 완료. 생성된 리포트를 확인하세요.';
}

async function main() {
  let event = {};
  try {
    event = await readStdin();
  } catch (e) {
    respond({ decision: 'allow' });
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
  const activeSkill = context.activeSkill || '';

  let message = null;

  if (activeAgent === 'gap-detector') {
    message = handleGapDetector(context);
  } else if (activeAgent === 'pdca-iterator') {
    message = handlePdcaIterator(context);
  } else if (activeAgent === 'report-generator') {
    message = handleReportGenerator(context);
  } else if (activeSkill) {
    message = `[leeloo-kit] ${activeSkill} 세션 종료.`;
  }

  if (message) {
    allowWithMessage(message);
  } else {
    respond({ decision: 'allow' });
  }
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
});
