'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { readStdin, respond, sessionMessage } = require('./lib/io');
const { ensureStateDir } = require('./lib/paths');
const { getFailureMemoryStats } = require('./lib/failure-log');

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

  // 4. Failure Memory 상태 표시
  try {
    const stats = getFailureMemoryStats();
    if (stats) {
      const typeSummary = Object.entries(stats.stats)
        .map(([type, count]) => `${type}(${count})`)
        .join(', ');
      messages.push(`실패 패턴 ${stats.total}건 활성: ${typeSummary} — .leeloo/failure-memory/ 참조`);
    }
  } catch (e) {
    // 무시
  }

  // 5. 린터/타입체커 미설치 감지
  try {
    const cwd = process.cwd();
    const lintDoneFlag = path.join(cwd, '.leeloo', 'lint-setup-done');

    // 이미 설치 확인 완료했으면 건너뜀
    if (!fs.existsSync(lintDoneFlag)) {
      const missing = [];

      // Node.js 프로젝트
      const pkgPath = path.join(cwd, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
          const scripts = pkg.scripts || {};

          // lint 도구 확인
          const hasLint = allDeps.eslint || allDeps['@biomejs/biome'] || scripts.lint;
          if (!hasLint) {
            missing.push({ tool: 'eslint', cmd: 'npm install --save-dev eslint', type: 'Node.js 린터' });
          }

          // TypeScript 프로젝트인데 tsc 없는 경우
          const hasTsFiles = fs.readdirSync(cwd).some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
          const tsconfigExists = fs.existsSync(path.join(cwd, 'tsconfig.json'));
          if ((hasTsFiles || tsconfigExists) && !allDeps.typescript) {
            missing.push({ tool: 'typescript', cmd: 'npm install --save-dev typescript', type: 'TypeScript 컴파일러' });
          }
        } catch (e) { /* ignore */ }
      }

      // Python 프로젝트
      const pyprojectPath = path.join(cwd, 'pyproject.toml');
      const hasPyFiles = fs.existsSync(pyprojectPath) ||
        (fs.existsSync(cwd) && fs.readdirSync(cwd).some(f => f.endsWith('.py')));
      if (hasPyFiles) {
        if (!isCommandAvailable('ruff')) {
          missing.push({ tool: 'ruff', cmd: 'pip install ruff', type: 'Python 린터' });
        }
      }

      // Elixir 프로젝트
      if (fs.existsSync(path.join(cwd, 'mix.exs'))) {
        const mixDeps = path.join(cwd, 'mix.lock');
        if (fs.existsSync(mixDeps)) {
          const lockContent = fs.readFileSync(mixDeps, 'utf8');
          if (!lockContent.includes('credo')) {
            missing.push({ tool: 'credo', cmd: 'mix.exs deps에 {:credo, "~> 1.7", only: [:dev, :test]} 추가 후 mix deps.get', type: 'Elixir 린터' });
          }
        }
      }

      if (missing.length > 0) {
        const toolList = missing.map(m => `  - ${m.type}: ${m.tool} (${m.cmd})`).join('\n');
        messages.push(
          `[하네스] 린터/타입체커 미설치 감지:\n${toolList}\n` +
          `→ 사용자에게 설치 여부를 확인하세요. 설치 완료 또는 거부 시 .leeloo/lint-setup-done 파일을 생성하여 이 안내를 중지하세요.`
        );
      } else {
        // 린터가 이미 있거나 해당 프로젝트가 아님 → 플래그 생성하여 다음 세션부터 건너뜀
        ensureStateDir();
        fs.writeFileSync(lintDoneFlag, new Date().toISOString(), 'utf8');
      }
    }
  } catch (e) {
    // 무시
  }

  // 6. TODO*.md 파일들 진행률 표시
  try {
    const cwd = process.cwd();
    const todoFiles = fs.readdirSync(cwd).filter(
      (f) => f.startsWith('TODO') && f.endsWith('.md')
    );
    let totalDone = 0;
    let totalAll = 0;
    const todoLines = [];
    todoFiles.forEach((file) => {
      try {
        const content = fs.readFileSync(path.join(cwd, file), 'utf8');
        const completedMatch = content.match(/완료:\s*(\d+)\/(\d+)/);
        if (completedMatch) {
          const done = parseInt(completedMatch[1], 10);
          const total = parseInt(completedMatch[2], 10);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const label = file === 'TODO.md' ? 'TODO' : file.replace(/\.md$/, '');
          todoLines.push(`  - ${label}: ${done}/${total} (${pct}%)`);
          totalDone += done;
          totalAll += total;
        }
      } catch (e) {
        // 개별 파일 읽기 실패 무시
      }
    });
    if (totalAll > 0) {
      const totalPct = Math.round((totalDone / totalAll) * 100);
      messages.push(`TODO 전체: ${totalDone}/${totalAll} (${totalPct}%)`);
      todoLines.forEach((line) => messages.push(line));
    }
  } catch (e) {
    // 무시
  }

  // 출력
  const systemMsg = messages.length > 0
    ? ['leeloo-kit v3.0.0', ...messages].join('\n')
    : 'leeloo-kit v3.0.0 세션 시작';

  sessionMessage(systemMsg);
}

main().catch(() => {
  respond({});
});
