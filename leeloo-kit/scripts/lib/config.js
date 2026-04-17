'use strict';

const fs = require('fs');
const path = require('path');

/**
 * config.js — leeloo.config.json 로더
 */

let _config = null;

/**
 * CLAUDE_PLUGIN_ROOT/leeloo.config.json 읽기
 * @returns {object}
 */
function loadConfig() {
  if (_config) return _config;

  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || process.cwd();
  const configPath = path.join(pluginRoot, 'leeloo.config.json');

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    _config = JSON.parse(raw);
  } catch (e) {
    // 설정 파일 없으면 기본값 반환
    _config = {
      harness: {
        failureMemory: {
          enabled: true,
          repeatThreshold: 2,
          maxEntriesPerType: 10,
          summaryCount: 3,
          targetSection: '## Failure Memory'
        },
        backPressure: {
          silentOnSuccess: true,
          verboseOnFailure: true,
          autoCheck: {
            enabled: true,
            extensions: ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.go', '.rs', '.erl', '.ex', '.exs', '.html', '.htm'],
            commands: [],
            autoDetect: true
          }
        },
        failureTypes: {
          build: ['npm run build', 'tsc', 'webpack', 'vite build', 'esbuild'],
          test: ['npm test', 'jest', 'vitest', 'pytest', 'mocha'],
          lint: ['eslint', 'prettier', 'biome', 'stylelint'],
          git: ['git push', 'git merge', 'git rebase', 'git pull', 'git checkout'],
          dependency: ['npm install', 'npm ci', 'pip install', 'yarn', 'pnpm install'],
          'file-io': ['Write', 'Edit'],
          mcp: ['mcp_'],
          judgment: []
        }
      },
      crossValidation: {
        enabled: true,
        maxRetries: 3,
        passThreshold: 80,
        concernsThreshold: 60
      },
      statePaths: {
        root: '.leeloo',
        failureLog: '.leeloo/failure-log.json',
        failureMemory: '.leeloo/failure-memory',
        failureArchive: '.leeloo/failure-archive',
        activeContext: '.leeloo/active-context.json',
        sessions: '.leeloo/sessions',
        mcpHealth: '.leeloo/mcp-health.json',
        compactionLog: '.leeloo/compaction-log.txt',
        editedFiles: '.leeloo/edited-files.tmp'
      }
    };
  }

  return _config;
}

module.exports = { loadConfig };
