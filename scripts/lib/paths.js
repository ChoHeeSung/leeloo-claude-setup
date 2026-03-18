'use strict';

const fs = require('fs');
const path = require('path');
const { loadConfig } = require('./config');

/**
 * paths.js — 상태 파일 경로 레지스트리
 * 프로젝트 루트 = process.cwd()
 */

/**
 * .leeloo/ 디렉토리 생성 (없으면)
 */
function ensureStateDir() {
  const config = loadConfig();
  const stateRoot = path.join(process.cwd(), config.statePaths.root || '.leeloo');
  if (!fs.existsSync(stateRoot)) {
    fs.mkdirSync(stateRoot, { recursive: true });
  }
  return stateRoot;
}

/**
 * statePaths에서 경로 반환
 * @param {string} key - statePaths의 키 (예: 'pdcaStatus', 'activeContext')
 * @returns {string} 절대 경로
 */
function getStatePath(key) {
  const config = loadConfig();
  const relativePath = config.statePaths[key];
  if (!relativePath) {
    throw new Error(`statePaths에 '${key}' 키가 없습니다.`);
  }
  return path.join(process.cwd(), relativePath);
}

module.exports = { ensureStateDir, getStatePath };
