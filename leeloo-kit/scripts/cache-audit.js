#!/usr/bin/env node
'use strict';
// cache-audit.js — CLAUDE.md / SKILL.md prefix 변동성 감사
//   volatility = 최근 N일 파일 커밋 수 / 파일 줄 수
//   상단 50% 블록이 큰 비중을 차지하면 캐시 친화도 저하 경고
//   on-demand 전용. 1일 TTL 캐시(.leeloo/cache-audit.cache.json).
//   CLI:
//     cache-audit.js              전체 요약
//     cache-audit.js --verbose    파일별 상세
//     cache-audit.js --file X     단일 파일

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CACHE_FILE = '.leeloo/cache-audit.cache.json';
const CACHE_TTL_MS = 24 * 3600 * 1000;
const DAYS_BACK = 30;
const PLUGINS = [
  'leeloo-kit', 'leeloo-workflow', 'leeloo-git', 'leeloo-agent',
  'leeloo-doc', 'leeloo-bitbucket', 'leeloo-n8n', 'leeloo-its',
];

function collectTargets(cwd) {
  const out = [];
  const root = path.join(cwd, 'CLAUDE.md');
  if (fs.existsSync(root)) out.push({ kind: 'claude-md-root', path: root });
  for (const p of PLUGINS) {
    const f = path.join(cwd, p, 'CLAUDE.md');
    if (fs.existsSync(f)) out.push({ kind: 'claude-md-plugin', path: f });
  }
  return out;
}

function splitByHeader(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let current = { header: '(preamble)', start: 1, lines: [] };
  lines.forEach((line, idx) => {
    if (/^##\s/.test(line)) {
      if (current.lines.length > 0) blocks.push(current);
      current = { header: line.replace(/^##\s*/, '').trim(), start: idx + 1, lines: [line] };
    } else {
      current.lines.push(line);
    }
  });
  if (current.lines.length > 0) blocks.push(current);
  return blocks;
}

function gitFileModCount(file, daysBack) {
  const r = spawnSync('git', ['log', `--since=${daysBack}.days.ago`, '--pretty=format:.', '--', file], {
    encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (r.status !== 0) return 0;
  return (r.stdout || '').length;
}

function auditOne(target, cwd) {
  const text = fs.readFileSync(target.path, 'utf8');
  const blocks = splitByHeader(text);
  const totalLines = text.split(/\r?\n/).length;
  const mods = gitFileModCount(target.path, DAYS_BACK);
  const volatility = totalLines > 0 ? (mods / totalLines) : 0;
  const topBlocks = blocks.filter((b) => (b.start / totalLines) < 0.5);
  const topShare = topBlocks.reduce((acc, b) => acc + b.lines.length, 0) / totalLines;
  return {
    file: path.relative(cwd, target.path),
    kind: target.kind,
    mods,
    totalLines,
    volatility: Number(volatility.toFixed(3)),
    topShare: Number(topShare.toFixed(2)),
    blocks: blocks.map((b) => ({ header: b.header, start: b.start, lines: b.lines.length })),
  };
}

function loadCache(cwd) {
  try {
    const f = path.join(cwd, CACHE_FILE);
    if (!fs.existsSync(f)) return null;
    const c = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (!c.ts || Date.now() - c.ts > CACHE_TTL_MS) return null;
    return c.data;
  } catch (e) { return null; }
}

function saveCache(cwd, data) {
  try {
    const f = path.join(cwd, CACHE_FILE);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, JSON.stringify({ ts: Date.now(), data }));
  } catch (e) { /* silent */ }
}

function runAudit(opts) {
  const cwd = (opts && opts.cwd) || process.cwd();
  const noCache = opts && opts.noCache;
  if (!noCache) {
    const cached = loadCache(cwd);
    if (cached) return Object.assign({}, cached, { fromCache: true });
  }
  const targets = collectTargets(cwd);
  const files = targets.map((t) => auditOne(t, cwd));
  const total = files.reduce((a, f) => a + f.volatility, 0);
  const avgVolatility = files.length ? Number((total / files.length).toFixed(3)) : 0;
  const worst = [...files].sort((a, b) => b.volatility - a.volatility).slice(0, 3);
  const result = { files, avgVolatility, worst, daysBack: DAYS_BACK };
  saveCache(cwd, result);
  return result;
}

function fmtVolatility(v) {
  if (v >= 0.5) return `${v.toFixed(2)} 🔴`;
  if (v >= 0.2) return `${v.toFixed(2)} 🟡`;
  return `${v.toFixed(2)} ✓`;
}

function reportSummary(r) {
  console.log(`cache-audit (최근 ${r.daysBack}일 git log 기준${r.fromCache ? ', 캐시' : ''}):`);
  console.log(`  전체 avg volatility: ${fmtVolatility(r.avgVolatility)}`);
  console.log(`  측정 파일: ${r.files.length}`);
  if (r.worst.length > 0) {
    console.log(`\n  상위 volatility (재배치 검토):`);
    for (const f of r.worst) {
      const flag = f.volatility >= 0.2 ? ' ← 상단 블록이 자주 바뀌면 캐시 miss 유발' : '';
      console.log(`    ${f.file}: ${fmtVolatility(f.volatility)} (mods=${f.mods}/lines=${f.totalLines})${flag}`);
    }
  }
}

function reportVerbose(r) {
  reportSummary(r);
  console.log('\n파일별 블록 구조:');
  for (const f of r.files) {
    console.log(`\n  ${f.file} (${f.totalLines}줄, mods ${f.mods}):`);
    for (const b of f.blocks) {
      const pos = (b.start / f.totalLines) < 0.5 ? 'top' : 'bot';
      console.log(`    [${String(b.start).padStart(3)}] (${pos}, ${String(b.lines).padStart(3)}줄) ${b.header}`);
    }
  }
}

function reportFile(r, target) {
  const found = r.files.find((f) => f.file === target || f.file.endsWith(target));
  if (!found) {
    console.error(`파일을 찾을 수 없습니다: ${target}`);
    process.exit(1);
  }
  console.log(`${found.file}:`);
  console.log(`  총 ${found.totalLines}줄, 최근 ${r.daysBack}일 mods=${found.mods}`);
  console.log(`  volatility: ${fmtVolatility(found.volatility)}  (top 50% 점유율 ${Math.round(found.topShare * 100)}%)`);
  console.log(`\n  블록:`);
  for (const b of found.blocks) {
    const pos = (b.start / found.totalLines) < 0.5 ? 'top' : 'bot';
    console.log(`    [${String(b.start).padStart(3)}] (${pos}, ${String(b.lines).padStart(3)}줄) ${b.header}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const fileIdx = args.indexOf('--file');
  const filePath = fileIdx >= 0 ? args[fileIdx + 1] : null;
  const noCache = args.includes('--no-cache');
  const result = runAudit({ noCache });
  if (filePath) return reportFile(result, filePath);
  if (verbose) return reportVerbose(result);
  return reportSummary(result);
}

module.exports = { runAudit, splitByHeader, gitFileModCount };

if (require.main === module) main();
