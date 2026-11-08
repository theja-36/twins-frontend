/**
 * TEST FIXTURES, shaped exactly like the backend's read routes. Every value is INVENTED.
 * Loaded only through a dynamic import in src/studio/data.ts and only when NEXT_PUBLIC_STUDIO_FIXTURES=1 (local visual QA).
 * No other module may import this file (tests/studio.test.ts).
 */
const iso = (minAgo: number): string => new Date(Date.now() - minAgo * 60_000).toISOString();
const ID = { f1: "3f1c9a2e-7b44-4d0a-9c1e-5a8d2b6e1f01", f2: "8be2d410-65aa-4c27-8f3d-0c9a71e4b202", f3: "c07a55f3-19de-48b1-a6c4-7d2e90b3c303", f4: "d41b8e62-0f37-4a95-b2d8-3e6c1a7f4404", f5: "e92c3a77-5b18-4d6f-8a01-9f4d2c8e5505", f6: "fa5d4b88-2c69-4e30-9b12-1a7e3d9f6606" };
const dec = (id: string, o: Record<string, unknown>) => ({ id, version: 1, status: "PENDING", effectiveStatus: "PENDING", subjectKind: "options_claim", market: "NSE", instrumentType: "option", expiry: null, strike: null, optionType: null, side: "BUY", entryPrice: null, stopLoss: null, targets: [], plannedQuantity: null, plannedNotional: null, plannedMaxLossAmount: null, riskReward: null, confidenceScore: null, sourceTrustTier: null, reasonCode: "", ...o });
const decisions = () => [
  dec(ID.f1, { symbol: "NIFTY", strike: "24500", optionType: "CE", expiry: "2026-11-12", entryPrice: "118", stopLoss: "96", targets: ["140", "165"], reasonCode: "STOP_LOSS_BASIS_UNSPECIFIED", createdAt: iso(6) }),
  dec(ID.f2, { status: "APPROVED_FOR_REVIEW", effectiveStatus: "APPROVED_FOR_REVIEW", symbol: "BANKNIFTY", strike: "52000", optionType: "PE", expiry: "2026-11-11", entryPrice: "210", stopLoss: "172", targets: ["250", "290", "340"], plannedQuantity: "150", plannedNotional: "31500", plannedMaxLossAmount: "5700", riskReward: "2.1", reasonCode: "ALL_GATES_PASSED", createdAt: iso(33) }),
  dec(ID.f3, { market: "BSE", symbol: "SENSEX", strike: "81000", optionType: "CE", entryPrice: "305", stopLoss: "255", targets: ["350", "400"], reasonCode: "STOP_LOSS_BASIS_UNSPECIFIED", createdAt: iso(50) }),
  dec(ID.f4, { status: "REJECTED", effectiveStatus: "REJECTED", symbol: "NIFTY", strike: "24300", optionType: "PE", expiry: "2026-11-12", entryPrice: "96", targets: ["120", "140"], reasonCode: "STOP_LOSS_MISSING", createdAt: iso(77) }),
  dec(ID.f5, { status: "APPROVED_FOR_REVIEW", effectiveStatus: "EXPIRED", symbol: "BANKNIFTY", strike: "51800", optionType: "CE", expiry: "2026-11-11", entryPrice: "188", stopLoss: "150", targets: ["225", "260"], plannedQuantity: "150", plannedNotional: "28200", plannedMaxLossAmount: "5700", riskReward: "1.9", reasonCode: "ALL_GATES_PASSED", createdAt: iso(96) }),
  dec(ID.f6, { symbol: "FINNIFTY", strike: "23400", optionType: "CE", expiry: "2026-11-11", entryPrice: "74", stopLoss: "58", targets: ["92", "110"], reasonCode: "UNSUPPORTED_INSTRUMENT", createdAt: iso(113) }),
];
const ag = (agentId: string, verdict: string, confidence: number | null, weight: number, reasonCodes: string[]) => ({ agentId, verdict, status: confidence === null ? "UNAVAILABLE" : "COMPLETED", confidence, weight, required: agentId !== "news", scored: confidence !== null, reasonCodes, errorCode: null });
const cards: Record<string, unknown> = {
  [ID.f1]: { format: "twins-decision-card-v1", riskDecisionId: ID.f1, decisionVersion: 1, runId: "run-1", headline: { assessment: "RESEARCH_CAUTION", decidedBy: "RULE_ENGINE", score: 41, halts: true, haltReason: "stop-loss basis not stated" },
    agents: [ag("technical", "NEUTRAL", 62, 0.4, ["trend.above_mean"]), ag("news", "NEUTRAL", null, 0.2, []), ag("risk-context", "CAUTION", 70, 0.4, ["premium_data.unavailable"])],
    blockers: [{ agentId: "risk-context", findingCodes: ["premium_data.unavailable", "contract.master_unconfigured"] }], unavailable: [{ agentId: "news", status: "UNAVAILABLE", errorCode: null, required: false }],
    closeCalls: [{ rule: "stop_basis_stated", threshold: 1, value: 0, met: false, margin: -1 }, { rule: "premium_quote_age_s", threshold: 30, value: 0, met: false, margin: -30 }],
    sizing: { status: "NOT_SIZED", reasonCode: "STOP_LOSS_BASIS_UNSPECIFIED", quantity: 0, maxLossPercent: null, riskReward: null, trustTier: null }, sourceHealth: { overall: "MISSING", notUsable: [{ provider: "option-quotes", status: "MISSING", reasons: ["no quotes exported"] }] },
    statements: ["This is a research view, not a recommendation.", "It cannot be sized until the stop basis and live option prices are known."], grantsApproval: false },
  [ID.f2]: { format: "twins-decision-card-v1", riskDecisionId: ID.f2, decisionVersion: 1, runId: "run-2", headline: { assessment: "RESEARCH_SUPPORTIVE", decidedBy: "RULE_ENGINE", score: 74, halts: false, haltReason: "all required checks passed" },
    agents: [ag("technical", "SUPPORTIVE", 66, 0.4, ["trend.aligned"]), ag("news", "NEUTRAL", null, 0.2, []), ag("risk-context", "SUPPORTIVE", 72, 0.4, ["budget.inside"])],
    blockers: [], unavailable: [{ agentId: "news", status: "UNAVAILABLE", errorCode: null, required: false }],
    closeCalls: [{ rule: "reward_to_risk", threshold: 1.5, value: 2.1, met: true, margin: 0.6 }, { rule: "daily_loss_budget_used_pct", threshold: 50, value: 38, met: true, margin: 12 }],
    sizing: { status: "SIZED", reasonCode: null, quantity: 150, maxLossPercent: 0.5, riskReward: 2.1, trustTier: "UNKNOWN" }, sourceHealth: { overall: "OK", notUsable: [] },
    statements: ["Both required checks supported the idea.", "Approval is a separate human step in the bot."], grantsApproval: false },
};
const approvals = () => ({ approvals: [] as unknown[] });
const claim = (id: string, ch: string, minAgo: number, o: Record<string, unknown>) => ({ id, channel: ch, receivedAt: iso(minAgo), ageSeconds: minAgo * 60, parserVersion: "telegram-regex-v3", resultKind: "claim", assessmentOutcome: "INSUFFICIENT_EVIDENCE", blockers: [{ code: "contract.master_unconfigured", severity: "insufficient" }, { code: "option_premium_data.unavailable", severity: "insufficient" }], ...o });
const cl = (u: string, strike: number, t: string, action: string | null, entryPrice: number | null, stop: number | null, targets: number[], basis: string | null, inferred: boolean, exp: Record<string, unknown>) => ({ action, underlying: u, strike, optionType: t, entry: { type: entryPrice === null ? "unspecified" : "above", price: entryPrice, low: null, high: null }, stopLoss: stop, targets, levelBasis: basis, levelBasisInferred: inferred, levelBasisConflict: false, expiry: exp });
const claims = () => ({ claims: [
  claim("00000000-0000-4000-8000-000000000051", "***2544", 6, { claim: cl("NIFTY", 24500, "CE", "buy", 118, 96, [140, 165], null, false, { status: "day_month", day: 12, month: 11, year: null }), blockers: [{ code: "stop_loss.basis_unspecified", severity: "blocking" }, { code: "option_premium_data.unavailable", severity: "insufficient" }] }),
  claim("bbbbbbbb", "***2544", 33, { claim: cl("BANKNIFTY", 52000, "PE", "buy", 210, 172, [250, 290, 340], "premium", true, { status: "day_month", day: 11, month: 11, year: null }) }),
  claim("cccccccc", "***7781", 50, { claim: cl("SENSEX", 81000, "CE", "buy", 305, 255, [350, 400], null, false, { status: "missing", day: null, month: null, year: null }), blockers: [{ code: "expiry.year_missing", severity: "insufficient" }, { code: "stop_loss.basis_unspecified", severity: "blocking" }] }),
  claim("dddddddd", "***7781", 77, { claim: cl("NIFTY", 24300, "PE", "buy", 96, null, [120, 140], null, false, { status: "day_month", day: 12, month: 11, year: null }), assessmentOutcome: "REJECT", blockers: [{ code: "stop_loss.missing", severity: "blocking" }] }),
  claim("eeeeeeee", "***9103", 113, { claim: cl("FINNIFTY", 23400, "CE", "buy", 74, 58, [92, 110], null, false, { status: "day_month", day: 11, month: 11, year: null }), resultKind: "unsupported", blockers: [{ code: "instrument.unsupported", severity: "insufficient" }] }),
  claim("ffffffff", "***2544", 2900, { parserVersion: "telegram-regex-v2", claim: cl("SENSEX", 81500, "CE", null, null, null, [], null, false, { status: "missing", day: null, month: null, year: null }), assessmentOutcome: null, blockers: [{ code: "action.missing", severity: "blocking" }] }),
] });
const channels = () => ({ channels: [
  { id: "bbbbbbbb", channel: "***2544", name: "Channel A", messages: 109, revisions: 2, claims: { claim: 100, ambiguous: 0, unsupported: 3 }, firstMessageAt: iso(20000), lastMessageAt: iso(6), lastMessageAgeSeconds: 360, captureAllowed: true },
  { id: "cccccccc", channel: "***7781", name: "Channel B", messages: 41, revisions: 0, claims: { claim: 33, ambiguous: 1, unsupported: 2 }, firstMessageAt: iso(12000), lastMessageAt: iso(50), lastMessageAgeSeconds: 3000, captureAllowed: true },
  { id: "dddddddd", channel: "***9103", name: null, messages: 12, revisions: 0, claims: { claim: 7, ambiguous: 0, unsupported: 5 }, firstMessageAt: iso(9000), lastMessageAt: iso(113), lastMessageAgeSeconds: 6780, captureAllowed: null },
] });
const pos = (id: string, symbol: string, o: Record<string, unknown>) => ({ tradeId: id, riskDecisionId: ID.f2, symbol, side: "BUY", state: "OPEN", quantity: 150, remainingQuantity: 150, entryPrice: 205, fillPrice: 205, stop: 170, targets: [245, 285], targetsHit: 0, trailingActive: false, lastPrice: 214, realizedPnl: 0, unrealizedPnl: 1350, totalPnl: 1350, rMultiple: 0.26, openedAt: iso(80), ...o });
const positions = () => ({ positions: [
  pos("t1", "BANKNIFTY 51500 CE", {}), pos("t2", "NIFTY 24400 PE", { quantity: 225, remainingQuantity: 225, entryPrice: 88, fillPrice: 88, stop: 70, targets: [110], lastPrice: 81, unrealizedPnl: -1575, totalPnl: -1575, rMultiple: -0.39 }),
  pos("t3", "NIFTY 24600 CE", { state: "PENDING_ENTRY", quantity: 225, remainingQuantity: 225, entryPrice: 104, fillPrice: null, lastPrice: null, unrealizedPnl: 0, totalPnl: 0, rMultiple: null, openedAt: null }),
  pos("t4", "BANKNIFTY 51000 PE", { state: "CLOSED", remainingQuantity: 0, lastPrice: 190, realizedPnl: 2200, unrealizedPnl: 0, totalPnl: 2200, rMultiple: 1.1, targetsHit: 2 }),
] });
const out = (i: number, o: string, pnl: number, r: number, reason: string, sym: string) => ({ tradeId: `o${i}`, riskDecisionId: ID.f2, symbol: sym, side: "BUY", outcome: o, pnl, rMultiple: r, closeReason: reason, targetsHit: o === "WIN" ? 2 : 0, holdingSeconds: 3600 + i * 400, mfeR: 1.2, maeR: -0.4, closedAt: iso(i * 1440 + 30) });
const outcomes = () => ({ outcomes: [out(1, "WIN", 2200, 1.1, "TARGET", "BANKNIFTY 51000 PE"), out(2, "LOSS", -1400, -0.7, "STOP", "NIFTY 24400 PE"), out(3, "WIN", 1800, 0.9, "TARGET", "NIFTY 24500 CE"), out(4, "WIN", 2600, 1.3, "TARGET", "BANKNIFTY 51500 CE"), out(5, "LOSS", -1200, -0.6, "STOP", "SENSEX 80500 CE"), out(6, "BREAKEVEN", 0, 0, "SQUARE_OFF", "NIFTY 24300 PE")] });
const grp = (n: number, w: number, l: number, totalR: number, totalPnl: number) => ({ n, wins: w, losses: l, breakeven: n - w - l, winRate: n ? w / n : null, avgR: n ? totalR / n : null, totalR, totalPnl });
const stats = () => ({ ...grp(6, 3, 2, 1.0, 4000), avgWinR: 1.1, avgLossR: -0.65, expectancyR: 0.17, profitFactor: 2.0, maxDrawdownR: 1.4, avgHoldingSeconds: 5400, byCloseReason: { TARGET: grp(3, 3, 0, 3.3, 6600), STOP: grp(2, 0, 2, -1.3, -2600), SQUARE_OFF: grp(1, 0, 0, 0, 0) }, bySourceTrustTier: { UNKNOWN: grp(6, 3, 2, 1.0, 4000) }, byResearchAssessment: {}, minSampleForMeaning: 30, sampleIsMeaningful: false });
const snapshot = () => ({ visible: true, generation: { status: "complete", id: "gen-0042" }, files: [{ kind: "market-quotes", present: true, bytes: 18200, asOf: iso(3), ageSeconds: 180 }], indices: [
  { market: "NSE", symbol: "NIFTY", level: 24512.4, previousClose: 24460.1, changePct1d: 0.21, asOf: iso(3), ageSeconds: 180 }, { market: "NSE", symbol: "BANKNIFTY", level: 52180.9, previousClose: 52390.5, changePct1d: -0.4, asOf: iso(3), ageSeconds: 180 }, { market: "BSE", symbol: "SENSEX", level: 80644.2, previousClose: 80500.0, changePct1d: 0.18, asOf: iso(3), ageSeconds: 180 }],
  quoteCount: 3, optionQuoteCount: 0, providers: [{ name: "market-quotes", present: true, format: "json", source: "fixture", asOf: iso(3), ageSeconds: 180, count: 3 }] });
const prov = (provider: string, status: string, o: Record<string, unknown> = {}) => ({ provider, status, reasons: [], asOf: iso(3), dataAgeSeconds: 180, exportAgeSeconds: 120, count: 3, source: "fixture", consecutiveFailures: 0, usable: status === "OK", ...o });
const sources = () => ({ generatedAt: iso(1), overall: "DEGRADED", passLogAvailable: true, counts: { OK: 2, DEGRADED: 0, STALE: 1, FAILING: 0, MISSING: 1, INVALID: 0 }, providers: [prov("market-quotes", "OK"), prov("holiday-calendar", "OK", { count: 40 }), prov("news", "STALE", { reasons: ["no export for 3 h"], dataAgeSeconds: 11500, usable: false }), prov("economic-calendar", "MISSING", { reasons: ["no export yet"], asOf: null, dataAgeSeconds: null, count: null, usable: false })] });
const news = () => ({ status: "ok", reason: null, asOf: iso(40), ageSeconds: 2400, summary: { available: true, clusters: 3, mixed: 1, negative: 1, recommendation: "CAUTION", line: "3 clusters, 1 mixed, CAUTION" }, items: [], clusters: [
  { clusterId: "c1", symbol: "NIFTY", theme: "rates", bucketStart: iso(120), items: 4, channels: 2, polarity: -0.4, mixed: false }, { clusterId: "c2", symbol: "BANKNIFTY", theme: "earnings", bucketStart: iso(90), items: 3, channels: 2, polarity: 0.1, mixed: true }, { clusterId: "c3", symbol: null, theme: "geopolitics", bucketStart: iso(60), items: 2, channels: 1, polarity: -0.2, mixed: false }] });
const sysConfig = () => ({ source: "fixture", environment: { appEnv: "staging", tradingMode: "paper", liveTradingGuardPasses: true, liveTradingEnabled: false, brokerOrders: false }, runtimeControls: { tradingEnabled: false, intakeEnabled: true, killSwitchActive: false },
  agentEngine: { valid: true, enabled: false, shadow: true, requiredAgents: ["technical", "risk-context"], disabledAgents: [], haltOn: ["BLOCKING"], maxConcurrency: 4 },
  paperTrading: { armedByHost: false, switch: null, effective: false, config: { slippageBps: 5, entryExpiryMinutes: 15, trail: { kind: "r", value: 1 }, trailAfterTargets: 1, breakevenAfterTarget1: true, exitFractions: [0.5, 0.3, 0.2], squareOffIstMinutes: 925, maxPriceAgeSeconds: 30 } },
  risk: { sizing: { valid: true }, portfolio: { valid: true }, circuitBreakers: { valid: true }, expiry: { valid: true } } });
const health = () => ({ status: "ok", uptimeSeconds: 86400, database: { ok: true, latencyMs: 4 }, redis: { ok: true, latencyMs: 2 }, runtimeState: { available: true, TRADING_ENABLED: false, INTAKE_ENABLED: true, KILL_SWITCH_ACTIVE: false } });
const paperStatus = () => ({ mode: "paper", enabled: false, armedByHost: false, switch: null, liveTradingEnabled: false, brokerOrders: false, summary: { openPositions: 2, pendingEntries: 1, closedTrades: 6, cancelledTrades: 0, exposure: 38200, realizedPnl: 4000, unrealizedPnl: -225, totalPnl: 3775 } });
const paperSummary = () => ({ openPositions: 2, pendingEntries: 1, closedTrades: 6, cancelledTrades: 0, exposure: 38200, realizedPnl: 4000, unrealizedPnl: -225, totalPnl: 3775 });
const readiness = () => ({ readyToEnable: false, enabledNow: false, blockers: ["market data not verified"], items: [{ id: "market-data", title: "Market data verified", status: "fail", blocking: true, detail: "No verified quote feed yet." }, { id: "kill-switch", title: "Kill switch off", status: "pass", blocking: false, detail: "Off." }] });

const EMPTY: Record<string, unknown> = {
  "risk/decisions": { decisions: [] }, "risk/approvals": approvals(), "telegram/channels": { channels: [] }, "telegram/claims": { claims: [] }, "paper/positions": { positions: [] }, "paper/outcomes": { outcomes: [] },
  "paper/summary": { openPositions: 0, pendingEntries: 0, closedTrades: 0, cancelledTrades: 0, exposure: 0, realizedPnl: 0, unrealizedPnl: 0, totalPnl: 0 },
  "paper/outcomes/stats": { ...grp(0, 0, 0, 0, 0), avgWinR: null, avgLossR: null, expectancyR: null, profitFactor: null, maxDrawdownR: 0, avgHoldingSeconds: null, byCloseReason: {}, bySourceTrustTier: {}, byResearchAssessment: {}, minSampleForMeaning: 30, sampleIsMeaningful: false },
  "market/snapshot": { visible: false, generation: null, files: [], indices: [], quoteCount: 0, optionQuoteCount: 0, providers: [] },
  "news/telegram": { status: "ok", reason: null, asOf: iso(30), ageSeconds: 1800, summary: { available: true, clusters: 0, mixed: 0, negative: 0, recommendation: "NONE", line: "No channel commentary" }, items: [], clusters: [] },
};
const LIVE: Record<string, () => unknown> = { "risk/decisions": () => ({ decisions: decisions() }), "risk/approvals": approvals, "telegram/channels": channels, "telegram/claims": claims, "paper/positions": positions, "paper/outcomes": outcomes, "paper/outcomes/stats": stats, "paper/summary": paperSummary, "paper/status": paperStatus, "paper/readiness": readiness, "market/snapshot": snapshot, "market/sources": sources, "news/telegram": news, "system/config": sysConfig, "health/status": health };

/** `undefined` means "this route does not exist / has no row" (the reader treats it as absent, like a 404). */
export function routeFixture(path: string, mode: "populated" | "empty"): unknown {
  const p = path.split("?")[0] ?? path;
  const card = /^risk\/decisions\/([0-9a-f-]{36})\/(decision-card|summary)$/i.exec(p);
  if (card) {
    const id = card[1] as string;
    if (mode === "empty") return undefined;
    return card[2] === "decision-card" ? cards[id] : decisions().find((d) => d.id === id);
  }
  if (mode === "empty" && p in EMPTY) return EMPTY[p];
  return LIVE[p]?.();
}
