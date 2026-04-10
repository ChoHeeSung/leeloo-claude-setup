#!/usr/bin/env node
// 테이블 추출: node kordoc-table.mjs <file> [index]
import { readFile } from "node:fs/promises";
import { parse } from "kordoc";

const [,, file, indexStr] = process.argv;
if (!file) {
  console.error("Usage: node kordoc-table.mjs <file> [index]");
  process.exit(1);
}

const idx = parseInt(indexStr ?? "0", 10);
const buf = await readFile(file).then(b => b.buffer);
const parsed = await parse(buf);
if (!parsed.success) {
  console.error(`파싱 실패: ${parsed.error}`);
  process.exit(1);
}

const tables = parsed.blocks.filter(b => b.type === "table");
if (tables.length === 0) {
  console.error("문서에 테이블이 없습니다.");
  process.exit(1);
}
if (idx >= tables.length) {
  console.error(`테이블 ${idx}번 없음 (총 ${tables.length}개, 0~${tables.length - 1} 사용 가능)`);
  process.exit(1);
}

const t = tables[idx].table;
const header = t.cells[0].map(c => c.text);
console.log(`| ${header.join(" | ")} |`);
console.log(`| ${header.map(() => "---").join(" | ")} |`);
for (let r = 1; r < t.rows; r++) {
  console.log(`| ${t.cells[r].map(c => c.text).join(" | ")} |`);
}
