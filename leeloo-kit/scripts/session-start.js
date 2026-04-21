'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { readStdin, respond, sessionMessage } = require('./lib/io');
const { ensureStateDir } = require('./lib/paths');
const { getFailureMemoryStats } = require('./lib/failure-log');

function isCommandAvailable(cmd) {
  // POSIX 호환: 'which' 대신 'command -v' 사용 (최소 설치 Linux 지원)
  const result = spawnSync('sh', ['-c', `command -v ${cmd}`], { stdio: 'ignore', timeout: 3000 });
  return result.status === 0;
}

function getPluginVersion() {
  try {
    const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
    const pkg = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'plugin.json'), 'utf8'));
    return pkg.version || '';
  } catch (e) {
    return '';
  }
}

/**
 * 활성 페르소나 요약 로드 (.claude/settings.local.json → .claude/output-styles/<name>.md)
 */
function loadActivePersona() {
  try {
    const cwd = process.cwd();
    const settingsPath = path.join(cwd, '.claude', 'settings.local.json');
    if (!fs.existsSync(settingsPath)) return null;

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const name = settings.outputStyle;
    if (!name || typeof name !== 'string') return null;

    const personaPath = path.join(cwd, '.claude', 'output-styles', `${name}.md`);
    if (!fs.existsSync(personaPath)) {
      return { name, orphan: true };
    }

    const content = fs.readFileSync(personaPath, 'utf8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let description = '';
    if (fmMatch) {
      const descLine = fmMatch[1].split('\n').find((l) => /^description\s*:/i.test(l));
      if (descLine) {
        description = descLine.replace(/^description\s*:\s*/i, '').trim();
        if (description.startsWith('"') && description.endsWith('"')) {
          description = description.slice(1, -1);
        }
      }
    }
    if (description.length > 120) description = description.slice(0, 120) + '...';

    return { name, description, orphan: false };
  } catch (e) {
    return null;
  }
}

/**
 * 이전 세션 요약 로드 (.leeloo/sessions/ 최신 파일)
 */
function loadPreviousSessionSummary() {
  try {
    const sessDir = path.join(process.cwd(), '.leeloo/sessions');
    if (!fs.existsSync(sessDir)) return null;

    const files = fs.readdirSync(sessDir)
      .filter(f => f.endsWith('-session.md'))
      .sort()
      .reverse();

    if (files.length === 0) return null;

    const content = fs.readFileSync(path.join(sessDir, files[0]), 'utf8');

    // HTML 주석 마커에서 요약 추출
    const startMarker = '<!-- LEELOO:SUMMARY:START -->';
    const endMarker = '<!-- LEELOO:SUMMARY:END -->';
    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);

    if (startIdx !== -1 && endIdx !== -1) {
      const summary = content.slice(startIdx + startMarker.length, endIdx).trim();
      // 최대 800자로 요약 (작업 맥락 포함 시 여유 확보)
      return summary.length > 800 ? summary.slice(0, 800) + '...' : summary;
    }

    return null;
  } catch (e) {
    return null;
  }
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

  // 4. 활성 페르소나 요약
  try {
    const persona = loadActivePersona();
    if (persona) {
      if (persona.orphan) {
        messages.push(`페르소나: ${persona.name} (파일 없음 — /lk-persona list 확인)`);
      } else {
        const tail = persona.description ? ` — ${persona.description}` : '';
        messages.push(`페르소나: ${persona.name}${tail}`);
      }
    }
  } catch (e) {
    // 무시
  }

  // 5. 이전 세션 요약 로드
  try {
    const prevSummary = loadPreviousSessionSummary();
    if (prevSummary) {
      messages.push(`이전 세션 요약:\n${prevSummary}`);
    }
  } catch (e) {
    // 무시
  }

  // 6. Failure Memory 상태 표시
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

  // 7. 린터/타입체커 미설치 감지 (다언어 확장)
  try {
    const cwd = process.cwd();
    const lintDoneFlag = path.join(cwd, '.leeloo', 'lint-setup-done');

    if (!fs.existsSync(lintDoneFlag)) {
      const missing = [];

      // Node.js 프로젝트
      const pkgPath = path.join(cwd, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
          const scripts = pkg.scripts || {};

          const hasLint = allDeps.eslint || allDeps['@biomejs/biome'] || scripts.lint;
          if (!hasLint) {
            missing.push({ tool: 'eslint', cmd: 'npm install --save-dev eslint', type: 'Node.js 린터' });
          }

          const hasTsFiles = fs.readdirSync(cwd).some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
          const tsconfigExists = fs.existsSync(path.join(cwd, 'tsconfig.json'));
          if ((hasTsFiles || tsconfigExists) && !allDeps.typescript) {
            missing.push({ tool: 'typescript', cmd: 'npm install --save-dev typescript', type: 'TypeScript 컴파일러' });
          }
        } catch (e) { /* ignore */ }
      }

      // Python 프로젝트
      const hasPyProject = fs.existsSync(path.join(cwd, 'pyproject.toml'));
      const hasPyFiles = hasPyProject || fs.readdirSync(cwd).some(f => f.endsWith('.py'));
      if (hasPyFiles) {
        if (!isCommandAvailable('ruff')) {
          missing.push({ tool: 'ruff', cmd: 'pip install ruff', type: 'Python 린터' });
        }
      }

      // Elixir 프로젝트
      if (fs.existsSync(path.join(cwd, 'mix.exs'))) {
        const mixLock = path.join(cwd, 'mix.lock');
        if (fs.existsSync(mixLock)) {
          const lockContent = fs.readFileSync(mixLock, 'utf8');
          if (!lockContent.includes('credo')) {
            missing.push({ tool: 'credo', cmd: 'mix.exs deps에 {:credo, "~> 1.7", only: [:dev, :test]} 추가', type: 'Elixir 린터' });
          }
        }
      }

      // Java 프로젝트
      if (fs.existsSync(path.join(cwd, 'pom.xml'))) {
        if (!isCommandAvailable('mvn')) {
          missing.push({ tool: 'maven', cmd: 'brew install maven (macOS) 또는 sdk install maven', type: 'Java 빌드' });
        }
      } else if (fs.existsSync(path.join(cwd, 'build.gradle')) || fs.existsSync(path.join(cwd, 'build.gradle.kts'))) {
        if (!isCommandAvailable('gradle')) {
          missing.push({ tool: 'gradle', cmd: 'brew install gradle (macOS) 또는 sdk install gradle', type: 'Java 빌드' });
        }
      }

      // Go 프로젝트
      if (fs.existsSync(path.join(cwd, 'go.mod'))) {
        if (!isCommandAvailable('go')) {
          missing.push({ tool: 'go', cmd: 'brew install go (macOS) 또는 https://go.dev/dl/', type: 'Go 컴파일러' });
        } else if (!isCommandAvailable('golangci-lint')) {
          missing.push({ tool: 'golangci-lint', cmd: 'go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest', type: 'Go 린터' });
        }
      }

      // Rust 프로젝트
      if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) {
        if (!isCommandAvailable('cargo')) {
          missing.push({ tool: 'cargo', cmd: 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh', type: 'Rust 툴체인' });
        }
      }

      // HTML 프로젝트 (html 파일이 3개 이상일 때만)
      const htmlFiles = fs.readdirSync(cwd).filter(f => f.endsWith('.html') || f.endsWith('.htm'));
      if (htmlFiles.length >= 3 && !isCommandAvailable('htmlhint')) {
        missing.push({ tool: 'htmlhint', cmd: 'npm install -g htmlhint', type: 'HTML 린터' });
      }

      if (missing.length > 0) {
        const toolList = missing.map(m => `  - ${m.type}: ${m.tool} (${m.cmd})`).join('\n');
        messages.push(
          `[하네스] 린터/타입체커 미설치 감지:\n${toolList}\n` +
          `→ 사용자에게 설치 여부를 확인하세요. 설치 완료 또는 거부 시 .leeloo/lint-setup-done 파일을 생성하여 이 안내를 중지하세요.`
        );
      } else {
        ensureStateDir();
        fs.writeFileSync(lintDoneFlag, new Date().toISOString(), 'utf8');
      }
    }
  } catch (e) {
    // 무시
  }

  // 8. TODO*.md 파일들 진행률 표시
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
  const version = getPluginVersion();
  const banner = version ? `leeloo-kit v${version}` : 'leeloo-kit';
  const systemMsg = messages.length > 0
    ? [banner, ...messages].join('\n')
    : `${banner} 세션 시작`;

  sessionMessage(systemMsg);
}

main().catch(() => {
  respond({});
});
