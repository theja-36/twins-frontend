import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { BOT_URL_PATTERN } from "../src/lib/botLink";
import { NO_CLAIM_FILTERS, SRC_TONE, agentShares, applyClaimFilters, approvalFor, decisionStop, isCompleteClaim, marketOf, statusGroup } from "../src/lib/view";
import type { ApprovalSummary, DecisionSummary, TelegramClaim } from "../src/types/trading";

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const src = walk("src").filter((f) => /\.(tsx?|mjs)$/.test(f));

const dec = (o: Partial<DecisionSummary>): DecisionSummary => ({ id: "d1", version: 1, status: "PENDING", effectiveStatus: "PENDING", subjectKind: "options_claim", market: "NSE", instrumentType: "option", symbol: "NIFTY", expiry: null, strike: "24500", optionType: "CE", side: "BUY", entryPrice: "100", stopLoss: "80", targets: [], plannedQuantity: null, plannedNotional: null, plannedMaxLossAmount: null, riskReward: null, confidenceScore: null, sourceTrustTier: null, reasonCode: "", createdAt: "2026-01-01T00:00:00Z", ...o });
describe("decision model", () => {
  it("maps stop quality from the stored reason and level", () => {
    expect(decisionStop(dec({ reasonCode: "STOP_LOSS_BASIS_UNSPECIFIED" })).level).toBe("unspecified");
    expect(decisionStop(dec({ reasonCode: "STOP_LOSS_INVALID" })).level).toBe("invalid");
    expect(decisionStop(dec({ stopLoss: null })).level).toBe("missing");
    expect(decisionStop(dec({})).level).toBe("valid");
  });
  it("groups statuses", () => { expect(["APPROVED_FOR_REVIEW", "REJECTED", "EXPIRED", "PENDING", "WHATEVER"].map(statusGroup)).toEqual(["ready", "rejected", "expired", "pending", "pending"]); });
  it("approval status reads the ledger for the same version only", () => {
    const a: ApprovalSummary = { id: "a", riskDecisionId: "d1", decisionVersion: 1, action: "APPROVE", actorType: "x", actorRef: "y", reason: null, createdAt: "2026-01-01T00:01:00Z" };
    expect(approvalFor(dec({}), [a]).label).toBe("Approved by a person");
    expect(approvalFor(dec({ version: 2 }), [a]).label).not.toBe("Approved by a person");
    expect(approvalFor(dec({ effectiveStatus: "APPROVED_FOR_REVIEW" }), []).label).toMatch(/Waiting/);
  });
  it("bull/neutral/bear uses weight x confidence of scoring agents only", () => {
    const ag = (verdict: string, weight: number, confidence: number | null) => ({ agentId: verdict, verdict, status: "COMPLETED", confidence, weight, required: true, scored: confidence !== null, reasonCodes: [], errorCode: null });
    const s = agentShares({ agents: [ag("SUPPORTIVE", 0.4, 50), ag("NEUTRAL", 0.2, 100), ag("CAUTION", 0.4, 50), ag("ADVERSE", 1, null)] });
    expect(s?.bull).toBeCloseTo(33.33, 1); expect(s?.neutral).toBeCloseTo(33.33, 1); expect(s?.bear).toBeCloseTo(33.33, 1);
    expect(agentShares({ agents: [ag("SUPPORTIVE", 1, null)] })).toBeNull();
  });
  it("source tones keep missing, stale and failing apart", () => { expect([SRC_TONE.MISSING, SRC_TONE.STALE, SRC_TONE.FAILING, SRC_TONE.OK]).toEqual(["mute", "warn", "bad", "ok"]); });
});

const claim = (o: Partial<TelegramClaim>): TelegramClaim => ({ id: "c", channel: "***1", receivedAt: null, ageSeconds: 600, parserVersion: "v3", resultKind: "claim", assessmentOutcome: "INSUFFICIENT_EVIDENCE", blockers: [], claim: { action: "buy", underlying: "NIFTY", strike: 24500, optionType: "CE", entry: { type: "above", price: 100, low: null, high: null }, stopLoss: 80, targets: [], levelBasis: null, levelBasisInferred: false, levelBasisConflict: false, expiry: { status: null, day: null, month: null, year: null } }, ...o });
describe("claim filters (run on loaded records)", () => {
  const rows = [claim({ id: "a" }), claim({ id: "b", channel: "***2", ageSeconds: 100000 }), claim({ id: "c", claim: { ...claim({}).claim!, underlying: "SENSEX", action: null, entry: { type: "unspecified", price: null, low: null, high: null } } })];
  it("market is derived from the index name", () => { expect(marketOf("SENSEX")).toBe("BSE"); expect(marketOf("NIFTY")).toBe("NSE"); expect(marketOf(null)).toBe("unknown"); });
  it("filters by channel, market, side, time and completeness", () => {
    const ids = (f: Partial<typeof NO_CLAIM_FILTERS>) => applyClaimFilters(rows, { ...NO_CLAIM_FILTERS, ...f }).map((r) => r.id);
    expect(ids({})).toEqual(["a", "b", "c"]); expect(ids({ channel: "***2" })).toEqual(["b"]); expect(ids({ market: "BSE" })).toEqual(["c"]);
    expect(ids({ side: "none" })).toEqual(["c"]); expect(ids({ sinceHours: 1 })).toEqual(["a", "c"]); expect(ids({ completeOnly: true })).toEqual(["a", "b"]);
  });
  it("complete-claims filter is not a result-report detector", () => { expect(isCompleteClaim(rows[2] as TelegramClaim)).toBe(false); expect(isCompleteClaim(rows[0] as TelegramClaim)).toBe(true); });
});

describe("build-time env flags are inlinable", () => {
  it("uses dot access for every NEXT_PUBLIC variable (bracket access is not inlined by Next)", () => {
    const bad = src.filter((f) => /process\.env\[\s*["']NEXT_PUBLIC_/.test(readFileSync(f, "utf8")));
    expect(bad).toEqual([]);
  });
});

describe("approval bot link", () => {
  it("accepts only https://t.me/<bot>", () => {
    expect(BOT_URL_PATTERN.test("https://t.me/twins_bot")).toBe(true);
    expect(BOT_URL_PATTERN.test("http://t.me/twins_bot")).toBe(false);
    expect(BOT_URL_PATTERN.test("https://evil.example/t.me/twins_bot")).toBe(false);
  });
  it("is surfaced by the Approval Centre (the repaired link)", () => { expect(readFileSync(join("src", "app", "approvals", "page.tsx"), "utf8")).toContain("BOT_LINK"); });
});
