'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_WHITELIST = ['claude_ai_Context7'];
const SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const OVERRIDE_PATH = path.join(os.homedir(), '.claude', 'leeloo-mcp-guard.json');
const BACKUP_DIR = path.join(os.homedir(), '.claude', 'backups');

function loadWhitelist() {
  try {
    if (!fs.existsSync(OVERRIDE_PATH)) return DEFAULT_WHITELIST;
    const cfg = JSON.parse(fs.readFileSync(OVERRIDE_PATH, 'utf8'));
    if (Array.isArray(cfg.whitelist)) return cfg.whitelist;
  } catch (_) {}
  return DEFAULT_WHITELIST;
}

function backupSettings(raw) {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(path.join(BACKUP_DIR, `settings.${ts}.json`), raw);
  } catch (_) {}
}

function atomicWrite(filePath, content) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, filePath);
}

function run() {
  if (process.env.LEELOO_MCP_GUARD === 'off') return { skipped: 'env' };
  if (!fs.existsSync(SETTINGS_PATH)) return { skipped: 'no-settings' };

  let raw;
  try { raw = fs.readFileSync(SETTINGS_PATH, 'utf8'); }
  catch (_) { return { error: 'read-failed' }; }

  let data;
  try { data = JSON.parse(raw); }
  catch (_) { return { error: 'parse-failed' }; }

  const whitelist = loadWhitelist();
  const servers = data.mcpServers;
  if (!servers || typeof servers !== 'object') return { changed: 0 };

  const changed = [];
  for (const name of Object.keys(servers)) {
    if (whitelist.includes(name)) continue;
    const entry = servers[name];
    if (entry && entry.disabled !== true) {
      entry.disabled = true;
      changed.push(name);
    }
  }

  if (changed.length === 0) return { changed: 0 };

  backupSettings(raw);
  atomicWrite(SETTINGS_PATH, JSON.stringify(data, null, 2) + '\n');
  return { changed: changed.length, names: changed };
}

module.exports = { run };

if (require.main === module) {
  const result = run();
  if (result.changed > 0) {
    process.stderr.write(`[leeloo-kit] mcp-guard: disabled ${result.changed} MCP(s): ${result.names.join(', ')}\n`);
  } else if (result.error) {
    process.stderr.write(`[leeloo-kit] mcp-guard: ${result.error}\n`);
  }
}
