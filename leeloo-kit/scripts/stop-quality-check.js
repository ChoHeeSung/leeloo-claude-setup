'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { readStdin, respond, stopApprove } = require('./lib/io');
const { loadConfig } = require('./lib/config');
const { loadEditedFiles, clearEditedFiles, classifyByLanguage } = require('./lib/edit-accumulator');
const { appendFailure } = require('./lib/failure-log');

/**
 * stop-quality-check.js — 배치 품질체크 (Stop 이벤트)
 *
 * ECC 패턴: 편집 시 경로만 수집 → Stop에서 일괄 lint/typecheck
 * Back-pressure: 0건이면 침묵, N건이면 보고
 */

// ── 언어별 도구 탐지 ──

function detectJsCommands(projectRoot) {
  const commands = [];
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) return commands;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const scripts = pkg.scripts || {};
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (scripts.lint) {
      commands.push({ cmd: 'npm', args: ['run', 'lint', '--', '--quiet'], label: 'lint', perFile: false });
    } else if (deps.eslint) {
      commands.push({ cmd: 'npx', args: ['eslint', '--quiet', '--no-error-on-unmatched-pattern'], label: 'eslint', perFile: true });
    } else if (deps['@biomejs/biome']) {
      commands.push({ cmd: 'npx', args: ['biome', 'check', '--no-errors-on-unmatched'], label: 'biome', perFile: true });
    }

    if (scripts.typecheck || scripts['type-check']) {
      const scriptName = scripts.typecheck ? 'typecheck' : 'type-check';
      commands.push({ cmd: 'npm', args: ['run', scriptName], label: 'typecheck', perFile: false });
    } else if (deps.typescript) {
      commands.push({ cmd: 'npx', args: ['tsc', '--noEmit', '--pretty'], label: 'tsc', perFile: false });
    }
  } catch (e) { /* ignore */ }

  return commands;
}

function detectPythonCommands(projectRoot) {
  const commands = [];
  const hasPyConfig = fs.existsSync(path.join(projectRoot, 'pyproject.toml')) ||
    fs.existsSync(path.join(projectRoot, 'setup.py'));
  if (!hasPyConfig && !fs.readdirSync(projectRoot).some(f => f.endsWith('.py'))) return commands;

  if (isAvailable('ruff')) {
    commands.push({ cmd: 'ruff', args: ['check', '--quiet'], label: 'ruff', perFile: true });
  }
  if (isAvailable('mypy')) {
    commands.push({ cmd: 'mypy', args: ['--no-error-summary'], label: 'mypy', perFile: true });
  }

  return commands;
}

function detectErlangCommands(projectRoot) {
  const commands = [];
  if (fs.existsSync(path.join(projectRoot, 'rebar.config'))) {
    commands.push({ cmd: 'rebar3', args: ['compile'], label: 'rebar3', perFile: false });
    if (isAvailable('dialyzer')) {
      commands.push({ cmd: 'rebar3', args: ['dialyzer'], label: 'dialyzer', perFile: false });
    }
  }
  return commands;
}

function detectElixirCommands(projectRoot) {
  const commands = [];
  if (fs.existsSync(path.join(projectRoot, 'mix.exs'))) {
    commands.push({ cmd: 'mix', args: ['compile', '--warnings-as-errors'], label: 'mix', perFile: false });
    if (fs.existsSync(path.join(projectRoot, '.credo.exs')) ||
        fs.existsSync(path.join(projectRoot, 'config/.credo.exs'))) {
      commands.push({ cmd: 'mix', args: ['credo', '--strict'], label: 'credo', perFile: false });
    }
  }
  return commands;
}

function detectJavaCommands(projectRoot) {
  const commands = [];
  if (fs.existsSync(path.join(projectRoot, 'pom.xml'))) {
    commands.push({ cmd: 'mvn', args: ['compile', '-q'], label: 'mvn', perFile: false });
  } else if (fs.existsSync(path.join(projectRoot, 'build.gradle')) ||
             fs.existsSync(path.join(projectRoot, 'build.gradle.kts'))) {
    commands.push({ cmd: 'gradle', args: ['compileJava', '-q'], label: 'gradle', perFile: false });
  }
  return commands;
}

function detectGoCommands(projectRoot) {
  const commands = [];
  if (fs.existsSync(path.join(projectRoot, 'go.mod'))) {
    commands.push({ cmd: 'go', args: ['vet', './...'], label: 'go vet', perFile: false });
    if (isAvailable('golangci-lint')) {
      commands.push({ cmd: 'golangci-lint', args: ['run', '--fast'], label: 'golangci-lint', perFile: false });
    }
  }
  return commands;
}

function detectRustCommands(projectRoot) {
  const commands = [];
  if (fs.existsSync(path.join(projectRoot, 'Cargo.toml'))) {
    commands.push({ cmd: 'cargo', args: ['check', '--quiet'], label: 'cargo check', perFile: false });
    commands.push({ cmd: 'cargo', args: ['clippy', '--quiet', '--', '-D', 'warnings'], label: 'clippy', perFile: false });
  }
  return commands;
}

function detectHtmlCommands() {
  const commands = [];
  if (isAvailable('htmlhint')) {
    commands.push({ cmd: 'htmlhint', args: [], label: 'htmlhint', perFile: true });
  }
  return commands;
}

function isAvailable(cmd) {
  const result = spawnSync('sh', ['-c', `command -v ${cmd}`], { stdio: 'ignore', timeout: 3000 });
  return result.status === 0;
}

// ── 배치 실행 ──

function runBatchCheck(language, files, projectRoot) {
  const detectors = {
    'js': detectJsCommands,
    'python': detectPythonCommands,
    'erlang': detectErlangCommands,
    'elixir': detectElixirCommands,
    'java': detectJavaCommands,
    'go': detectGoCommands,
    'rust': detectRustCommands,
    'html': detectHtmlCommands
  };

  const detector = detectors[language];
  if (!detector) return [];

  const commands = detector(projectRoot);
  if (commands.length === 0) return [];

  const errors = [];

  for (const cmd of commands) {
    try {
      let args = [...cmd.args];

      // perFile: 파일별로 실행 (lint류)
      if (cmd.perFile && files.length > 0) {
        // 존재하는 파일만 필터
        const existingFiles = files.filter(f => fs.existsSync(f));
        if (existingFiles.length === 0) continue;
        args = [...args, ...existingFiles];
      }

      const result = spawnSync(cmd.cmd, args, {
        cwd: projectRoot,
        timeout: 30000,  // 배치 처리이므로 타임아웃 넉넉하게
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      });

      if (result.status !== 0 && result.status !== null) {
        const stderr = (result.stderr || '').trim();
        const stdout = (result.stdout || '').trim();
        const output = (stderr || stdout).split('\n').slice(0, 10).join('\n');
        if (output) {
          errors.push({ label: cmd.label, output, language });
        }
      }
    } catch (e) {
      // 명령 실행 실패: 도구 미설치 등, 무시
    }
  }

  return errors;
}

// ── 메인 ──

async function main() {
  let event = {};
  try {
    event = await readStdin();
  } catch (e) {
    respond({});
    return;
  }

  const config = loadConfig();
  const autoCheck = config.harness && config.harness.backPressure && config.harness.backPressure.autoCheck;
  if (!autoCheck || !autoCheck.enabled) {
    respond({});
    return;
  }

  // 축적된 편집 파일 로드
  const files = loadEditedFiles();
  if (files.length === 0) {
    respond({});
    return;
  }

  const projectRoot = process.cwd();
  const groups = classifyByLanguage(files);
  const allErrors = [];

  // 언어별 배치 실행
  for (const [language, langFiles] of Object.entries(groups)) {
    if (langFiles.length === 0) continue;
    const errors = runBatchCheck(language, langFiles, projectRoot);
    allErrors.push(...errors);
  }

  // 편집 파일 목록 초기화
  clearEditedFiles();

  if (allErrors.length === 0) {
    // 품질체크 통과: 침묵
    respond({});
    return;
  }

  // 실패: 보고
  const failureEnabled = config.harness && config.harness.failureMemory && config.harness.failureMemory.enabled;
  const report = allErrors.map(e => `[${e.label}] ${e.output}`).join('\n\n');

  // failure-log에 기록
  if (failureEnabled) {
    for (const e of allErrors) {
      try {
        appendFailure({
          pattern: `quality-check ${e.label}`,
          command: `batch ${e.label}`,
          error: e.output.slice(0, 500),
          exitCode: 1,
          timestamp: new Date().toISOString(),
          type: 'lint'
        });
      } catch (err) { /* ignore */ }
    }
  }

  stopApprove(
    `[leeloo-kit] 배치 품질체크: ${allErrors.length}건 실패\n` +
    `편집 파일 ${files.length}개 검사 완료.\n\n${report}`
  );
}

main().catch(() => {
  process.stdout.write(JSON.stringify({}) + '\n');
});
