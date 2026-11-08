import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { SIGNALS } from "../src/studio/fixtures";

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

describe("studio fixtures", () => {
  it("are imported only by the studio prototype, never by production code", () => {
    const offenders = walk("src").filter((f) => /\.tsx?$/.test(f) && !f.startsWith(join("src", "studio")) && !f.startsWith(join("src", "app", "studio")) && /studio\/fixtures/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
  it("carry no approval capability and no invented performance figures", () => {
    for (const s of SIGNALS) expect(Object.keys(s)).not.toEqual(expect.arrayContaining(["pnl", "confidence", "returns"]));
    const code = walk(join("src", "studio")).concat(walk(join("src", "app", "studio"))).filter((f) => /\.tsx$/.test(f)).map((f) => readFileSync(f, "utf8")).join("\n");
    expect(code).not.toMatch(/method:\s*["']POST/i);
  });
});
