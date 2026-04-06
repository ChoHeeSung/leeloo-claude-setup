'use strict';

const { readStdin, respond, postContext } = require('./lib/io');
const { setActiveSkill } = require('./lib/context');

/**
 * skill-post.js — Skill 실행 후 안내 (PostToolUse:Skill)
 *
 * Back-pressure 원칙: 필요한 안내만 최소한으로 출력
 */

function getNextStepMessage(skillName) {
  switch (skillName) {
    case 'lk-plan':
      return [
        '[leeloo-kit] lk-plan 완료. 사용자에게 다음 각 항목의 실행 여부를 반드시 확인하세요:',
        '  1. /lk-plan-cross-review — Gemini 교차검증 실행할까요?',
        '  2. /lk-todo create       — Plan을 TODO 리스트로 변환할까요?'
      ].join('\n');

    case 'lk-plan-cross-review':
      return '[leeloo-kit] 교차검증 완료. 검증 결과를 확인하고 다음 단계를 선택하세요.';

    default:
      return null;
  }
}

async function main() {
  let event = {};
  try {
    event = await readStdin();
  } catch (e) {
    respond({});
    return;
  }

  const skillName = (event.tool_input && event.tool_input.skill) || '';

  // active-context.json에 기록
  if (skillName) {
    try {
      setActiveSkill(skillName);
    } catch (e) {
      // 무시
    }
  }

  // 스킬별 다음 단계 제안 (최소한만)
  const message = skillName ? getNextStepMessage(skillName) : null;

  if (message) {
    postContext(message);
  } else {
    respond({});
  }
}

main().catch(() => {
  process.stdout.write(JSON.stringify({}) + '\n');
});
