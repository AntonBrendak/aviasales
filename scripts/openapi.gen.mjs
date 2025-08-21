import { readdirSync, statSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const IN_DIR = join(ROOT, "packages", "contracts", "openapi");
const OUT_DIR = join(ROOT, "packages", "contracts", "types");

// рекурсивный поиск *.yaml|*.yml
function findSpecs(dir) {
  const res = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) res.push(...findSpecs(p));
    else if (/\.(ya?ml)$/i.test(name)) res.push(p);
  }
  return res;
}

function outFileFor(specPath) {
  // "bff.v1.yaml" -> "bff.ts"; "search.yaml" -> "search.ts"
  const file = basename(specPath);
  const base = file.replace(/\.(ya?ml)$/i, "").replace(/\.v\d+$/i, "");
  return join(OUT_DIR, `${base}.ts`);
}

(function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const specs = findSpecs(IN_DIR);
  if (specs.length === 0) {
    console.error(`[openapi:gen] No specs found under ${IN_DIR}`);
    process.exit(1);
  }
  for (const spec of specs) {
    const out = outFileFor(spec);
    console.log(`[openapi:gen] ${spec} -> ${out}`);
    execFileSync(
      "pnpm",
      ["exec", "openapi-typescript", spec, "-o", out],
      { stdio: "inherit" }
    );
  }
  console.log("[openapi:gen] Done.");
})();