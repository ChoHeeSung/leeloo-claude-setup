#!/usr/bin/env node
// skills/<name>/SKILL.md frontmatter -> commands/<name>.md slash-command wrapper 동기화.
//   (기본)  : 레포의 commands/*.md 파일 생성/갱신.
//   --check : drift 감지. 불일치 시 exit 1.
//   --sync  : 기본 동작 + marketplaces / cache(최신 버전 디렉토리)에도 반영.
// skill user_invocable의 argument-hint가 / 자동완성 chip으로 렌더링되지 않는
// 하네스 동작을 보완하기 위한 wrapper. skill precedence로 실행은 skill이 가져간다.
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '../..');
const PLUGINS = [
  'leeloo-kit',
  'leeloo-workflow',
  'leeloo-git',
  'leeloo-agent',
  'leeloo-doc',
  'leeloo-bitbucket',
  'leeloo-n8n',
  'leeloo-its',
];

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

function listSkills(plugin) {
  const skillsDir = path.join(REPO, plugin, 'skills');
  if (!fs.existsSync(skillsDir)) return [];
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(skillsDir, d.name, 'SKILL.md'))
    .filter((p) => fs.existsSync(p));
}

function renderCommand(meta) {
  const { name, description, 'argument-hint': hint } = meta;
  const fmLines = ['---'];
  if (description) fmLines.push(`description: "${description}"`);
  if (hint) fmLines.push(`argument-hint: "${hint}"`);
  fmLines.push('---', '');
  const body = [
    `\`${name}\` 스킬을 실행합니다. 사용자 입력: $ARGUMENTS`,
    '',
    `서브커맨드 파싱과 대화형 흐름을 포함한 동작 정의는 대응 SKILL.md(\`${name}\`)를 기준으로 합니다.`,
    '',
  ].join('\n');
  return fmLines.join('\n') + body;
}

function collectTargets() {
  const targets = [];
  for (const plugin of PLUGINS) {
    for (const skillPath of listSkills(plugin)) {
      const text = fs.readFileSync(skillPath, 'utf8');
      const meta = parseFrontmatter(text);
      if (!meta || !meta.name || meta.user_invocable !== 'true') continue;
      const cmdPath = path.join(REPO, plugin, 'commands', `${meta.name}.md`);
      targets.push({ plugin, skillPath, cmdPath, meta });
    }
  }
  return targets;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function runWrite(targets) {
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  for (const t of targets) {
    const rendered = renderCommand(t.meta);
    const exists = fs.existsSync(t.cmdPath);
    const current = exists ? fs.readFileSync(t.cmdPath, 'utf8') : '';
    if (current === rendered) {
      unchanged++;
      continue;
    }
    ensureDir(t.cmdPath);
    fs.writeFileSync(t.cmdPath, rendered);
    if (exists) updated++;
    else created++;
    console.log(`${exists ? 'updated' : 'created'}: ${path.relative(REPO, t.cmdPath)}`);
  }
  console.log(`\nsummary: ${created} created, ${updated} updated, ${unchanged} unchanged (total ${targets.length})`);
}

function semverCompare(a, b) {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

function latestCacheVersion(plugin) {
  const HOME = process.env.HOME;
  const cacheRoot = path.join(HOME, '.claude/plugins/cache/leeloo-claude-setup', plugin);
  if (!fs.existsSync(cacheRoot)) return null;
  const versions = fs
    .readdirSync(cacheRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  if (versions.length === 0) return null;
  return versions.sort(semverCompare).slice(-1)[0];
}

function syncOne(srcPath, plugin) {
  const HOME = process.env.HOME;
  const fileName = path.basename(srcPath);
  const dsts = [];
  const mkDst = path.join(HOME, '.claude/plugins/marketplaces/leeloo-claude-setup', plugin, 'commands', fileName);
  ensureDir(mkDst);
  fs.copyFileSync(srcPath, mkDst);
  dsts.push({ role: 'marketplaces', path: mkDst });
  const latest = latestCacheVersion(plugin);
  if (latest) {
    const cacheDst = path.join(HOME, '.claude/plugins/cache/leeloo-claude-setup', plugin, latest, 'commands', fileName);
    ensureDir(cacheDst);
    fs.copyFileSync(srcPath, cacheDst);
    dsts.push({ role: `cache/${latest}`, path: cacheDst });
  }
  return dsts;
}

function runSync(targets) {
  const cacheMissing = new Set();
  let mkCount = 0;
  let cacheCount = 0;
  for (const t of targets) {
    const dsts = syncOne(t.cmdPath, t.plugin);
    for (const d of dsts) {
      if (d.role === 'marketplaces') mkCount++;
      else cacheCount++;
    }
    if (!latestCacheVersion(t.plugin)) cacheMissing.add(t.plugin);
  }
  console.log(`\nsync: marketplaces=${mkCount}, cache=${cacheCount}`);
  if (cacheMissing.size) {
    console.log(`  cache not present (skipped): ${Array.from(cacheMissing).join(', ')}`);
  }
}

function runCheck(targets) {
  const drift = [];
  for (const t of targets) {
    const rendered = renderCommand(t.meta);
    const exists = fs.existsSync(t.cmdPath);
    const current = exists ? fs.readFileSync(t.cmdPath, 'utf8') : null;
    if (current !== rendered) drift.push({ path: t.cmdPath, reason: exists ? 'out-of-sync' : 'missing' });
  }
  if (drift.length === 0) {
    console.log(`ok: ${targets.length} command wrappers are in sync`);
    return 0;
  }
  console.error(`drift detected: ${drift.length} of ${targets.length}`);
  for (const d of drift) console.error(`  [${d.reason}] ${path.relative(REPO, d.path)}`);
  console.error('\nrun: node leeloo-kit/scripts/generate-commands.js');
  return 1;
}

function checkDrift() {
  const targets = collectTargets();
  const drift = [];
  for (const t of targets) {
    const rendered = renderCommand(t.meta);
    const exists = fs.existsSync(t.cmdPath);
    const current = exists ? fs.readFileSync(t.cmdPath, 'utf8') : null;
    if (current !== rendered) drift.push({ path: t.cmdPath, reason: exists ? 'out-of-sync' : 'missing' });
  }
  return { total: targets.length, drift };
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const sync = args.includes('--sync');
  const targets = collectTargets();
  if (targets.length === 0) {
    console.error('no user_invocable skills found');
    process.exit(1);
  }
  if (check) process.exit(runCheck(targets));
  runWrite(targets);
  if (sync) runSync(targets);
  process.exit(0);
}

module.exports = { checkDrift, collectTargets, parseFrontmatter };

if (require.main === module) main();
