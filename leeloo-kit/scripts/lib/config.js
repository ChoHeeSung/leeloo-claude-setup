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
      version: '2.0.0',
      pdca: {
        docPaths: {
          plan: 'docs/plan/{feature}.plan.md',
          design: 'docs/design/{feature}.design.md',
          analysis: 'docs/analysis/{feature}.analysis.md',
          report: 'docs/report/{feature}.report.md'
        },
        matchRateThreshold: 90,
        autoIterate: true,
        maxIterations: 5
      },
      crossValidation: {
        enabled: true,
        maxRetries: 3,
        passThreshold: 80,
        concernsThreshold: 60
      },
      statePaths: {
        root: '.leeloo',
        pdcaStatus: '.leeloo/pdca-status.json',
        activeContext: '.leeloo/active-context.json'
      }
    };
  }

  return _config;
}

/**
 * docPaths에서 경로 생성 ({feature} 치환)
 * @param {string} phase - plan|design|analysis|report
 * @param {string} feature - 기능명
 * @returns {string}
 */
function getDocPath(phase, feature) {
  const config = loadConfig();
  const template = (config.pdca && config.pdca.docPaths && config.pdca.docPaths[phase]) || '';
  return template.replace('{feature}', feature || 'unknown');
}

module.exports = { loadConfig, getDocPath };
