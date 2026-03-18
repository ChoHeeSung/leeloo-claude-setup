'use strict';

const fs = require('fs');
const { ensureStateDir, getStatePath } = require('./paths');

/**
 * context.js — 활성 스킬/에이전트 추적
 */

/**
 * .leeloo/active-context.json 읽기
 * @returns {object}
 */
function loadContext() {
  try {
    const filePath = getStatePath('activeContext');
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

/**
 * .leeloo/active-context.json 쓰기
 * @param {object} data
 */
function saveContext(data) {
  ensureStateDir();
  const filePath = getStatePath('activeContext');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 현재 실행 중인 스킬 기록
 * @param {string} name
 */
function setActiveSkill(name) {
  const ctx = loadContext();
  ctx.activeSkill = name;
  ctx.activeAgent = null;
  ctx.updatedAt = new Date().toISOString();
  saveContext(ctx);
}

/**
 * 현재 실행 중인 에이전트 기록
 * @param {string} name
 */
function setActiveAgent(name) {
  const ctx = loadContext();
  ctx.activeAgent = name;
  ctx.activeSkill = null;
  ctx.updatedAt = new Date().toISOString();
  saveContext(ctx);
}

/**
 * 활성 상태 초기화
 */
function clearActive() {
  const ctx = loadContext();
  ctx.activeSkill = null;
  ctx.activeAgent = null;
  ctx.updatedAt = new Date().toISOString();
  saveContext(ctx);
}

module.exports = { loadContext, saveContext, setActiveSkill, setActiveAgent, clearActive };
