import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { BOT_URL_PATTERN } from "../src/studio/botLink";
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
  it("uses the same bot-link rule as the decision page", () => {
    expect(readFileSync(join("src", "components", "trading", "DecisionCard.tsx"), "utf8")).toContain(BOT_URL_PATTERN.source);
    expect(BOT_URL_PATTERN.test("https://t.me/twins_bot")).toBe(true);
    expect(BOT_URL_PATTERN.test("http://t.me/twins_bot")).toBe(false);
    expect(BOT_URL_PATTERN.test("https://evil.example/t.me/twins_bot")).toBe(false);
  });
});
