#!/usr/bin/env node
'use strict';
// failure-memory-rotate.js — .leeloo/failure-memory/*.md 노후화·클러스터링
//   rotate(): 유형당 KEEP_RECENT 초과분을 archive/<type>-<YYYY-MM>.md로 이동
//             에러 패턴 정규화 후 클러스터링 → CLAUDE.local.md 요약 섹션 갱신
//   일 1회 gate: .leeloo/.last-rotate (YYYY-MM-DD, KST)

const fs = require('fs');
const path = require('path');
const { kstDate } = require('./token-budget');

const MEM_DIR = '.leeloo/failure-memory';
const ARCHIVE_DIR = '.leeloo/failure-memory/archive';
const GATE_FILE = '.leeloo/.last-rotate';
const KEEP_RECENT = 50;
const TOP_N_PATTERNS = 3;
const CLUSTER_MIN_ENTRIES = 5;
const ENTRY_RE = /^- \[(\d{4}-\d{2}-\d{2})\]\s+(.+)$/;

function stripPayload(s) {
  return s.replace(/\{"filePath":.*$/s, '{payload}');
}

function normalize(s) {
  return stripPayload(s)
    .replace(/\/(?:Users|home|opt|var|tmp|private)\/[\w\-./@ ]+/g, '{path}')
    .replace(/[\w\-.]+\/[\w\-./]+\.(js|ts|tsx|jsx|py|java|go|rs|md|json|yaml|yml|sh)/g, '{path}')
    .replace(/\b[a-f0-9]{8,}\b/g, '{hash}')
    .replace(/\b\d{4}-\d{2}-\d{2}[T\d:. Z-]*/g, '{ts}')
    .replace(/\bline \d+/gi, 'line {n}')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseEntries(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(ENTRY_RE);
    if (!m) continue;
    out.push({ date: m[1], body: m[2].trim(), raw: line });
  }
  return out;
}

function clusterEntries(entries) {
  const clusters = new Map();
  for (const e of entries) {
    const key = normalize(e.body).slice(0, 80);
    if (!clusters.has(key)) clusters.set(key, { count: 0, last: '', sample: e.body });
    const c = clusters.get(key);
    c.count++;
    if (e.date > c.last) c.last = e.date;
  }
  return Array.from(clusters.entries()).map(([key, v]) => Object.assign({ key }, v));
}

function topPatterns(clusters, n) {
  return [...clusters].sort((a, b) => b.count - a.count || b.last.localeCompare(a.last)).slice(0, n);
}

function listTypeFiles(cwd) {
  const dir = path.join(cwd, MEM_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ type: f.replace(/\.md$/, ''), path: path.join(dir, f) }));
}

function archiveOldEntries(filePath, entries, cwd) {
  if (entries.length <= KEEP_RECENT) return 0;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const old = sorted.slice(0, sorted.length - KEEP_RECENT);
  const keep = sorted.slice(sorted.length - KEEP_RECENT);
  const type = path.basename(filePath, '.md');
  const ym = kstDate().slice(0, 7);
  const archiveFile = path.join(cwd, ARCHIVE_DIR, `${type}-${ym}.md`);
  fs.mkdirSync(path.dirname(archiveFile), { recursive: true });
  const archiveHeader = fs.existsSync(archiveFile) ? '' : `# ${type} archive ${ym}\n\n`;
  fs.appendFileSync(archiveFile, archiveHeader + old.map((e) => e.raw).join('\n') + '\n');
  const body = `# Failure Memory: ${type}\n\n` + keep.map((e) => e.raw).join('\n') + '\n';
  fs.writeFileSync(filePath, body);
  return old.length;
}

function renderSummarySection(typeEntries) {
  const lines = ['## Failure Memory'];
  if (typeEntries.length === 0) {
    lines.push('(기록 없음) — 상세: .leeloo/failure-memory/ 참조');
    return lines.join('\n');
  }
  const totalCounts = typeEntries.map((t) => `${t.type}(${t.entries.length}건)`);
  lines.push(`${totalCounts.join(' · ')} — 상세: .leeloo/failure-memory/ 참조`);
  for (const t of typeEntries) {
    if (t.entries.length === 0) continue;
    if (t.entries.length < CLUSTER_MIN_ENTRIES) {
      lines.push(`\n### ${t.type} 최근 기록`);
      const recent = [...t.entries].sort((a, b) => b.date.localeCompare(a.date));
      for (const e of recent) lines.push(`- [${e.date}] ${stripPayload(e.body)}`);
      continue;
    }
    const top = topPatterns(clusterEntries(t.entries), TOP_N_PATTERNS);
    lines.push(`\n### ${t.type} 상위 패턴`);
    for (const p of top) {
      lines.push(`- \`${p.key}\` (freq ${p.count}, last ${p.last})`);
    }
  }
  return lines.join('\n');
}

function updateClaudeLocalMd(cwd, section) {
  const file = path.join(cwd, 'CLAUDE.local.md');
  const exists = fs.existsSync(file);
  const seed = `# ${path.basename(cwd)} (로컬 전용)\n\n> 이 파일은 gitignore 대상. 팀 공유용 정책은 루트 CLAUDE.md 참조.\n\n`;
  const text = exists ? fs.readFileSync(file, 'utf8') : seed;
  const marker = /## Failure Memory[\s\S]*$/;
  const replaced = marker.test(text)
    ? text.replace(marker, section.trim() + '\n')
    : text.trimEnd() + '\n\n' + section.trim() + '\n';
  if (exists && replaced === text) return false;
  fs.writeFileSync(file, replaced);
  return true;
}

function checkGate(cwd) {
  const gate = path.join(cwd, GATE_FILE);
  const today = kstDate();
  if (fs.existsSync(gate) && fs.readFileSync(gate, 'utf8').trim() === today) return false;
  fs.mkdirSync(path.dirname(gate), { recursive: true });
  fs.writeFileSync(gate, today);
  return true;
}

function rotate(cwd, opts) {
  const base = cwd || process.cwd();
  const options = opts || {};
  if (!options.force && !checkGate(base)) return { skipped: true, reason: 'gated-today' };

  const files = listTypeFiles(base);
  const typeEntries = [];
  let archivedTotal = 0;
  for (const f of files) {
    const text = fs.readFileSync(f.path, 'utf8');
    let entries = parseEntries(text);
    archivedTotal += archiveOldEntries(f.path, entries, base);
    entries = parseEntries(fs.readFileSync(f.path, 'utf8'));
    typeEntries.push({ type: f.type, entries });
  }
  const section = renderSummarySection(typeEntries);
  const updated = updateClaudeLocalMd(base, section);
  return { skipped: false, archived: archivedTotal, types: typeEntries.length, claudeLocalMdUpdated: updated };
}

function main() {
  const args = process.argv.slice(2);
  const result = rotate(process.cwd(), { force: args.includes('--force') });
  if (result.skipped) {
    console.log(`rotate: skipped (${result.reason}). --force로 재실행 가능`);
    return;
  }
  console.log(`rotate: ${result.types}개 유형, archived=${result.archived}, CLAUDE.local.md updated=${result.claudeLocalMdUpdated}`);
}

module.exports = { rotate, parseEntries, clusterEntries, topPatterns, normalize, stripPayload };

if (require.main === module) main();
