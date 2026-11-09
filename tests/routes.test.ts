import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { GROUPS, MODULES, NAV, SCREENS, crumbs, screenFor } from "../src/ds/shell/nav";
import { EP } from "../src/api/registry";

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const src = walk("src").filter((f) => /\.(tsx?|mjs)$/.test(f));

describe("screen inventory (30 screens)", () => {
  it("has exactly the 30 numbered screens, each with a page file", () => {
    expect(SCREENS.map((s) => s.n)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    for (const s of SCREENS) expect(existsSync(join("src", s.component)), `${s.n} ${s.route}`).toBe(true);
    expect(new Set(SCREENS.map((s) => s.route)).size).toBe(30);
  });
  it("uses the ten primary navigation groups, in order", () => {
    expect(GROUPS).toEqual(["Overview", "Market Intelligence", "Telegram Intelligence", "Research & Agents", "Opportunities", "Decisions", "Risk & Capital", "Execution", "Performance & Learning", "Settings & Administration"]);
    for (const g of NAV) expect(g.items.length).toBeGreaterThan(0);
  });
  it("traces every one of the 16 modules to at least one screen", () => { for (const m of MODULES) expect(SCREENS.some((s) => s.modules.some((x) => x.startsWith(m.split(" ")[0] as string))), m).toBe(true); });
  it("every screen's endpoints exist in the registry and the page reads only what it declares", () => {
    for (const s of SCREENS) { for (const e of s.endpoints) expect(EP[e], `${s.route} -> ${e}`).toBeDefined();
      const code = readFileSync(join("src", s.component), "utf8"); const used = [...code.matchAll(/EP\.(\w+)/g)].map((m) => m[1] as string);
      for (const u of used) expect(s.endpoints, `${s.route} uses EP.${u}`).toContain(u); }
  });
  it("route matching and breadcrumbs handle dynamic segments", () => {
    expect(screenFor("/decisions/abc")?.n).toBe(15); expect(screenFor("/telegram/signals/xyz")?.n).toBe(6); expect(screenFor("/")?.n).toBe(2); expect(screenFor("/nope")).toBeUndefined();
    expect(crumbs("/decisions/abc").map((c) => c.label)).toEqual(["Dashboard", "Decisions", "Decision Centre", "Decision Detail"]);
  });
});

describe("redirects from the old routes", () => {
  const cfg = readFileSync("next.config.mjs", "utf8");
  it("every old route redirects to a real screen", () => {
    const targets = [...cfg.matchAll(/\br\("[^"]+",\s*"([^"]+)"\)/g)].map((m) => m[1] as string);
    expect(targets.length).toBeGreaterThanOrEqual(10);
    for (const t of targets) expect(screenFor(t.replace(/:\w+/g, "x")), t).toBeDefined();
  });
});

describe("safety rules the UI must keep", () => {
  const app = src.filter((f) => f.startsWith(join("src", "app")) || f.startsWith(join("src", "ds")));
  // The ONLY write calls are the two account relays (G-42): login and logout, to the backend's existing /auth/login and /auth/logout. Everything else in the app is GET.
  const AUTH_RELAYS = [join("src", "app", "api", "auth", "login", "route.ts"), join("src", "app", "api", "auth", "logout", "route.ts")];
  it("contains no write call to the backend except the login and logout relays", () => {
    for (const f of app.filter((x) => !AUTH_RELAYS.includes(x))) expect(readFileSync(f, "utf8"), f).not.toMatch(/method:\s*["'](POST|PUT|PATCH|DELETE)/i);
    expect(readFileSync(AUTH_RELAYS[0]!, "utf8")).toMatch(/\/auth\/login/); expect(readFileSync(AUTH_RELAYS[1]!, "utf8")).toMatch(/\/auth\/logout/);
    for (const f of AUTH_RELAYS) expect(readFileSync(f, "utf8"), f).not.toMatch(/\/(admin|me|risk|paper|orders)\//);
  });
  it("has no approve/execute/enable-live control: the only buttons that act are non-trading", () => {
    for (const f of app.filter((x) => x.endsWith(".tsx"))) { const c = readFileSync(f, "utf8"); expect(c, f).not.toMatch(/onClick=\{[^}]*(approve|execute|placeOrder|enableLive|goLive)/i); }
    const live = readFileSync("src/app/execution/live/page.tsx", "utf8"); expect(live).not.toMatch(/<Toggle/); expect(live).toMatch(/LIVE: DISABLED/);
  });
  it("never reads a secret and never exposes the token to the client", () => {
    for (const f of src.filter((x) => !x.includes(join("app", "api")))) { const c = readFileSync(f, "utf8"); expect(c, f).not.toMatch(f === join("src", "lib", "session", "server.ts") ? /TWINS_API_KEY/ : /TWINS_API_KEY|TWINS_API_URL/); expect(c, f).not.toMatch(/NEXT_PUBLIC_[A-Z_]*(KEY|TOKEN|SECRET)/); }
    expect(readFileSync("src/app/settings/broker/page.tsx", "utf8")).not.toMatch(/<input/);
  });
  it("the login page talks only to this app's own account routes through the session client, and forgets the password after each attempt", () => {
    const c = readFileSync("src/app/login/page.tsx", "utf8"); expect(c).toMatch(/preventDefault/); expect(c).not.toMatch(/fetch\(/); expect(c).toMatch(/setPassword\(""\)/); expect(c).toMatch(/autoComplete="current-password"/);
    const s = readFileSync("src/api/session.ts", "utf8"); for (const m of s.matchAll(/fetch\("([^"]+)"/g)) expect(m[1], "session client fetch target").toMatch(/^\/api\/auth\/(me|login|logout)$/);
    expect(s).not.toMatch(/localStorage|sessionStorage|document\.cookie\s*=/); // the token is never stored by page script
  });
  it("outcome and workflow badges are separate components, and money is formatted from strings", () => {
    const p = readFileSync("src/ds/primitives.tsx", "utf8"); expect(p).toMatch(/export const DecisionBadge/); expect(p).toMatch(/export const WorkflowBadge/); expect(p).toMatch(/export const RiskBadge/);
    for (const f of app.filter((x) => x.endsWith(".tsx"))) expect(readFileSync(f, "utf8"), f).not.toMatch(/parseFloat\(|Number\([^)]*(price|pnl|lots|quantity|entry|stop)/i);
  });
  it("no inline sizing arithmetic in pages (the frontend never computes authoritative size)", () => { for (const f of app) expect(readFileSync(f, "utf8"), f).not.toMatch(/riskPerLot\s*[*\/]|lots\s*\*\s*\w*(price|lot)/i); });
});

describe("accessibility regressions found in Stage 09 QA", () => {
  it("the icon-only search button has an accessible name on mobile", () => { expect(readFileSync("src/ds/shell/Shell.tsx", "utf8")).toMatch(/sr-only sm:hidden">Search screens/); });
  it("every page has an h1 even when its data is denied or unavailable (detail pages use a static header)", () => {
    for (const f of ["src/app/decisions/[id]/page.tsx", "src/app/telegram/signals/[id]/page.tsx"]) expect(readFileSync(f, "utf8"), f).toMatch(/<PageHeader title="(Decision|Signal) Details?"/);
  });
  it("scrollable tables are keyboard-focusable regions", () => { expect(readFileSync("src/ds/table.tsx", "utf8")).toMatch(/role="region"[^>]*tabIndex=\{0\}/); });
  it("state headings are h2 so the heading order never skips a level", () => { expect(readFileSync("src/ds/states.tsx", "utf8")).not.toMatch(/<h3/); });
  it("dark and light faint-text tokens keep contrast (values verified with axe)", () => { const c = readFileSync("src/app/globals.css", "utf8"); expect(c).toContain("--fg-faint: 136 146 164"); expect(c).toContain("--fg-faint: 98 110 130"); });
});
