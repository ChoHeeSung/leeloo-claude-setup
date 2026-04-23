#!/usr/bin/env node
'use strict';
// budget-report.js — lk-harness budget 서브커맨드 CLI
//   기본        : 오늘 + 7일 요약
//   --week      : 7일 일별 테이블
//   --top-skills: 14일 skill 사용 랭킹
//   --load      : 현재 자동 로드 컨텍스트 현황

const { listLastNDays, summarizeEvents, measureAutoLoad, kstDate } = require('./token-budget');

function fmtTokens(n) {
  if (!n) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function eventsByDate(events) {
  const by = new Map();
  for (const ev of events) {
    const d = (ev.ts || '').slice(0, 10);
    if (!by.has(d)) by.set(d, []);
    by.get(d).push(ev);
  }
  return by;
}

function reportToday() {
  const events = listLastNDays(1);
  const s = summarizeEvents(events);
  console.log(`오늘 세션 (${kstDate()}, KST 기준):`);
  console.log(`  세션 수:          ${s.sessions}`);
  console.log(`  자동 로드 평균:   ${fmtTokens(s.avgLoadTokens)} tok (추정)`);
  console.log(`  자동 로드 p95:    ${fmtTokens(s.p95LoadTokens)} tok`);
  const top = Object.entries(s.skillFreq).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (top.length > 0) {
    console.log(`  최다 skill:       ${top.map(([n, c]) => `${n}(${c})`).join(', ')}`);
  }
  const weekly = summarizeEvents(listLastNDays(7));
  console.log(`\n7일 추세:`);
  console.log(`  평균 ${fmtTokens(weekly.avgLoadTokens)} · p95 ${fmtTokens(weekly.p95LoadTokens)} · 세션 ${weekly.sessions}개`);
}

function reportWeek() {
  const events = listLastNDays(7);
  const by = eventsByDate(events);
  console.log('7일 일별 (자동 로드 기준):');
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = kstDate(d);
    const day = by.get(date) || [];
    const s = summarizeEvents(day);
    console.log(`  ${date}: 세션 ${String(s.sessions).padStart(2)} · avg ${fmtTokens(s.avgLoadTokens).padStart(6)} · p95 ${fmtTokens(s.p95LoadTokens).padStart(6)}`);
  }
}

function reportTopSkills() {
  const events = listLastNDays(14);
  const s = summarizeEvents(events);
  const sorted = Object.entries(s.skillFreq).sort((a, b) => b[1] - a[1]);
  console.log(`14일 skill 사용 랭킹 (세션 ${s.sessions}개 기준):`);
  if (sorted.length === 0) {
    console.log('  데이터 없음');
    return;
  }
  for (const [name, count] of sorted) {
    console.log(`  ${name.padEnd(28)} ${String(count).padStart(4)}회`);
  }
}

function reportLoad() {
  const auto = measureAutoLoad();
  console.log(`자동 로드 컨텍스트 현황:`);
  console.log(`  총 문자: ${auto.chars.toLocaleString()}`);
  console.log(`  추정 토큰: ${fmtTokens(auto.tokens_est)} (tokens_per_char=1/3.5)`);
  console.log(`\n  측정 대상:`);
  console.log(`  - 루트 CLAUDE.md`);
  console.log(`  - 각 플러그인 CLAUDE.md`);
  console.log(`  - 모든 SKILL.md frontmatter`);
  console.log(`\n  주의: 글로벌 ~/.claude/CLAUDE.md, MCP 스키마, 하네스 내부 프롬프트는 포함하지 않습니다.`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--week')) return reportWeek();
  if (args.includes('--top-skills')) return reportTopSkills();
  if (args.includes('--load')) return reportLoad();
  return reportToday();
}

if (require.main === module) main();
