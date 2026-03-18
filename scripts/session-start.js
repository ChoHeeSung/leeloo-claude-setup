'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { readStdin, allowWithMessage } = require('./lib/io');
const { ensureStateDir } = require('./lib/paths');
const { loadStatus } = require('./lib/pdca-status');

function isCommandAvailable(cmd) {
  const result = spawnSync('which', [cmd], { stdio: 'ignore' });
  return result.status === 0;
}

async function main() {
  // stdin 이벤트 읽기 (SessionStart)
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
    messages.push('[안내] gemini-cli가 설치되어 있지 않습니다. 교차검증(/lk-cross-validate) 기능을 사용하려면 gemini-cli를 설치하세요: npm install -g @google/generative-ai-cli');
  }

  // 4. pdca-status.json 로드 → 현재 활성 feature/phase 표시
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
      const totalTasks = (todoContent.match(/- \[[ x]\]/g) || []).length;
      const doneTasks = (todoContent.match(/- \[x\]/gi) || []).length;
      if (totalTasks > 0) {
        const pct = Math.round((doneTasks / totalTasks) * 100);
        messages.push(`TODO 진행률: ${doneTasks}/${totalTasks} (${pct}%)`);
      }
    } catch (e) {
      // 무시
    }
  }

  // 출력
  const systemMessage = messages.length > 0
    ? ['leeloo-kit v2.0.0 세션 시작', ...messages].join('\n')
    : 'leeloo-kit v2.0.0 세션 시작. /lk-plan, /lk-pdca, /lk-cross-validate 등의 스킬을 사용할 수 있습니다.';

  allowWithMessage(systemMessage);
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
});
