#!/usr/bin/env node
// HWPX 생성: node kordoc-generate.mjs <input.md> <output.hwpx>
import { readFile, writeFile } from "node:fs/promises";
import { markdownToHwpx } from "kordoc";

const [,, input, output] = process.argv;
if (!input || !output) {
  console.error("Usage: node kordoc-generate.mjs <input.md> <output.hwpx>");
  process.exit(1);
}

const md = await readFile(input, "utf8");
const hwpxBuf = await markdownToHwpx(md);
await writeFile(output, Buffer.from(hwpxBuf));
console.log(`HWPX 생성 완료: ${output}`);
