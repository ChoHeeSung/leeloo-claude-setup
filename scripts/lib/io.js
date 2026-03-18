'use strict';

/**
 * io.js — stdin JSON 파싱, stdout JSON 출력 유틸리티
 *
 * Hook 출력 스키마 (CC v2.1.78):
 *   Stop:         { decision?: "approve"|"block", stopReason?, systemMessage? }
 *   PreToolUse:   { permissionDecision?: "allow"|"deny"|"ask", reason?, systemMessage? }
 *   PostToolUse:  { additionalContext? }
 *   SessionStart: { systemMessage? }
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

function respond(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

// SessionStart / Stop 용
function sessionMessage(msg) {
  respond({ systemMessage: msg });
}

// PreToolUse 용: 허용
function preAllow() {
  respond({});
}

// PreToolUse 용: 차단
function preDeny(reason) {
  respond({ permissionDecision: 'deny', reason: reason });
}

// PostToolUse 용
function postContext(msg) {
  respond({ additionalContext: msg });
}

// Stop 용: 승인 + 메시지
function stopApprove(msg) {
  if (msg) {
    respond({ systemMessage: msg });
  } else {
    respond({});
  }
}

module.exports = { readStdin, respond, sessionMessage, preAllow, preDeny, postContext, stopApprove };
