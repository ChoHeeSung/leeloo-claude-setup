'use strict';

const { readStdin, allowWithMessage, respond } = require('./lib/io');
const { setActiveSkill, loadContext } = require('./lib/context');

/**
 * skill-post.js — Skill 실행 후 오케스트레이션 (PostToolUse:Skill)
 */

function getNextStepMessage(skillName, event) {
  switch (skillName) {
    case 'lk-plan':
      return [
        '[leeloo-kit] lk-plan 완료. 다음 단계를 선택하세요:',
        '  - /lk-cross-validate — Gemini 교차검증으로 plan 품질 검증',
        '  - /lk-pdca design    — Design 단계로 진행',
        '  - /lk-todo create    — plan을 TODO 리스트로 변환'
      ].join('\n');

    case 'lk-pdca': {
      const phase = (event.tool_input && event.tool_input.phase) || '';
      const phaseMap = {
        plan:     '  - /lk-pdca design    — Design 단계로 진행\n  - /lk-cross-validate — Plan 교차검증',
        design:   '  - /lk-pdca do        — Do(실행) 단계로 진행\n  - /lk-cross-validate — Design 교차검증',
        do:       '  - /lk-pdca check     — Check(검증) 단계로 진행',
        check:    '  - /lk-pdca act       — Act(개선) 단계로 진행\n  - /lk-review         — 코드 리뷰 실행',
        act:      '  - /lk-pdca plan      — 새 PDCA 사이클 시작\n  - /lk-todo create    — 개선사항을 TODO로 변환'
      };
      const hint = phaseMap[phase] || '  - /lk-pdca [phase]   — 다음 단계로 진행';
      return `[leeloo-kit] lk-pdca ${phase || ''} 완료. 다음 단계:\n${hint}`;
    }

    case 'lk-cross-validate': {
      const verdict = (event.tool_output && event.tool_output.verdict) || '';
      if (verdict === 'pass') {
        return '[leeloo-kit] 교차검증 통과. 다음 단계:\n  - /lk-pdca design — Design 단계로 진행\n  - /lk-todo create — TODO 변환';
      } else if (verdict === 'fail') {
        return '[leeloo-kit] 교차검증 미통과. 다음 단계:\n  - /lk-plan        — Plan 재작성\n  - /lk-pdca plan   — Plan 수정 후 재검증';
      }
      return '[leeloo-kit] 교차검증 완료. 검증 결과를 확인하고 다음 단계를 선택하세요.';
    }

    default:
      return null;
  }
}

async function main() {
  let event = {};
  try {
    event = await readStdin();
  } catch (e) {
    respond({ decision: 'allow' });
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
    allowWithMessage(message);
  } else {
    respond({ decision: 'allow' });
  }
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
});
