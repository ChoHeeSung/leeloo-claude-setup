#!/usr/bin/env node
// context-lint.js — 하네스 컨텍스트 예산 감사
//   CLI:
//     node leeloo-kit/scripts/context-lint.js            한 줄 요약
//     node leeloo-kit/scripts/context-lint.js --verbose  위반 상세
//   Module: const { runLint } = require('./context-lint')
const fs = require('fs');
const path = require('path');
const { checkDrift } = require('./generate-commands');

const REPO = path.resolve(__dirname, '../..');
const DEFAULT_BUDGET = path.join(__dirname, '../resources/context-budget.default.json');
const LOCAL_BUDGET = path.join(REPO, '.leeloo/context-budget.json');

const PLUGINS = [
  'leeloo-kit', 'leeloo-workflow', 'leeloo-git', 'leeloo-agent',
  'leeloo-doc', 'leeloo-bitbucket', 'leeloo-n8n', 'leeloo-its',
];

function loadBudget() {
  const base = JSON.parse(fs.readFileSync(DEFAULT_BUDGET, 'utf8'));
  if (!fs.existsSync(LOCAL_BUDGET)) return base;
  try {
    const local = JSON.parse(fs.readFileSync(LOCAL_BUDGET, 'utf8'));
    return Object.assign({}, base, local);
  } catch (e) {
    return base;
  }
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const out = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (/^"(.*)"$/.test(val)) val = val.slice(1, -1);
    else if (/^'(.*)'$/.test(val)) val = val.slice(1, -1);
    out[m[1]] = val;
  }
  return out;
}

function listSkillFiles() {
  const files = [];
  for (const p of PLUGINS) {
    const dir = path.join(REPO, p, 'skills');
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const f = path.join(dir, entry.name, 'SKILL.md');
      if (fs.existsSync(f)) files.push(f);
    }
  }
  return files;
}

function lintSkillFields(budget) {
  const violations = [];
  for (const file of listSkillFiles()) {
    const meta = parseFrontmatter(fs.readFileSync(file, 'utf8')) || {};
    const rel = path.relative(REPO, file);
    const d = meta.description || '';
    const h = meta['argument-hint'] || '';
    if (d.length > budget.skill_description_max) {
      violations.push({ kind: 'skill-description', path: rel, got: d.length, max: budget.skill_description_max });
    }
    if (h.length > budget.skill_argument_hint_max) {
      violations.push({ kind: 'skill-argument-hint', path: rel, got: h.length, max: budget.skill_argument_hint_max });
    }
  }
  return violations;
}

function lintClaudeMdLines(budget) {
  const violations = [];
  const targets = [
    { path: path.join(REPO, 'CLAUDE.md'), max: budget.claude_md_root_max_lines, kind: 'claude-md-root' },
  ];
  for (const p of PLUGINS) {
    const f = path.join(REPO, p, 'CLAUDE.md');
    if (!fs.existsSync(f)) continue;
    targets.push({ path: f, max: budget.claude_md_plugin_max_lines, kind: 'claude-md-plugin' });
  }
  for (const t of targets) {
    if (!fs.existsSync(t.path)) continue;
    const lines = fs.readFileSync(t.path, 'utf8').split(/\r?\n/).length;
    if (lines > t.max) {
      violations.push({ kind: t.kind, path: path.relative(REPO, t.path), got: lines, max: t.max });
    }
  }
  return violations;
}

function lintCommandsDrift(budget) {
  if (!budget.commands_drift_check) return [];
  const { drift } = checkDrift();
  return drift.map((d) => ({
    kind: 'commands-drift',
    path: path.relative(REPO, d.path),
    reason: d.reason,
  }));
}

function runLint() {
  const budget = loadBudget();
  const violations = [
    ...lintSkillFields(budget),
    ...lintClaudeMdLines(budget),
    ...lintCommandsDrift(budget),
  ];
  return { budget, violations };
}

function summarize(violations) {
  if (violations.length === 0) return null;
  const byKind = {};
  for (const v of violations) byKind[v.kind] = (byKind[v.kind] || 0) + 1;
  const parts = Object.entries(byKind).map(([k, n]) => `${k}:${n}`);
  return `context-lint: ${violations.length}건 (${parts.join(', ')}) — 상세: node leeloo-kit/scripts/context-lint.js --verbose`;
}

function formatVerbose(violations) {
  if (violations.length === 0) return 'context-lint: 위반 없음';
  const lines = [`context-lint: ${violations.length}건`];
  for (const v of violations) {
    if (v.kind === 'commands-drift') {
      lines.push(`  [${v.kind}] ${v.path} (${v.reason})`);
    } else {
      lines.push(`  [${v.kind}] ${v.path} — ${v.got} > ${v.max}`);
    }
  }
  return lines.join('\n');
}

function main() {
  const verbose = process.argv.includes('--verbose');
  const { violations } = runLint();
  if (verbose) {
    console.log(formatVerbose(violations));
  } else {
    const msg = summarize(violations);
    console.log(msg || 'context-lint: ok (0 violations)');
  }
  process.exit(violations.length === 0 ? 0 : 1);
}

module.exports = { runLint, summarize, formatVerbose, loadBudget };

if (require.main === module) main();
