#!/usr/bin/env node
// Markdown → HWPX 변환: node kordoc-md2hwpx.mjs <input.md> [output.hwpx]
import { readFile, writeFile, stat } from "node:fs/promises";
import { resolve, dirname, basename, extname, join } from "node:path";
import { markdownToHwpx } from "kordoc";

const [,, inputArg, outputArg] = process.argv;
if (!inputArg) {
  console.error("Usage: node kordoc-md2hwpx.mjs <input.md> [output.hwpx]");
  process.exit(1);
}

const inputPath = resolve(inputArg);
try {
  await stat(inputPath);
} catch {
  console.error(`입력 파일이 없습니다: ${inputPath}`);
  process.exit(1);
}

const outputPath = outputArg
  ? resolve(outputArg)
  : join(dirname(inputPath), basename(inputPath, extname(inputPath)) + ".hwpx");

const md = await readFile(inputPath, "utf8");
const t0 = Date.now();
const buf = await markdownToHwpx(md);
const ms = Date.now() - t0;

await writeFile(outputPath, Buffer.from(buf));
console.log(`✓ 변환 완료: ${outputPath}`);
console.log(`  크기: ${buf.byteLength.toLocaleString()} bytes`);
console.log(`  시간: ${ms}ms`);
