import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { EP } from "../src/api/registry";
import { contractFixture } from "../src/api/fixtures/contracts";
import { routeFixture } from "../src/api/fixtures/legacy";
import { apiError, errorFromStatus } from "../src/api/query";
import catalogue from "../src/api/contracts/analytics.endpoints.json";

describe("endpoint registry", () => {
  const all = Object.entries(EP);
  it("every endpoint has an id, a path and a validator", () => { for (const [k, d] of all) { expect(d.id, k).toBeTruthy(); expect(d.path, k).toBeTruthy(); expect(typeof d.validate, k).toBe("function"); } });
  it("owner-scoped data is never fetched with the shared token: those endpoints are NEEDS_SESSION", () => {
    for (const k of ["decisions", "riskOverview", "capital", "simulations", "approvals", "orders", "fills", "positionsV2", "broker", "admin"] as const) expect(EP[k].availability, k).toBe("NEEDS_SESSION");
    for (const [k, d] of all) if (k.startsWith("a") && /^analytics\./.test(d.id)) expect(d.availability, k).toBe("NEEDS_SESSION");
  });
  it("every non-legacy endpoint names the missing backend dependency", () => { for (const [k, d] of all) if (d.availability !== "LEGACY_READ") expect(d.dependency, k).toMatch(/.{25,}/); });
  it("every LEGACY_READ path is allowed by the proxy allow-list", () => {
    const route = readFileSync("src/app/api/twins/[...path]/route.ts", "utf8"), re = [...route.matchAll(/^\s*(\/\^.*\$\/i?),$/gm)].map((m) => new Function(`return ${m[1]}`)() as RegExp);
    for (const [k, d] of all) if (d.availability === "LEGACY_READ") expect(re.some((r) => r.test(d.path.split("?")[0] as string)), k).toBe(true);
  });
  it("analytics endpoints match the backend contract catalogue (11 GET, session required, analytics:read)", () => {
    expect(catalogue.endpoints).toHaveLength(11);
    for (const e of catalogue.endpoints as Array<Record<string, unknown>>) { expect(e.method).toBe("GET"); expect(e.permission).toBe("analytics:read"); }
    for (const e of catalogue.endpoints as Array<{ path: string }>) expect(Object.values(EP).some((d) => d.path === e.path), e.path).toBe(true);
  });
  it("the proxy stays GET-only", () => { const r = readFileSync("src/app/api/twins/[...path]/route.ts", "utf8"); expect(r).toMatch(/export async function GET/); expect(r).not.toMatch(/export async function (POST|PUT|PATCH|DELETE)/); });
});

describe("fixtures", () => {
  it("every fixture-backed endpoint validates against its own validator", () => {
    for (const [k, d] of Object.entries(EP)) { const raw = contractFixture(d.id) ?? routeFixture(d.path, "populated"); expect(raw, `${k} has no demo fixture`).toBeDefined(); expect(d.validate(raw), k).not.toBeNull(); }
  });
  it("every CONTRACT_ONLY and NEEDS_SESSION endpoint has a demo fixture", () => { for (const [k, d] of Object.entries(EP)) if (d.availability !== "LEGACY_READ") expect(contractFixture(d.id), k).toBeDefined(); });
  it("fixture analytics are labelled and never claim validated reliability", () => {
    const o = contractFixture("analytics.overview") as { data: { all: { reliability: string }; fixtureOnly: { reliability: string }; validatedOnly: { eligible: number } }; liveStatus: string; dataset: string };
    expect(o.data.all.reliability).toBe("NOT_VALIDATED_FIXTURE"); expect(o.data.fixtureOnly.reliability).toBe("NOT_VALIDATED_FIXTURE"); expect(o.data.validatedOnly.eligible).toBe(0); expect(o.liveStatus).toBe("UNAVAILABLE"); expect(o.dataset).toBe("PAPER");
  });
  it("money in fixtures is a decimal string", () => { const d = contractFixture("decisions") as { decisions: Array<{ permittedSize: { maxLossAtStop: unknown } | null }> }; for (const x of d.decisions) if (x.permittedSize) expect(typeof x.permittedSize.maxLossAtStop).toBe("string"); });
  it("fixtures cannot be imported by anything except the query layer", () => {
    const { readdirSync, statSync } = require("node:fs") as typeof import("node:fs"), { join } = require("node:path") as typeof import("node:path");
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
    const users = walk("src").filter((f) => /\.(tsx?)$/.test(f) && !f.includes(join("src", "api", "fixtures")) && /fixtures\/(contracts|legacy)/.test(readFileSync(f, "utf8")));
    expect(users).toEqual([join("src", "api", "query.ts")]);
    const q = readFileSync("src/api/query.ts", "utf8"); expect(q).toMatch(/if \(process\.env\.NEXT_PUBLIC_TWINS_DEMO === "1"\) \{/); expect(q).not.toMatch(/^import .*fixtures/m);
  });
});

describe("error normalisation", () => {
  it("maps statuses to stable kinds and marks only transient ones retryable", () => {
    expect(errorFromStatus(503).kind).toBe("not_configured"); expect(errorFromStatus(401).kind).toBe("unauthorized"); expect(errorFromStatus(403).kind).toBe("forbidden"); expect(errorFromStatus(404).kind).toBe("not_found"); expect(errorFromStatus(429).kind).toBe("rate_limited"); expect(errorFromStatus(502).kind).toBe("unreachable");
    expect(apiError("forbidden").retryable).toBe(false); expect(apiError("unreachable").retryable).toBe(true);
  });
  it("never leaks backend text into an error message", () => { for (const k of ["not_configured", "unreachable", "unauthorized", "forbidden", "not_found", "bad_answer", "rate_limited"] as const) expect(apiError(k).message).not.toMatch(/token|bearer|stack|sql/i); });
});

describe("partial answers (an answer that names parts of itself as not available)", () => {
  it("channel performance is partial while outcomes are NOT_AVAILABLE, and says why", async () => {
    const { epIntel } = await import("../src/api/registry");
    const d = epIntel.performance("x");
    expect(d.partialReason?.({ outcomes: { status: "NOT_AVAILABLE", reason: "r" } } as never)).toMatch(/not available/i);
  });
  it("historical matches are partial unless the evidence is SUFFICIENT; the backend's reason is shown verbatim", async () => {
    const { epIntel } = await import("../src/api/registry");
    const d = epIntel.matches("x");
    expect(d.partialReason?.({ state: "SUFFICIENT" } as never)).toBeNull();
    expect(d.partialReason?.({ state: "NO_COMPARABLE_CASES", reason: "No archived case is comparable." } as never)).toBe("No archived case is comparable.");
  });
});
