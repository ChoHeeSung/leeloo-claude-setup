# CLAUDE.md 미존재 시 자동 생성 수정

## 지시 요약
프로젝트에 CLAUDE.md가 없을 때 Failure Memory 기록이 누락되는 버그 수정.

## 작업 내용
- `failure-log.js`의 `updateClaudeMdSummary()`에서 CLAUDE.md 미존재 시 `return`하던 로직 수정
- CLAUDE.md가 없으면 프로젝트명 + Failure Memory 섹션으로 자동 생성

## 핵심 코드
```javascript
// 변경 전
if (!fs.existsSync(claudeMdPath)) return;

// 변경 후
if (!fs.existsSync(claudeMdPath)) {
  content = `# ${path.basename(process.cwd())}\n\n${targetSection}\n`;
}
```

## 결과
CLAUDE.md가 없는 프로젝트에서도 Failure Memory Loop가 정상 동작.
