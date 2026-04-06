'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { readStdin, respond, postContext } = require('./lib/io');
const { loadConfig } = require('./lib/config');
const { appendFailure, getRepeatedFailures } = require('./lib/failure-log');

/**
 * tool-failure-post.js — Write|Edit 및 MCP 도구 실패 감지 + 소스 품질 검사 (PostToolUse)
 *
 * 두 가지 역할:
 * 1. 도구 실행 에러 감지 → failure-log 기록
 * 2. Write|Edit 성공 시 소스 파일이면 자동 lint/typecheck 실행 (back-pressure)
 */

// ── 에러 감지 ──

function detectError(toolResponse) {
  if (!toolResponse) return null;

  const responseStr = typeof toolResponse === 'string'
    ? toolResponse
    : JSON.stringify(toolResponse);

  if (toolResponse.error) return toolResponse.error;
  if (toolResponse.Error) return toolResponse.Error;

  const errorPatterns = [
    /error[:\s]/i,
    /failed[:\s]/i,
    /ENOENT/,
    /EACCES/,
    /EPERM/,
    /permission denied/i,
    /no such file/i,
    /not found/i,
    /cannot (?:read|write|access)/i,
    /timed? ?out/i
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(responseStr)) {
      const lines = responseStr.split('\n');
      const errorLine = lines.find(l => pattern.test(l)) || lines[0];
      return errorLine.slice(0, 200);
    }
  }

  return null;
}

function classifyToolFailure(toolName) {
  if (!toolName) return 'general';
  if (toolName === 'Write' || toolName === 'Edit') return 'file-io';
  if (toolName.startsWith('mcp_')) return 'mcp';
  return 'general';
}

// ── 소스 품질 검사 (Back-Pressure) ──

/**
 * 프로젝트 루트에서 사용 가능한 검증 명령 자동 탐지
 */
function detectCheckCommands(projectRoot) {
  const commands = [];

  // package.json 기반 탐지
  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const scripts = pkg.scripts || {};
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      // lint 명령 탐지
      if (scripts.lint) {
        commands.push({ cmd: 'npm', args: ['run', 'lint', '--', '--quiet'], label: 'lint' });
      } else if (deps.eslint) {
        commands.push({ cmd: 'npx', args: ['eslint', '--quiet', '--no-error-on-unmatched-pattern'], label: 'eslint' });
      } else if (deps['@biomejs/biome']) {
        commands.push({ cmd: 'npx', args: ['biome', 'check', '--no-errors-on-unmatched'], label: 'biome' });
      }

      // typecheck 명령 탐지
      if (scripts.typecheck || scripts['type-check']) {
        const scriptName = scripts.typecheck ? 'typecheck' : 'type-check';
        commands.push({ cmd: 'npm', args: ['run', scriptName], label: 'typecheck' });
      } else if (deps.typescript) {
        commands.push({ cmd: 'npx', args: ['tsc', '--noEmit', '--pretty'], label: 'tsc' });
      }
    } catch (e) { /* ignore */ }
  }

  // Erlang/Elixir 기반 탐지
  if (fs.existsSync(path.join(projectRoot, 'rebar.config'))) {
    commands.push({ cmd: 'rebar3', args: ['compile'], label: 'rebar3' });
    const dialyzerCheck = spawnSync('which', ['dialyzer'], { stdio: 'ignore' });
    if (dialyzerCheck.status === 0) {
      commands.push({ cmd: 'rebar3', args: ['dialyzer'], label: 'dialyzer' });
    }
  } else if (fs.existsSync(path.join(projectRoot, 'mix.exs'))) {
    commands.push({ cmd: 'mix', args: ['compile', '--warnings-as-errors'], label: 'mix' });
    if (fs.existsSync(path.join(projectRoot, '.credo.exs')) || fs.existsSync(path.join(projectRoot, 'config/.credo.exs'))) {
      commands.push({ cmd: 'mix', args: ['credo', '--strict'], label: 'credo' });
    }
    const dialyxirDeps = spawnSync('mix', ['deps.get', '--check'], { cwd: projectRoot, stdio: 'ignore', timeout: 5000 });
    commands.push({ cmd: 'mix', args: ['dialyzer', '--quiet'], label: 'dialyxir' });
  }

  // pyproject.toml / setup.py 기반 탐지
  if (fs.existsSync(path.join(projectRoot, 'pyproject.toml'))) {
    // ruff 우선, 없으면 flake8
    const ruffCheck = spawnSync('which', ['ruff'], { stdio: 'ignore' });
    if (ruffCheck.status === 0) {
      commands.push({ cmd: 'ruff', args: ['check', '--quiet'], label: 'ruff' });
    }
    // mypy
    const mypyCheck = spawnSync('which', ['mypy'], { stdio: 'ignore' });
    if (mypyCheck.status === 0) {
      commands.push({ cmd: 'mypy', args: ['--no-error-summary'], label: 'mypy' });
    }
  }

  return commands;
}

/**
 * 저장된 파일에 대해 품질 검사 실행
 * Back-pressure: 성공은 침묵, 실패만 에러 출력
 */
function runQualityCheck(filePath, config) {
  const autoCheck = config.harness && config.harness.backPressure && config.harness.backPressure.autoCheck;
  if (!autoCheck || !autoCheck.enabled) return null;

  // 확장자 확인
  const ext = path.extname(filePath);
  const targetExts = autoCheck.extensions || ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.go', '.rs', '.erl', '.ex', '.exs'];
  if (!targetExts.includes(ext)) return null;

  const projectRoot = process.cwd();

  // 명시적 명령 또는 자동 탐지
  let commands = [];
  if (autoCheck.commands && autoCheck.commands.length > 0) {
    commands = autoCheck.commands.map(c => ({
      cmd: c.split(' ')[0],
      args: [...c.split(' ').slice(1), filePath],
      label: c.split(' ')[0]
    }));
  } else if (autoCheck.autoDetect !== false) {
    commands = detectCheckCommands(projectRoot);
    // 파일 경로를 인자에 추가 (lint 명령에만, typecheck는 프로젝트 전체)
    commands = commands.map(c => {
      if (c.label === 'eslint' || c.label === 'biome' || c.label === 'ruff') {
        return { ...c, args: [...c.args, filePath] };
      }
      return c;
    });
  }

  if (commands.length === 0) return null;

  // 실행 + 실패만 수집
  const errors = [];
  for (const cmd of commands) {
    try {
      const result = spawnSync(cmd.cmd, cmd.args, {
        cwd: projectRoot,
        timeout: 10000,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      });

      if (result.status !== 0 && result.status !== null) {
        const stderr = (result.stderr || '').trim();
        const stdout = (result.stdout || '').trim();
        // 에러 출력에서 핵심만 추출 (최대 10줄)
        const output = (stderr || stdout).split('\n').slice(0, 10).join('\n');
        if (output) {
          errors.push(`[${cmd.label}] ${output}`);
        }
      }
      // 성공: 침묵
    } catch (e) {
      // 명령 실행 자체 실패: 무시 (도구 미설치 등)
    }
  }

  return errors.length > 0 ? errors.join('\n\n') : null;
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
  const toolName = event.tool_name || '';
  const toolResponse = event.tool_response || {};
  const toolInput = event.tool_input || {};

  const failureEnabled = config.harness && config.harness.failureMemory && config.harness.failureMemory.enabled;

  // 1) 도구 에러 감지
  const errorMsg = detectError(toolResponse);

  if (errorMsg && failureEnabled) {
    let inputSummary = '';
    if (toolName === 'Write' || toolName === 'Edit') {
      inputSummary = toolInput.file_path || '';
    } else {
      const keys = Object.keys(toolInput);
      inputSummary = keys.length > 0 ? `${keys[0]}=${String(toolInput[keys[0]]).slice(0, 30)}` : '';
    }
    const pattern = `${toolName} ${inputSummary}`.trim();
    const type = classifyToolFailure(toolName);

    try {
      appendFailure({
        pattern,
        command: `${toolName}(${JSON.stringify(toolInput).slice(0, 200)})`,
        error: errorMsg.slice(0, 500),
        exitCode: null,
        timestamp: new Date().toISOString(),
        type
      });
    } catch (e) { /* ignore */ }

    const repeated = getRepeatedFailures();
    const thisRepeated = repeated.find(r => r.pattern === pattern);

    if (thisRepeated && thisRepeated.count >= 2) {
      postContext(
        `[leeloo-kit] ${toolName} 에러가 ${thisRepeated.count}회 반복: \`${pattern}\`\n` +
        `유형: ${type} | 세션 종료 시 .leeloo/failure-memory/${type}.md에 자동 기록.\n` +
        `이전과 다른 접근법을 시도하세요.`
      );
      return;
    }
  }

  // 2) Write|Edit 성공 시 소스 파일 품질 검사 (back-pressure)
  if ((toolName === 'Write' || toolName === 'Edit') && !errorMsg) {
    const filePath = toolInput.file_path || '';
    if (filePath) {
      const checkErrors = runQualityCheck(filePath, config);
      if (checkErrors) {
        // 실패: 에러 피드백 (back-pressure: 실패만 장황하게)
        postContext(
          `[leeloo-kit] 품질 검사 실패 — ${path.basename(filePath)}:\n${checkErrors}\n\n` +
          `위 오류를 수정하세요.`
        );

        // 품질 검사 실패도 failure-log에 기록
        if (failureEnabled) {
          try {
            appendFailure({
              pattern: `quality-check ${path.basename(filePath)}`,
              command: `${toolName} ${filePath}`,
              error: checkErrors.slice(0, 500),
              exitCode: 1,
              timestamp: new Date().toISOString(),
              type: 'lint'
            });
          } catch (e) { /* ignore */ }
        }
        return;
      }
    }
  }

  // 성공 + 품질 검사 통과: 침묵
  respond({});
}

main().catch(() => {
  process.stdout.write(JSON.stringify({}) + '\n');
});
