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
 * .leeloo/failure-memory/ 디렉토리 생성 (없으면)
 */
function ensureFailureMemoryDir() {
  const config = loadConfig();
  const memDir = path.join(process.cwd(), config.statePaths.failureMemory || '.leeloo/failure-memory');
  if (!fs.existsSync(memDir)) {
    fs.mkdirSync(memDir, { recursive: true });
  }
  return memDir;
}

/**
 * .leeloo/failure-archive/ 디렉토리 생성 (없으면)
 */
function ensureFailureArchiveDir() {
  const config = loadConfig();
  const archDir = path.join(process.cwd(), config.statePaths.failureArchive || '.leeloo/failure-archive');
  if (!fs.existsSync(archDir)) {
    fs.mkdirSync(archDir, { recursive: true });
  }
  return archDir;
}

/**
 * statePaths에서 경로 반환
 * @param {string} key - statePaths의 키 (예: 'failureLog', 'activeContext')
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

module.exports = { ensureStateDir, ensureFailureMemoryDir, ensureFailureArchiveDir, getStatePath };
