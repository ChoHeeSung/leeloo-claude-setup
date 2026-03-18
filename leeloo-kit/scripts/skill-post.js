'use strict';

const { readStdin, respond, postContext } = require('./lib/io');
const { setActiveSkill } = require('./lib/context');

/**
 * skill-post.js — Skill 실행 후 오케스트레이션 (PostToolUse:Skill)
 */

function getNextStepMessage(skillName, event) {
  switch (skillName) {
    case 'lk-plan':
      return [
        '[leeloo-kit] lk-plan 완료. 사용자에게 다음 각 항목의 실행 여부를 반드시 확인하세요:',
        '  1. /lk-cross-validate — Gemini 교차검증 실행할까요?',
        '  2. /lk-todo create    — Plan을 TODO 리스트로 변환할까요?',
        '  3. /lk-pdca design    — 바로 Design 단계로 진행할까요?'
      ].join('\n');

    case 'lk-pdca': {
      const phase = (event.tool_input && event.tool_input.phase) || '';
      const phaseMap = {
        plan:     '  - /lk-pdca design    — Design 단계로 진행\n  - /lk-cross-validate — Plan 교차검증',
        design:   '  - /lk-pdca do        — Do(실행) 단계로 진행\n  - /lk-cross-validate — Design 교차검증',
        do:       '  - /lk-pdca analyze   — Analyze(검증) 단계로 진행',
        analyze:  '  - /lk-pdca report    — Report 생성\n  - /lk-review         — 코드 리뷰 실행',
        report:   '  - /lk-todo create    — 후속 작업을 TODO로 변환'
      };
      const hint = phaseMap[phase] || '  - /lk-pdca [phase]   — 다음 단계로 진행';
      return `[leeloo-kit] lk-pdca ${phase || ''} 완료. 다음 단계:\n${hint}`;
    }

    case 'lk-cross-validate':
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

  // 스킬별 다음 단계 제안
  const message = skillName ? getNextStepMessage(skillName, event) : null;

  if (message) {
    postContext(message);
  } else {
    respond({});
  }
}

main().catch(() => {
  process.stdout.write(JSON.stringify({}) + '\n');
});
