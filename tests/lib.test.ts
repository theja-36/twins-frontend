import { describe, expect, it } from "vitest";
import { entryText, expiryText, filterFeed, summarizeChannels } from "../src/lib/channels";
import { filterClaims, NO_FILTER, qualityCounts, stopQuality } from "../src/lib/claims";
import { currentDrawdownR, dayPnl, equityCurve, exposureBySymbol } from "../src/lib/portfolio";
import { formatCount } from "../src/components/motion/format";
import type { PositionView, TelegramClaim, TradeOutcome } from "../src/types/trading";

const claim = (o: Partial<NonNullable<TelegramClaim["claim"]>> = {}): TelegramClaim["claim"] => ({ action: "buy", underlying: "SENSEX", strike: 80000, optionType: "CE", entry: { type: "above", price: 300, low: null, high: null }, stopLoss: 250, targets: [350], levelBasis: "unspecified", levelBasisInferred: false, levelBasisConflict: false, expiry: { status: "day_month", day: 12, month: 11, year: null }, ...o });
const row = (o: Partial<TelegramClaim> = {}): TelegramClaim => ({ id: "a", channel: "***2544", receivedAt: "2031-01-05T08:00:00Z", ageSeconds: 3600, parserVersion: "telegram-regex-v3", resultKind: "claim", assessmentOutcome: "INSUFFICIENT_EVIDENCE", claim: claim(), blockers: [], ...o });

describe("stopQuality", () => {
  it("grades every case in plain words", () => {
    expect(stopQuality(null).level).toBe("none");
    expect(stopQuality(claim({ stopLoss: null })).label).toBe("No stop");
    expect(stopQuality(claim({ levelBasisConflict: true })).level).toBe("poor");
    expect(stopQuality(claim({ levelBasis: "premium" })).level).toBe("good");
    expect(stopQuality(claim({ levelBasis: "underlying" })).level).toBe("good");
    const inferred = stopQuality(claim({ levelBasis: "premium", levelBasisInferred: true }));
    expect(inferred).toMatchObject({ level: "caution", label: "Premium (assumed)", pctOfStrike: 0.31 });
    expect(stopQuality(claim()).level).toBe("poor");
  });
  it("counts by level", () => { expect(qualityCounts([row(), row({ claim: claim({ levelBasis: "premium" }) }), row({ claim: null })])).toEqual({ good: 1, caution: 0, poor: 1, none: 1 }); });
});

describe("filterClaims", () => {
  const rows = [row(), row({ id: "b", channel: "***2041", ageSeconds: 100000, claim: claim({ underlying: "NIFTY", action: "sell", stopLoss: null }), assessmentOutcome: "REJECT" }), row({ id: "c", claim: claim({ action: null }) })];
  it("filters by each dimension", () => {
    expect(filterClaims(rows, NO_FILTER)).toHaveLength(3);
    expect(filterClaims(rows, { ...NO_FILTER, underlying: "NIFTY" }).map((r) => r.id)).toEqual(["b"]);
    expect(filterClaims(rows, { ...NO_FILTER, side: "sell" }).map((r) => r.id)).toEqual(["b"]);
    expect(filterClaims(rows, { ...NO_FILTER, side: "none" }).map((r) => r.id)).toEqual(["c"]);
    expect(filterClaims(rows, { ...NO_FILTER, outcome: "REJECT" }).map((r) => r.id)).toEqual(["b"]);
    expect(filterClaims(rows, { ...NO_FILTER, stop: "without" }).map((r) => r.id)).toEqual(["b"]);
    expect(filterClaims(rows, { ...NO_FILTER, sinceHours: 24 }).map((r) => r.id)).toEqual(["a", "c"]);
    expect(filterClaims(rows, { ...NO_FILTER, channel: "***2041" }).map((r) => r.id)).toEqual(["b"]);
  });
});

describe("channels helpers", () => {
  const recent = [{ id: "1", type: "m", status: "COMPLETED", attempts: 1, receivedAt: "2031-01-02T00:00:00Z", completedAt: null, channel: "***A" }, { id: "2", type: "m", status: "FAILED", attempts: 2, receivedAt: "2031-01-03T00:00:00Z", completedAt: null, channel: "***B" }, { id: "3", type: "m", status: "COMPLETED", attempts: 1, receivedAt: "2031-01-04T00:00:00Z", completedAt: null, channel: "***A" }];
  it("summarizes and filters", () => {
    const s = summarizeChannels(recent);
    expect(s.map((c) => [c.channel, c.total, c.lastReceivedAt])).toEqual([["***A", 2, "2031-01-04T00:00:00Z"], ["***B", 1, "2031-01-03T00:00:00Z"]]);
    expect(filterFeed(recent, null)).toHaveLength(3);
    expect(filterFeed(recent, new Set(["***B"])).map((r) => r.id)).toEqual(["2"]);
    expect(filterFeed(recent, new Set())).toEqual([]);
  });
  it("words for expiry and entry", () => {
    expect(expiryText({ status: "missing", day: null, month: null, year: null })).toBe("no expiry given");
    expect(expiryText({ status: "day_month", day: 12, month: 11, year: null })).toBe("12 Nov (year not given)");
    expect(expiryText({ status: "full", day: 12, month: 11, year: 2031 })).toBe("12 Nov 2031");
    expect(entryText({ type: "above", price: 300, low: null, high: null })).toBe("above 300");
    expect(entryText({ type: "range", price: null, low: 100, high: 120 })).toBe("100 to 120");
    expect(entryText({ type: "unspecified", price: null, low: null, high: null })).toBe("not given");
  });
});

const outcome = (pnl: number, r: number, closedAt: string): TradeOutcome => ({ tradeId: closedAt, riskDecisionId: "d", symbol: "X", side: "BUY", outcome: pnl > 0 ? "WIN" : "LOSS", pnl, rMultiple: r, closeReason: "TARGET", targetsHit: 1, holdingSeconds: 60, mfeR: 1, maeR: 0, closedAt });
const pos = (o: Partial<PositionView>): PositionView => ({ tradeId: "t", riskDecisionId: "d", symbol: "A", side: "BUY", state: "OPEN", quantity: 10, remainingQuantity: 10, entryPrice: 100, fillPrice: 100, stop: 95, targets: [110], targetsHit: 0, trailingActive: false, lastPrice: 101, realizedPnl: 0, unrealizedPnl: 10, totalPnl: 10, rMultiple: 0.2, openedAt: null, ...o });
describe("portfolio helpers", () => {
  it("equity curve and drawdown in R", () => {
    const c = equityCurve([outcome(-50, -1, "2031-01-03T00:00:00Z"), outcome(100, 2, "2031-01-01T00:00:00Z"), outcome(-100, -2, "2031-01-04T00:00:00Z")]);
    expect(c.map((p) => [p.pnl, p.r, p.drawdownR])).toEqual([[100, 2, 0], [50, 1, 1], [-50, -1, 3]]);
    expect(currentDrawdownR(c)).toBe(3);
    expect(currentDrawdownR([])).toBe(0);
    expect(equityCurve([{ ...outcome(1, 1, "x"), pnl: Number.NaN }])).toEqual([]);
  });
  it("exposure by symbol ignores closed positions and sums shares to 100", () => {
    const e = exposureBySymbol([pos({}), pos({ symbol: "B", fillPrice: 200, remainingQuantity: 5 }), pos({ symbol: "C", state: "CLOSED" }), pos({ symbol: "A", remainingQuantity: 10 })]);
    expect(e.map((x) => [x.symbol, x.notional])).toEqual([["A", 2000], ["B", 1000]]);
    expect(e.reduce((a, x) => a + x.share, 0)).toBeCloseTo(100, 0);
    expect(exposureBySymbol([])).toEqual([]);
  });
  it("day P&L is today's closed trades plus open unrealised", () => {
    const now = new Date(2031, 0, 5, 12, 0, 0);
    expect(dayPnl([outcome(100, 1, new Date(2031, 0, 5, 9).toISOString()), outcome(500, 1, new Date(2031, 0, 4, 9).toISOString())], [pos({ unrealizedPnl: 25 })], now)).toBe(125);
  });
});

describe("formatCount", () => {
  it("formats Indian grouping and guards non-finite", () => {
    expect(formatCount(123456.5, 1, "₹")).toBe("₹1,23,456.5");
    expect(formatCount(Number.NaN, 0)).toBe("—");
    expect(formatCount(12, 0, "", "%")).toBe("12%");
  });
});

import { formatCountdown, sessionAt } from "../src/lib/marketHours";

describe("sessionAt (IST)", () => {
  // 2026-11-09 is a Monday. 03:45Z = 09:15 IST.
  it("is open between 09:15 and 15:30 IST on a weekday", () => {
    expect(sessionAt(new Date("2026-11-09T03:45:00Z")).state).toBe("open");
    expect(sessionAt(new Date("2026-11-09T09:59:59Z")).state).toBe("open");
    expect(sessionAt(new Date("2026-11-09T10:00:00Z")).state).toBe("closed");
  });
  it("is pre-open from 09:00 to 09:15 and closed before", () => {
    expect(sessionAt(new Date("2026-11-09T03:30:00Z")).state).toBe("pre_open");
    expect(sessionAt(new Date("2026-11-09T03:29:59Z")).state).toBe("closed");
  });
  it("counts down to the right instant", () => {
    expect(sessionAt(new Date("2026-11-09T03:44:00Z")).secondsToChange).toBe(60);
    expect(sessionAt(new Date("2026-11-09T09:59:00Z")).secondsToChange).toBe(60);
  });
  it("treats Saturday and Sunday as weekend and points at Monday pre-open", () => {
    const sat = sessionAt(new Date("2026-11-07T06:00:00Z")); // Saturday 11:30 IST
    expect(sat.state).toBe("weekend");
    expect(sat.secondsToChange).toBe(2 * 86_400 - 11.5 * 3600 + 9 * 3600 + 86_400 - 86_400);
    expect(sessionAt(new Date("2026-11-08T06:00:00Z")).state).toBe("weekend");
  });
  it("uses IST for the date, not UTC (Sunday 23:00Z is Monday 04:30 IST)", () => {
    expect(sessionAt(new Date("2026-11-08T23:00:00Z")).state).toBe("closed");
  });
  it("formats countdowns", () => {
    expect(formatCountdown(59)).toBe("0m 59s");
    expect(formatCountdown(3 * 3600 + 120)).toBe("3h 2m");
    expect(formatCountdown(2 * 86_400 + 3600)).toBe("2d 1h");
  });
});
