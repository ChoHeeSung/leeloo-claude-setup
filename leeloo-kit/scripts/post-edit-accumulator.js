'use strict';

const { readStdin, respond } = require('./lib/io');
const { addEditedFile } = require('./lib/edit-accumulator');

/**
 * post-edit-accumulator.js — 편집 파일 경로 수집 (PostToolUse: Write|Edit)
 *
 * ECC 패턴: per-edit 품질체크 대신 경로만 축적 → Stop에서 일괄 실행
 * Back-pressure: 항상 침묵 (성공/실패 무관하게 경로만 수집)
 */

async function main() {
  let event = {};
  try {
    event = await readStdin();
  } catch (e) {
    respond({});
    return;
  }

  const toolInput = event.tool_input || {};
  const filePath = toolInput.file_path || '';

  if (filePath) {
    try {
      addEditedFile(filePath);
    } catch (e) {
      // 수집 실패해도 작업 중단하지 않음
    }
  }

  // 침묵 — 품질체크는 Stop에서 일괄 수행
  respond({});
}

main().catch(() => {
  process.stdout.write(JSON.stringify({}) + '\n');
});
