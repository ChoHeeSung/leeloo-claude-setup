#!/usr/bin/env node
// 양식 인식: node kordoc-form.mjs <file> [--json]
import { readFile } from "node:fs/promises";
import { parse, extractFormFields } from "kordoc";

const [,, file, ...flags] = process.argv;
if (!file) {
  console.error("Usage: node kordoc-form.mjs <file> [--json]");
  process.exit(1);
}

const buf = await readFile(file).then(b => b.buffer);
const parsed = await parse(buf);
if (!parsed.success) {
  console.error(`파싱 실패: ${parsed.error}`);
  process.exit(1);
}

const result = extractFormFields(parsed.blocks);

if (flags.includes("--json")) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`## 양식 인식 결과 (신뢰도: ${(result.confidence * 100).toFixed(0)}%)\n`);
  console.log(`| 레이블 | 값 |`);
  console.log(`|--------|-----|`);
  for (const f of result.fields) {
    console.log(`| ${f.label} | ${f.value} |`);
  }
}
