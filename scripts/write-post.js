'use strict';

const fs = require('fs');
const { readStdin, respond, allowWithMessage } = require('./lib/io');

/**
 * write-post.js — PDCA 문서 포맷 검증 (PostToolUse:Write|Edit)
 */

const DOC_RULES = {
  'docs/plan/': {
    label: 'Plan',
    requiredSections: ['## Context', '## Goal', '## Scope']
  },
  'docs/design/': {
    label: 'Design',
    requiredSections: ['## Overview', '## Architecture', '## Components']
  },
  'docs/analysis/': {
    label: 'Analysis',
    requiredSections: ['## Summary', '## Findings']
  },
  'docs/report/': {
    label: 'Report',
    requiredSections: ['## Summary', '## Results']
  }
};

async function main() {
  let event = {};
  try {
    event = await readStdin();
  } catch (e) {
    respond({ decision: 'allow' });
    return;
  }

  const filePath = (event.tool_input && event.tool_input.file_path) || '';

  // PDCA 문서 경로 확인
  let matchedRule = null;
  for (const prefix of Object.keys(DOC_RULES)) {
    if (filePath.includes(prefix)) {
      matchedRule = DOC_RULES[prefix];
      break;
    }
  }

  if (!matchedRule) {
    respond({ decision: 'allow' });
    return;
  }

  // 파일 내용 읽기
  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    // 파일 읽기 실패 시 allow
    respond({ decision: 'allow' });
    return;
  }

  // 필수 섹션 확인
  const missingSections = matchedRule.requiredSections.filter(
    (section) => !content.includes(section)
  );

  if (missingSections.length > 0) {
    allowWithMessage(
      `[leeloo-kit] ${matchedRule.label} 문서에 필수 섹션이 누락되었습니다:\n` +
      missingSections.map((s) => `  - ${s}`).join('\n') +
      '\n문서 템플릿을 참고하여 섹션을 추가하세요.'
    );
    return;
  }

  respond({ decision: 'allow' });
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
});
