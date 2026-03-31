#!/usr/bin/env node
// 두 문서 비교: node kordoc-compare.mjs <file1> <file2> [--json]
import { readFile } from "node:fs/promises";
import { compare } from "kordoc";

const [,, file1, file2, ...flags] = process.argv;
if (!file1 || !file2) {
  console.error("Usage: node kordoc-compare.mjs <file1> <file2> [--json]");
  process.exit(1);
}

const [buf1, buf2] = await Promise.all([
  readFile(file1).then(b => b.buffer),
  readFile(file2).then(b => b.buffer),
]);

const result = await compare(buf1, buf2);

if (flags.includes("--json")) {
  console.log(JSON.stringify(result, null, 2));
} else {
  const { stats, diffs } = result;
  console.log(`## 비교 결과\n`);
  console.log(`- 추가: ${stats.added}개`);
  console.log(`- 삭제: ${stats.removed}개`);
  console.log(`- 수정: ${stats.modified}개`);
  console.log(`- 동일: ${stats.unchanged}개\n`);
  for (const d of diffs) {
    if (d.type === "unchanged") continue;
    console.log(`[${d.type}] ${d.before?.text ?? ""} → ${d.after?.text ?? ""}`);
  }
}
