'use strict';

const fs = require('fs');
const { ensureStateDir, getStatePath } = require('./paths');

/**
 * pdca-status.js — PDCA 상태 관리
 */

/**
 * .leeloo/pdca-status.json 읽기 (없으면 빈 객체)
 * @returns {object}
 */
function loadStatus() {
  try {
    const filePath = getStatePath('pdcaStatus');
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

/**
 * .leeloo/pdca-status.json 쓰기
 * @param {object} data
 */
function saveStatus(data) {
  ensureStateDir();
  const filePath = getStatePath('pdcaStatus');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 특정 feature의 현재 phase 반환
 * @param {string} feature
 * @returns {string|null}
 */
function getFeatureStatus(feature) {
  const status = loadStatus();
  if (!status[feature]) return null;
  return status[feature].phase || null;
}

/**
 * feature 상태 갱신
 * @param {string} feature
 * @param {string} phase
 * @param {object} data - 추가 데이터
 */
function updateFeature(feature, phase, data) {
  const status = loadStatus();
  status[feature] = {
    ...(status[feature] || {}),
    phase,
    updatedAt: new Date().toISOString(),
    ...(data || {})
  };
  saveStatus(status);
}

module.exports = { loadStatus, saveStatus, getFeatureStatus, updateFeature };
