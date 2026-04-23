'use strict';
// token-budget.js — 세션 토큰 소비 추정·축적·집계 유틸
//   이벤트 형식(jsonl):
//     {"kind":"load","ts":ISO,"session":id,"chars":N,"tokens_est":N}
//     {"kind":"skill","ts":ISO,"session":id,"name":str}
//     {"kind":"end","ts":ISO,"session":id,"duration_ms":N}
//   저장: .leeloo/token-budget/<YYYY-MM-DD>.jsonl (30일 후 archive/<YYYY-MM>.jsonl)

const fs = require('fs');
const path = require('path');

const BUDGET_DIR = '.leeloo/token-budget';
const ARCHIVE_DIR = '.leeloo/token-budget/archive';
const RETENTION_DAYS = 30;
const DEFAULT_TOKENS_PER_CHAR = 1 / 3.5;
const PLUGINS = [
  'leeloo-kit', 'leeloo-workflow', 'leeloo-git', 'leeloo-agent',
  'leeloo-doc', 'leeloo-bitbucket', 'leeloo-n8n', 'leeloo-its',
];

function estimateTokens(chars, tokensPerChar = DEFAULT_TOKENS_PER_CHAR) {
  return Math.round(chars * tokensPerChar);
}

function kstDate(d) {
  const base = d || new Date();
  const kst = new Date(base.getTime() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10);
}

function ensureDirs(cwd) {
  fs.mkdirSync(path.join(cwd, BUDGET_DIR), { recursive: true });
  fs.mkdirSync(path.join(cwd, ARCHIVE_DIR), { recursive: true });
}

function appendEvent(event, cwd) {
  const base = cwd || process.cwd();
  try {
    ensureDirs(base);
    const ts = event.ts || new Date().toISOString();
    const date = kstDate(new Date(ts));
    const file = path.join(base, BUDGET_DIR, `${date}.jsonl`);
    fs.appendFileSync(file, JSON.stringify(Object.assign({ ts }, event)) + '\n');
  } catch (e) { /* silent-fail */ }
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  const content = fs.readFileSync(file, 'utf8');
  const out = [];
  for (const line of content.split(/\r?\n/)) {
    if (!line) continue;
    try { out.push(JSON.parse(line)); } catch (e) { /* skip */ }
  }
  return out;
}

function listLastNDays(n, cwd) {
  const base = cwd || process.cwd();
  const events = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = kstDate(d);
    events.push(...readJsonl(path.join(base, BUDGET_DIR, `${date}.jsonl`)));
  }
  return events;
}

function groupBySession(events) {
  const sessions = new Map();
  for (const ev of events) {
    const id = ev.session || 'unknown';
    if (!sessions.has(id)) sessions.set(id, { load: 0, skills: [], ended: false });
    const s = sessions.get(id);
    if (ev.kind === 'load' && ev.tokens_est) s.load = ev.tokens_est;
    if (ev.kind === 'skill' && ev.name) s.skills.push(ev.name);
    if (ev.kind === 'end') s.ended = true;
  }
  return sessions;
}

function summarizeEvents(events) {
  const sessions = groupBySession(events);
  const loads = Array.from(sessions.values()).map((s) => s.load).filter((n) => n > 0);
  const avgLoad = loads.length ? Math.round(loads.reduce((a, b) => a + b, 0) / loads.length) : 0;
  const sorted = [...loads].sort((a, b) => a - b);
  const p95 = sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] : 0;
  const skillFreq = {};
  for (const s of sessions.values()) {
    for (const name of s.skills) skillFreq[name] = (skillFreq[name] || 0) + 1;
  }
  return {
    sessions: sessions.size,
    events: events.length,
    avgLoadTokens: avgLoad,
    p95LoadTokens: p95,
    skillFreq,
  };
}

function archiveOldFiles(cwd) {
  const base = cwd || process.cwd();
  try {
    const dir = path.join(base, BUDGET_DIR);
    if (!fs.existsSync(dir)) return;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
    for (const f of fs.readdirSync(dir)) {
      if (!/^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f)) continue;
      const fileDate = new Date(f.slice(0, 10));
      if (fileDate < cutoff) moveToArchive(base, dir, f);
    }
  } catch (e) { /* silent */ }
}

function moveToArchive(base, dir, file) {
  const ym = file.slice(0, 7);
  const archiveFile = path.join(base, ARCHIVE_DIR, `${ym}.jsonl`);
  fs.mkdirSync(path.dirname(archiveFile), { recursive: true });
  fs.appendFileSync(archiveFile, fs.readFileSync(path.join(dir, file)));
  fs.unlinkSync(path.join(dir, file));
}

function measureAutoLoad(cwd) {
  const base = cwd || process.cwd();
  let chars = 0;
  const rootMd = path.join(base, 'CLAUDE.md');
  if (fs.existsSync(rootMd)) chars += fs.statSync(rootMd).size;
  for (const p of PLUGINS) {
    const pluginMd = path.join(base, p, 'CLAUDE.md');
    if (fs.existsSync(pluginMd)) chars += fs.statSync(pluginMd).size;
    chars += measureSkillFrontmatter(path.join(base, p, 'skills'));
  }
  return { chars, tokens_est: estimateTokens(chars) };
}

function measureSkillFrontmatter(skillsDir) {
  if (!fs.existsSync(skillsDir)) return 0;
  let chars = 0;
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const f = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(f)) continue;
    const text = fs.readFileSync(f, 'utf8');
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (m) chars += m[0].length;
  }
  return chars;
}

module.exports = {
  estimateTokens,
  kstDate,
  appendEvent,
  listLastNDays,
  summarizeEvents,
  archiveOldFiles,
  measureAutoLoad,
};
