'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { readStdin, respond, sessionMessage } = require('./lib/io');
const { ensureStateDir } = require('./lib/paths');
const { loadStatus } = require('./lib/pdca-status');

function isCommandAvailable(cmd) {
  const result = spawnSync('which', [cmd], { stdio: 'ignore' });
  return result.status === 0;
}

async function main() {
  try {
    await readStdin();
  } catch (e) {
    // stdin 파싱 실패해도 계속 진행
  }

  const messages = [];

  // 1. .leeloo/ 디렉토리 생성
  try {
    ensureStateDir();
  } catch (e) {
    // 무시
  }

  // 2. Node.js 버전 확인 (v18+ 필요)
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0], 10);
  if (majorVersion < 18) {
    messages.push(`[경고] Node.js ${nodeVersion} 감지됨. leeloo-kit은 v18+ 를 권장합니다.`);
  }

  // 3. gemini-cli 존재 확인
  const geminiAvailable = isCommandAvailable('gemini') || isCommandAvailable('gemini-cli');
  if (!geminiAvailable) {
    messages.push('[안내] gemini-cli 미설치. 교차검증(/lk-cross-validate)에 필요: npm install -g @google/gemini-cli');
  }

  // 4. pdca-status.json 로드
  try {
    const status = loadStatus();
    const features = Object.keys(status);
    if (features.length > 0) {
      const activeFeatures = features.filter((f) => status[f].phase && status[f].phase !== 'done');
      if (activeFeatures.length > 0) {
        messages.push('진행 중인 PDCA:');
        activeFeatures.forEach((f) => {
          const updatedAt = status[f].updatedAt ? status[f].updatedAt.slice(0, 10) : '';
          messages.push(`  - ${f}: ${status[f].phase} (${updatedAt})`);
        });
      }
    }
  } catch (e) {
    // 무시
  }

  // 5. TODO.md 존재 시 진행률 표시
  const todoPath = path.join(process.cwd(), 'TODO.md');
  if (fs.existsSync(todoPath)) {
    try {
      const todoContent = fs.readFileSync(todoPath, 'utf8');
      const completedMatch = todoContent.match(/완료:\s*(\d+)\/(\d+)/);
      if (completedMatch) {
        const done = parseInt(completedMatch[1], 10);
        const total = parseInt(completedMatch[2], 10);
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        messages.push(`TODO 진행률: ${done}/${total} (${pct}%)`);
      }
    } catch (e) {
      // 무시
    }
  }

  // 출력
  const systemMsg = messages.length > 0
    ? ['leeloo-kit v2.0.0', ...messages].join('\n')
    : 'leeloo-kit v2.0.0 세션 시작';

  sessionMessage(systemMsg);
}

main().catch(() => {
  respond({});
});
