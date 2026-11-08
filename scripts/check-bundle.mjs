// Fails if a production build contains Studio fixture data or a backend key. Run after `next build` (without NEXT_PUBLIC_STUDIO_FIXTURES=1).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const bad = ["Channel A", "3f1c9a2e-7b44", "routeFixture", "twins-decision-card-v1", "TWINS_API_KEY="];
const hits = walk(".next/static").filter((f) => f.endsWith(".js")).flatMap((f) => { const t = readFileSync(f, "utf8"); return bad.filter((k) => t.includes(k)).map((k) => `${f}: ${k}`); });
if (hits.length) { console.error("bundle check FAILED\n" + hits.join("\n")); process.exit(1); }
console.log("bundle check ok: no fixture data or key material in .next/static");
