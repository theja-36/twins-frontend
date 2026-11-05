import type { ApprovalSummary, DecisionSummary, Loaded, OutcomeStats, PaperStatus, PnlSummary, PositionView, TradeOutcome, GroupStats } from "@/types/trading";

/**
 * Data layer for the trading views. The server tells us whether it is wired to a backend (`/api/twins/mode`); if so every call reads the backend through the server-side proxy
 * (`/api/twins/*`, GET only; the API token never reaches the browser). If the backend is not configured or unreachable, a call falls back to clearly labelled mock data and says why.
 * Nothing here can create, approve or cancel anything: the proxy forwards GET only.
 */
let modePromise: Promise<boolean> | null = null;
export function isLive(): Promise<boolean> {
  if (!modePromise) modePromise = fetch("/api/twins/mode", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { configured: false })).then((j) => Boolean(j.configured)).catch(() => false);
  return modePromise;
}
export const recheckMode = (): void => { modePromise = null; };

async function live<T>(path: string): Promise<T> {
  const res = await fetch(`/api/twins/${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status}`);
  return (await res.json()) as T;
}
export async function load<T>(path: string, mock: () => T, pick: (raw: any) => T = (r) => r): Promise<Loaded<T>> {
  if (!(await isLive())) return { data: mock(), source: "mock", note: "No backend configured on this server: showing sample data." };
  try { return { data: pick(await live<unknown>(path)), source: "live" }; }
  catch (e) {
    const code = e instanceof Error ? e.message : "";
    return { data: mock(), source: "mock-fallback", note: code === "503" ? "Backend not configured on this server" : code === "401" ? "The server's API token was rejected" : code === "502" ? "Backend unreachable from this server" : "Backend returned an unexpected answer" };
  }
}

// ─── deterministic mock data (stable across renders) ─────────────────────────────────────────────────────────────────────────────────────
const iso = (minAgo: number): string => new Date(Date.now() - minAgo * 60_000).toISOString();
const MOCK_POSITIONS: PositionView[] = [
  { tradeId: "p1", riskDecisionId: "d1", symbol: "NIFTY", side: "BUY", state: "OPEN", quantity: 150, remainingQuantity: 75, entryPrice: 24380, fillPrice: 24378.5, stop: 24378.5, targets: [24440, 24500, 24580], targetsHit: 1, trailingActive: true, lastPrice: 24471.2, realizedPnl: 4612.5, unrealizedPnl: 6952.5, totalPnl: 11565, rMultiple: 1.54, openedAt: iso(96) },
  { tradeId: "p2", riskDecisionId: "d2", symbol: "BANKNIFTY", side: "SELL", state: "OPEN", quantity: 60, remainingQuantity: 60, entryPrice: 57320, fillPrice: 57318.6, stop: 57460, targets: [57150, 57000], targetsHit: 0, trailingActive: false, lastPrice: 57264, realizedPnl: 0, unrealizedPnl: 3276, totalPnl: 3276, rMultiple: 0.39, openedAt: iso(41) },
  { tradeId: "p3", riskDecisionId: "d3", symbol: "RELIANCE", side: "BUY", state: "OPEN", quantity: 400, remainingQuantity: 400, entryPrice: 2984, fillPrice: 2983.4, stop: 2958, targets: [3015, 3040], targetsHit: 0, trailingActive: false, lastPrice: 2977.1, realizedPnl: 0, unrealizedPnl: -2520, totalPnl: -2520, rMultiple: -0.24, openedAt: iso(18) },
  { tradeId: "p4", riskDecisionId: "d4", symbol: "HDFCBANK", side: "BUY", state: "PENDING_ENTRY", quantity: 300, remainingQuantity: 300, entryPrice: 1664, fillPrice: null, stop: 1648, targets: [1684, 1700, 1716], targetsHit: 0, trailingActive: false, lastPrice: 1669.4, realizedPnl: 0, unrealizedPnl: 0, totalPnl: 0, rMultiple: null, openedAt: null },
  { tradeId: "p5", riskDecisionId: "d5", symbol: "TCS", side: "BUY", state: "CLOSED", quantity: 200, remainingQuantity: 0, entryPrice: 4170, fillPrice: 4171.1, stop: 4150, targets: [4195], targetsHit: 1, trailingActive: false, lastPrice: 4195, realizedPnl: 4780, unrealizedPnl: 0, totalPnl: 4780, rMultiple: 1.19, openedAt: iso(300) },
  { tradeId: "p6", riskDecisionId: "d6", symbol: "INFY", side: "SELL", state: "CLOSED", quantity: 250, remainingQuantity: 0, entryPrice: 1840, fillPrice: 1839.2, stop: 1852, targets: [1822], targetsHit: 0, trailingActive: false, lastPrice: 1852, realizedPnl: -3300, unrealizedPnl: 0, totalPnl: -3300, rMultiple: -1.1, openedAt: iso(420) },
];
const R_SERIES = [1.5, -1, 0.4, 2.1, -1, -1, 1.2, 0.0, 3.5, -1, 0.8, -1, 1.9, 0.6, -1, -1, 2.6, 1.1, -1, 0.3, 1.4, -1, 0.9, 2.2];
const REASONS = ["TARGET", "STOP_LOSS", "SQUARE_OFF", "TARGET", "STOP_LOSS", "STOP_LOSS", "TRAILING_STOP", "BREAKEVEN_STOP", "TARGET", "STOP_LOSS", "TARGET", "STOP_LOSS", "TARGET", "SQUARE_OFF", "STOP_LOSS", "STOP_LOSS", "TARGET", "TRAILING_STOP", "STOP_LOSS", "SQUARE_OFF", "TARGET", "STOP_LOSS", "TARGET", "TARGET"];
const SYMS = ["NIFTY", "BANKNIFTY", "RELIANCE", "HDFCBANK", "TCS", "INFY"];
const MOCK_OUTCOMES: TradeOutcome[] = R_SERIES.map((r, i) => ({
  tradeId: `o${i}`, riskDecisionId: `od${i}`, symbol: SYMS[i % SYMS.length]!, side: i % 3 === 0 ? "SELL" : "BUY", outcome: r > 0.05 ? "WIN" : r < -0.05 ? "LOSS" : "BREAKEVEN", pnl: Math.round(r * 2400), rMultiple: r,
  closeReason: REASONS[i]!, targetsHit: r > 1.5 ? 2 : r > 0.3 ? 1 : 0, holdingSeconds: 600 + ((i * 937) % 7200), mfeR: Math.max(0, r) + 0.4, maeR: r < 0 ? 1 : 0.3, closedAt: iso((R_SERIES.length - i) * 55),
}));
function groups(os: TradeOutcome[], key: (o: TradeOutcome) => string): Record<string, GroupStats> {
  const m = new Map<string, TradeOutcome[]>();
  for (const o of os) { const k = key(o); (m.get(k) ?? m.set(k, []).get(k)!).push(o); }
  return Object.fromEntries([...m.entries()].map(([k, v]) => [k, group(v)]));
}
function group(os: TradeOutcome[]): GroupStats {
  const w = os.filter((o) => o.outcome === "WIN").length, l = os.filter((o) => o.outcome === "LOSS").length, tr = os.reduce((a, o) => a + o.rMultiple, 0);
  return { n: os.length, wins: w, losses: l, breakeven: os.length - w - l, winRate: os.length ? +(w / os.length).toFixed(2) : null, avgR: os.length ? +(tr / os.length).toFixed(2) : null, totalR: +tr.toFixed(2), totalPnl: os.reduce((a, o) => a + o.pnl, 0) };
}
function mockStats(): OutcomeStats {
  const os = MOCK_OUTCOMES, g = group(os), wins = os.filter((o) => o.outcome === "WIN"), losses = os.filter((o) => o.outcome === "LOSS");
  const gw = wins.reduce((a, o) => a + o.rMultiple, 0), gl = Math.abs(losses.reduce((a, o) => a + o.rMultiple, 0));
  let peak = 0, cum = 0, dd = 0; for (const o of os) { cum += o.rMultiple; peak = Math.max(peak, cum); dd = Math.max(dd, peak - cum); }
  return { ...g, avgWinR: +(gw / wins.length).toFixed(2), avgLossR: +(-gl / losses.length).toFixed(2), expectancyR: +(g.totalR / g.n).toFixed(2), profitFactor: +(gw / gl).toFixed(2), maxDrawdownR: +dd.toFixed(2), avgHoldingSeconds: 3100,
    byCloseReason: groups(os, (o) => o.closeReason), bySourceTrustTier: { TIER_1: group(os.filter((_, i) => i % 2 === 0)), TIER_2: group(os.filter((_, i) => i % 2 === 1)) }, byResearchAssessment: { RESEARCH_SUPPORTIVE: group(os.filter((_, i) => i % 3 !== 0)), RESEARCH_NEUTRAL: group(os.filter((_, i) => i % 3 === 0)) }, minSampleForMeaning: 30, sampleIsMeaningful: false };
}
const MOCK_SUMMARY = (): PnlSummary => {
  const open = MOCK_POSITIONS.filter((p) => p.state === "OPEN");
  const realized = MOCK_POSITIONS.reduce((a, p) => a + p.realizedPnl, 0), unreal = open.reduce((a, p) => a + p.unrealizedPnl, 0);
  return { openPositions: open.length, pendingEntries: 1, closedTrades: 2, cancelledTrades: 0, exposure: open.reduce((a, p) => a + (p.lastPrice ?? 0) * p.remainingQuantity, 0), realizedPnl: realized, unrealizedPnl: unreal, totalPnl: realized + unreal };
};
const MOCK_DECISIONS: DecisionSummary[] = [
  { id: "d1", version: 3, status: "APPROVED_FOR_REVIEW", effectiveStatus: "APPROVED_FOR_REVIEW", subjectKind: "signal", market: "NSE", instrumentType: "index", symbol: "NIFTY", expiry: null, strike: null, optionType: null, side: "BUY", entryPrice: "24380", stopLoss: "24320", targets: ["24440", "24500", "24580"], plannedQuantity: "150", plannedNotional: "3657000", plannedMaxLossAmount: "9000", riskReward: "2.3", confidenceScore: "0.78", sourceTrustTier: "TIER_1", reasonCode: "PASSED_ALL_GATES", createdAt: iso(120) },
  { id: "d4", version: 2, status: "APPROVED_FOR_REVIEW", effectiveStatus: "APPROVED_FOR_REVIEW", subjectKind: "signal", market: "NSE", instrumentType: "equity", symbol: "HDFCBANK", expiry: null, strike: null, optionType: null, side: "BUY", entryPrice: "1664", stopLoss: "1648", targets: ["1684", "1700", "1716"], plannedQuantity: "300", plannedNotional: "499200", plannedMaxLossAmount: "4800", riskReward: "2.1", confidenceScore: "0.71", sourceTrustTier: "TIER_2", reasonCode: "PASSED_ALL_GATES", createdAt: iso(34) },
  { id: "d7", version: 2, status: "PENDING", effectiveStatus: "PENDING", subjectKind: "signal", market: "NSE", instrumentType: "equity", symbol: "SBIN", expiry: null, strike: null, optionType: null, side: "SELL", entryPrice: "812", stopLoss: "820", targets: ["800"], plannedQuantity: null, plannedNotional: null, plannedMaxLossAmount: null, riskReward: null, confidenceScore: "0.55", sourceTrustTier: "TIER_3", reasonCode: "RESEARCH_BLOCKED", createdAt: iso(12) },
  { id: "d8", version: 1, status: "REJECTED", effectiveStatus: "REJECTED", subjectKind: "options_claim", market: "NFO", instrumentType: "option", symbol: "NIFTY", expiry: "2026-11-12", strike: "24500", optionType: "CE", side: "BUY", entryPrice: "142", stopLoss: "110", targets: ["190"], plannedQuantity: "75", plannedNotional: "10650", plannedMaxLossAmount: "2400", riskReward: "1.5", confidenceScore: "0.49", sourceTrustTier: "TIER_3", reasonCode: "MARKET_RISK_GATE", createdAt: iso(260) },
];
const MOCK_APPROVALS: ApprovalSummary[] = [{ id: "a1", riskDecisionId: "d1", decisionVersion: 3, action: "APPROVE", actorType: "operator", actorRef: "***hana", reason: null, createdAt: iso(100) }];
const MOCK_STATUS = (): PaperStatus => ({ mode: "paper", enabled: false, liveTradingEnabled: false, brokerOrders: false, slippageBps: 5, entryExpiryMinutes: 30, trail: { kind: "percent", value: 0.5 }, breakevenAfterTarget1: true, exitFractions: [0.5, 0.25, 0.25], squareOffIstMinutes: 920, summary: MOCK_SUMMARY() });

// ─── fetchers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const getDecisions = (status?: string) => load<DecisionSummary[]>(`risk/decisions?limit=100${status ? `&status=${status}` : ""}`, () => (status ? MOCK_DECISIONS.filter((d) => d.status === status) : MOCK_DECISIONS), (r) => r.decisions);
export const getApprovals = () => load<ApprovalSummary[]>("risk/approvals?limit=100", () => MOCK_APPROVALS, (r) => r.approvals);
export const getPaperStatus = () => load<PaperStatus>("paper/status", MOCK_STATUS);
export const getPaperSummary = () => load<PnlSummary>("paper/summary", MOCK_SUMMARY);
export const getPositions = () => load<PositionView[]>("paper/positions?limit=200", () => MOCK_POSITIONS, (r) => r.positions);
export const getOutcomes = () => load<TradeOutcome[]>("paper/outcomes?limit=500", () => MOCK_OUTCOMES, (r) => r.outcomes);
export const getOutcomeStats = () => load<OutcomeStats>("paper/outcomes/stats", mockStats);

// ─── formatting helpers ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const inr = (n: number | null | undefined, digits = 0): string => (n === null || n === undefined || Number.isNaN(n) ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n));
export const px = (n: number | string | null | undefined): string => { if (n === null || n === undefined || n === "") return "—"; const v = Number(n); return Number.isFinite(v) ? new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) : "—"; };
export const signed = (n: number | null | undefined, digits = 2): string => (n === null || n === undefined ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(digits)}`);
export const pct = (n: number | null | undefined): string => (n === null || n === undefined ? "—" : `${Math.round(n * 100)}%`);
export function ago(isoStr: string | null): string {
  if (!isoStr) return "—";
  const s = Math.max(0, Math.round((Date.now() - Date.parse(isoStr)) / 1000));
  if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`;
}
export function duration(sec: number | null): string { if (sec === null) return "—"; const m = Math.round(sec / 60); return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; }
