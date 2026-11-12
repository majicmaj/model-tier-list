// Hard quality gate. Runs in `pnpm build`. Fails the build on violation.
// Scope: hand-written code only. Generated data in src/data is exempt.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const MAX_LINES = 800;
const DIRS = ["src", "scripts"];
const CODE_EXT = new Set([".ts", ".tsx", ".mjs", ".css", ".js"]);
const EXEMPT = ["src/data/"];

function list(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...list(full));
    else out.push(full);
  }
  return out;
}

function stripNoise(text) {
  // Remove block comments, line comments, strings, templates (rough but enough).
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
}

function maxDepth(text) {
  let depth = 0;
  let peak = 0;
  for (const ch of stripNoise(text)) {
    if (ch === "{" || ch === "(" || ch === "[") {
      depth += 1;
      if (depth > peak) peak = depth;
    } else if (ch === "}" || ch === ")" || ch === "]") {
      if (depth > 0) depth -= 1;
    }
  }
  return peak;
}

const failures = [];
for (const dir of DIRS) {
  for (const file of list(join(ROOT, dir))) {
    const rel = relative(ROOT, file);
    if (EXEMPT.some((p) => rel.startsWith(p))) continue;
    if (![...CODE_EXT].some((ext) => file.endsWith(ext))) continue;
    const text = readFileSync(file, "utf8");
    const lines = text.split("\n").length;
    const depth = maxDepth(text);
    console.log(`${rel}: ${lines} lines, est. depth ${depth}`);
    if (lines > MAX_LINES) {
      failures.push(`${rel} has ${lines} lines (cap is ${MAX_LINES})`);
    }
  }
}

if (failures.length > 0) {
  console.error("\nQUALITY GATE FAILED:");
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
console.log("\nQuality gate passed.");
