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
      return 'lk-plan 완료 — 사용자에게 /lk-plan-cross-review, /lk-todo create 실행 여부 확인.';

    case 'lk-plan-cross-review':
      return '교차검증 완료 — 결과 확인 후 다음 단계 선택.';

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
