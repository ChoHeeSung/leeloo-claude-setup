'use strict';

const fs = require('fs');
const path = require('path');
const { ensureStateDir } = require('./paths');

/**
 * edit-accumulator.js — 편집 파일 경로 수집/읽기 유틸리티
 *
 * ECC 패턴: PostToolUse에서 경로만 수집 → Stop에서 일괄 품질체크
 * 파일: .leeloo/edited-files.tmp (세션 내 임시)
 */

const MAX_FILES = 100;

function getAccumulatorPath() {
  const stateDir = ensureStateDir();
  return path.join(stateDir, 'edited-files.tmp');
}

/**
 * 편집된 파일 경로 추가 (중복 제거)
 */
function addEditedFile(filePath) {
  if (!filePath) return;

  const accPath = getAccumulatorPath();
  let files = loadEditedFiles();

  // 중복 제거
  if (!files.includes(filePath)) {
    files.push(filePath);
  }

  // FIFO: MAX_FILES 초과 시 오래된 것 제거
  if (files.length > MAX_FILES) {
    files = files.slice(files.length - MAX_FILES);
  }

  fs.writeFileSync(accPath, files.join('\n') + '\n', 'utf8');
}

/**
 * 축적된 편집 파일 목록 로드
 */
function loadEditedFiles() {
  const accPath = getAccumulatorPath();
  if (!fs.existsSync(accPath)) return [];

  try {
    const content = fs.readFileSync(accPath, 'utf8').trim();
    if (!content) return [];
    return content.split('\n').filter(Boolean);
  } catch (e) {
    return [];
  }
}

/**
 * 축적된 파일 목록 초기화
 */
function clearEditedFiles() {
  const accPath = getAccumulatorPath();
  if (fs.existsSync(accPath)) {
    fs.unlinkSync(accPath);
  }
}

/**
 * 파일 확장자로 언어 분류
 */
function classifyByLanguage(files) {
  const groups = {
    'js': [],      // .js, .ts, .tsx, .jsx
    'python': [],  // .py
    'erlang': [],  // .erl, .hrl
    'elixir': [],  // .ex, .exs
    'java': [],    // .java
    'go': [],      // .go
    'rust': [],    // .rs
    'html': []     // .html, .htm
  };

  const extMap = {
    '.js': 'js', '.ts': 'js', '.tsx': 'js', '.jsx': 'js',
    '.py': 'python',
    '.erl': 'erlang', '.hrl': 'erlang',
    '.ex': 'elixir', '.exs': 'elixir',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.html': 'html', '.htm': 'html'
  };

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const lang = extMap[ext];
    if (lang && groups[lang]) {
      groups[lang].push(file);
    }
  }

  return groups;
}

module.exports = {
  addEditedFile,
  loadEditedFiles,
  clearEditedFiles,
  classifyByLanguage
};
