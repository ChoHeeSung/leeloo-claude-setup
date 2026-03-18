'use strict';

/**
 * io.js — stdin JSON 파싱, stdout JSON 출력 유틸리티
 */

/**
 * process.stdin에서 JSON 읽기
 * @returns {Promise<object>}
 */
function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      try {
        resolve(data.trim() ? JSON.parse(data) : {});
      } catch (e) {
        reject(new Error('stdin JSON 파싱 실패: ' + e.message));
      }
    });
    process.stdin.on('error', reject);
  });
}

/**
 * JSON.stringify로 stdout 출력
 * @param {object} obj
 */
function respond(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

/**
 * allow 결정 + 메시지 출력
 * @param {string} msg
 */
function allowWithMessage(msg) {
  respond({ decision: 'allow', systemMessage: msg });
}

/**
 * block 결정 + 메시지 출력
 * @param {string} msg
 */
function blockWithMessage(msg) {
  respond({ decision: 'block', systemMessage: msg });
}

module.exports = { readStdin, respond, allowWithMessage, blockWithMessage };
