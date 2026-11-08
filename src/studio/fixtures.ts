/**
 * TEST FIXTURES for the Signal Studio visual prototype. INVENTED values, shaped like the real API
 * (risk decisions, decision card, telegram channels). Only code under src/app/studio and src/studio may import this file
 * (enforced by tests/studio.test.ts). It is never a fallback for production data.
 */
export type Tone = "ok" | "warn" | "bad" | "info" | "mute";
export type StopQuality = "VALID" | "BASIS_UNSPECIFIED" | "MISSING" | "INVALID";
export interface Blocker { code: string; text: string; severity: "blocking" | "insufficient" | "info" }
export interface StudioSignal {
  id: string; origin: "telegram"; channel: string; receivedAt: string; ageMin: number;
  underlying: string; strike: number; optionType: "CE" | "PE"; expiry: string | null; side: "BUY" | "SELL";
  entry: { kind: "above" | "at"; price: number }; stop: number | null; targets: number[];
  stopQuality: StopQuality; stopNote: string; status: "APPROVED_FOR_REVIEW" | "INSUFFICIENT_EVIDENCE" | "REJECTED" | "EXPIRED";
  rationale: string; blockers: Blocker[]; freshness: { state: "fresh" | "stale" | "unavailable"; note: string };
  analysis: { assessment: string; decidedBy: string; agents: Array<{ id: string; verdict: "supportive" | "neutral" | "caution" | "adverse" | "unavailable"; note: string; weight: number; confidence: number | null; codes: string[] }>; closeCalls: string[] };
  decisionId: string; market: "NSE" | "BSE"; basisInferred: boolean; approval: string;
  sizing: { sized: boolean; qty?: number; maxLoss?: number; rr?: number; reason?: string; trustTier: "UNKNOWN" };
  sourceHealth: Array<{ name: string; status: "OK" | "STALE" | "MISSING" }>;
}

const B = {
  master: { code: "contract.master_unconfigured", text: "Contract master not loaded yet", severity: "insufficient" as const },
  premium: { code: "option_premium_data.unavailable", text: "No option premium data", severity: "insufficient" as const },
  basis: { code: "stop_loss.basis_unspecified", text: "Stop basis not stated in the message", severity: "blocking" as const },
  year: { code: "expiry.year_missing", text: "Expiry year not given", severity: "insufficient" as const },
  expired: { code: "decision.expired", text: "Validity window passed", severity: "blocking" as const },
};
const AG = (verdict: "supportive" | "neutral" | "caution" | "adverse" | "unavailable", note: string) => ({ verdict, note });
const agents = (a: ReturnType<typeof AG>, b: ReturnType<typeof AG>, c: ReturnType<typeof AG>) => [
  { id: "technical", ...a }, { id: "news", ...b }, { id: "risk-context", ...c },
];

const BASE: Array<Omit<StudioSignal, "decisionId" | "market" | "basisInferred" | "approval" | "sizing" | "sourceHealth" | "analysis"> & { analysis: { assessment: string; decidedBy: string; agents: Array<{ id: string; verdict: "supportive" | "neutral" | "caution" | "adverse" | "unavailable"; note: string }>; closeCalls: string[] } }> = [
  { id: "f1", origin: "telegram", channel: "***2544", receivedAt: "09:42", ageMin: 6, underlying: "NIFTY", strike: 24500, optionType: "CE", expiry: "12 Nov", side: "BUY",
    entry: { kind: "above", price: 118 }, stop: 96, targets: [140, 165], stopQuality: "BASIS_UNSPECIFIED", stopNote: "Stop 96 is below 10% of the strike, so it is probably a premium level, but the message does not say so.",
    status: "INSUFFICIENT_EVIDENCE", rationale: "A clean long entry with a stop and two targets. It cannot be sized until the stop basis and live option prices are known.",
    blockers: [B.basis, B.premium, B.master], freshness: { state: "unavailable", note: "No option quotes yet. Parsed 6 min ago." },
    analysis: { assessment: "Research: caution", decidedBy: "rule engine (shadow)", agents: agents(AG("neutral", "Index above its 20-day mean"), AG("neutral", "No channel commentary"), AG("caution", "Premium data unavailable")), closeCalls: ["Stop basis: not stated", "Contract: not in master"] } },
  { id: "f2", origin: "telegram", channel: "***2544", receivedAt: "09:15", ageMin: 33, underlying: "BANKNIFTY", strike: 52000, optionType: "PE", expiry: "11 Nov", side: "BUY",
    entry: { kind: "at", price: 210 }, stop: 172, targets: [250, 290, 340], stopQuality: "VALID", stopNote: "Message states the stop is on the premium.",
    status: "APPROVED_FOR_REVIEW", rationale: "Passed sizing, portfolio and market gates. Waiting for a human decision in the Telegram approval bot.",
    blockers: [], freshness: { state: "fresh", note: "Quotes 4 s old at the decision." },
    analysis: { assessment: "Research: supportive", decidedBy: "rule engine", agents: agents(AG("supportive", "Trend and momentum agree"), AG("neutral", "No channel commentary"), AG("supportive", "Inside daily loss budget")), closeCalls: ["Reward to risk 1 : 2.1", "Margin above threshold"] } },
  { id: "f3", origin: "telegram", channel: "***7781", receivedAt: "08:58", ageMin: 50, underlying: "SENSEX", strike: 81000, optionType: "CE", expiry: null, side: "BUY",
    entry: { kind: "above", price: 305 }, stop: 255, targets: [350, 400], stopQuality: "BASIS_UNSPECIFIED", stopNote: "Stop stated without a basis.",
    status: "INSUFFICIENT_EVIDENCE", rationale: "The message names no expiry, so the contract cannot be identified. It stays ambiguous until the Kite catalog can resolve it.",
    blockers: [B.year, B.basis, B.master], freshness: { state: "unavailable", note: "Cannot fetch a quote without a contract." },
    analysis: { assessment: "Research: caution", decidedBy: "rule engine (shadow)", agents: agents(AG("unavailable", "No contract to evaluate"), AG("neutral", "No channel commentary"), AG("caution", "Contract unresolved")), closeCalls: ["Expiry: not given"] } },
  { id: "f4", origin: "telegram", channel: "***7781", receivedAt: "08:31", ageMin: 77, underlying: "NIFTY", strike: 24300, optionType: "PE", expiry: "12 Nov", side: "BUY",
    entry: { kind: "above", price: 96 }, stop: null, targets: [120, 140], stopQuality: "MISSING", stopNote: "No stop given. A stop is mandatory, so this cannot move forward.",
    status: "REJECTED", rationale: "Rejected by the mandatory stop-loss rule. Nothing the system can fix: the source must state a stop.",
    blockers: [{ code: "stop_loss.missing", text: "No stop-loss in the message", severity: "blocking" }], freshness: { state: "stale", note: "Quotes 2 min old at the decision." },
    analysis: { assessment: "Not assessed", decidedBy: "stop-loss rule", agents: agents(AG("unavailable", "Not run"), AG("unavailable", "Not run"), AG("unavailable", "Not run")), closeCalls: ["Stop-loss: missing"] } },
  { id: "f5", origin: "telegram", channel: "***2544", receivedAt: "08:12", ageMin: 96, underlying: "BANKNIFTY", strike: 51800, optionType: "CE", expiry: "11 Nov", side: "BUY",
    entry: { kind: "above", price: 188 }, stop: 150, targets: [225, 260], stopQuality: "VALID", stopNote: "Stop on the premium, stated in the message.",
    status: "EXPIRED", rationale: "Was ready for review, but the 15-minute window passed before anyone decided.",
    blockers: [B.expired], freshness: { state: "stale", note: "Last quote 1 h 20 min old." },
    analysis: { assessment: "Research: neutral", decidedBy: "rule engine", agents: agents(AG("neutral", "Mixed signals"), AG("neutral", "No channel commentary"), AG("supportive", "Inside budget")), closeCalls: ["Window: 15 min, elapsed"] } },
  { id: "f6", origin: "telegram", channel: "***9103", receivedAt: "07:55", ageMin: 113, underlying: "FINNIFTY", strike: 23400, optionType: "CE", expiry: "11 Nov", side: "BUY",
    entry: { kind: "above", price: 74 }, stop: 58, targets: [92, 110], stopQuality: "BASIS_UNSPECIFIED", stopNote: "Stop stated without a basis.",
    status: "INSUFFICIENT_EVIDENCE", rationale: "FINNIFTY is outside the supported contract catalog today, so it stays unassessed.",
    blockers: [{ code: "instrument.unsupported", text: "Instrument not in supported catalog", severity: "insufficient" }, B.basis], freshness: { state: "unavailable", note: "No quote source for this index." },
    analysis: { assessment: "Not assessed", decidedBy: "catalog check", agents: agents(AG("unavailable", "Not run"), AG("unavailable", "Not run"), AG("unavailable", "Not run")), closeCalls: ["Catalog: unsupported index"] } },
];

const SH = (q: "OK" | "STALE" | "MISSING", i: "OK" | "STALE" | "MISSING" = "OK") => [{ name: "Option quotes", status: q }, { name: "Index prices", status: i }];
const EXTRA: Record<string, Pick<StudioSignal, "decisionId" | "market" | "basisInferred" | "approval" | "sizing" | "sourceHealth">> = {
  f1: { decisionId: "3f1c9a2e-7b44-4d0a-9c1e-5a8d2b6e1f01", market: "NSE", basisInferred: false, approval: "Not eligible yet", sizing: { sized: false, reason: "Stop basis not stated", trustTier: "UNKNOWN" }, sourceHealth: SH("MISSING") },
  f2: { decisionId: "8be2d410-65aa-4c27-8f3d-0c9a71e4b202", market: "NSE", basisInferred: true, approval: "Waiting for a decision in the bot", sizing: { sized: true, qty: 150, maxLoss: 5700, rr: 2.1, trustTier: "UNKNOWN" }, sourceHealth: SH("OK") },
  f3: { decisionId: "c07a55f3-19de-48b1-a6c4-7d2e90b3c303", market: "BSE", basisInferred: false, approval: "Not eligible yet", sizing: { sized: false, reason: "Contract not identified", trustTier: "UNKNOWN" }, sourceHealth: SH("MISSING") },
  f4: { decisionId: "d41b8e62-0f37-4a95-b2d8-3e6c1a7f4404", market: "NSE", basisInferred: false, approval: "Rejected by rule (no approval record)", sizing: { sized: false, reason: "No stop-loss", trustTier: "UNKNOWN" }, sourceHealth: SH("OK", "STALE") },
  f5: { decisionId: "e92c3a77-5b18-4d6f-8a01-9f4d2c8e5505", market: "NSE", basisInferred: false, approval: "Expired before a decision", sizing: { sized: true, qty: 150, maxLoss: 5700, rr: 1.9, trustTier: "UNKNOWN" }, sourceHealth: SH("STALE", "STALE") },
  f6: { decisionId: "fa5d4b88-2c69-4e30-9b12-1a7e3d9f6606", market: "NSE", basisInferred: false, approval: "Not eligible", sizing: { sized: false, reason: "Instrument not supported", trustTier: "UNKNOWN" }, sourceHealth: SH("MISSING", "MISSING") },
};
const W: Record<string, [number, number | null, string[]]> = { technical: [0.4, 62, ["trend.above_mean"]], news: [0.2, null, []], "risk-context": [0.4, 70, ["budget.inside"]] };
export const SIGNALS: StudioSignal[] = BASE.map((b) => {
  const e = EXTRA[b.id] as NonNullable<(typeof EXTRA)[string]>;
  const agents = b.analysis.agents.map((a) => { const w = W[a.id] ?? [0.3, null, []]; const scored = a.verdict !== "unavailable"; return { ...a, weight: w[0], confidence: scored ? (w[1] ?? 50) : null, codes: scored ? w[2] : [] }; });
  const out: StudioSignal = { ...b, ...e, analysis: { ...b.analysis, agents } };
  if (b.id === "f2") out.stopNote = "Premium basis applied from the channel's default. The message itself did not say so.";
  return out;
});

/** Same arithmetic as the production decision card: weight x confidence of scoring agents. */
export function agentShares(s: StudioSignal): { bull: number; neutral: number; bear: number } | null {
  const sc = s.analysis.agents.filter((a) => a.confidence !== null);
  const w = (a: (typeof sc)[number]): number => a.weight * ((a.confidence ?? 0) / 100);
  const tot = sc.reduce((n, a) => n + w(a), 0);
  if (tot === 0) return null;
  const part = (f: (v: string) => boolean): number => Math.round((sc.filter((a) => f(a.verdict)).reduce((n, a) => n + w(a), 0) / tot) * 100);
  return { bull: part((v) => v === "supportive"), neutral: part((v) => v === "neutral"), bear: part((v) => v === "caution" || v === "adverse") };
}

export const OVERVIEW = {
  asOf: "Mon 09 Nov 2026 · 09:48 IST",
  safety: [["Engine", "off"], ["Shadow", "on"], ["Live trading", "off"], ["Paper", "off"]] as const,
  counts: { today: 14, ready: 1, blocked: 9, channels: 3 },
  portfolio: { capital: null as number | null, paperPnl: 4180, dayPnl: -620, exposure: 38200, drawdownR: 1.4, closedTrades: 9 },
  positions: [
    { symbol: "BANKNIFTY 51500 CE", side: "BUY", qty: 150, entry: 205, last: 214, pnl: 1350, state: "OPEN" },
    { symbol: "NIFTY 24400 PE", side: "BUY", qty: 225, entry: 88, last: 81, pnl: -1575, state: "OPEN" },
    { symbol: "NIFTY 24600 CE", side: "BUY", qty: 225, entry: 104, last: null as number | null, pnl: 0, state: "PENDING_ENTRY" },
  ],
  regime: { label: "Trending, moderate volatility", note: "Sample until a regime route exists" },
  perDay: [["Tue", 8], ["Wed", 12], ["Thu", 9], ["Fri", 14], ["Sat", 0], ["Sun", 0], ["Mon", 6]] as const,
  channels: [
    { name: "***2544", messages: 109, last: "6 min ago", claims: 100, state: "live" },
    { name: "***7781", messages: 41, last: "50 min ago", claims: 33, state: "live" },
    { name: "***9103", messages: 12, last: "2 h ago", claims: 7, state: "quiet" },
  ],
  sources: [
    { name: "Option quotes", status: "MISSING", note: "Starts with the Kite feed" },
    { name: "Index prices", status: "OK", note: "Updated 3 min ago" },
    { name: "Channel news", status: "STALE", note: "Writer not started" },
    { name: "Economic calendar", status: "SAMPLE", note: "No backend route yet" },
  ],
  activity: [
    ["09:42", "Signal parsed from ***2544", "NIFTY 24500 CE"],
    ["09:42", "Held back: stop basis not stated", "NIFTY 24500 CE"],
    ["09:15", "Ready for review in the approval bot", "BANKNIFTY 52000 PE"],
    ["08:58", "Held back: expiry not given", "SENSEX 81000 CE"],
    ["08:31", "Rejected: no stop-loss", "NIFTY 24300 PE"],
  ] as const,
};

export const CHANNEL_STEPS = [
  { n: 1, title: "Make sure the capture account is a member", body: "The Telegram account used by TWINS capture must already be in the channel and able to read it." },
  { n: 2, title: "Add the chat id to the intake allow-list", body: "Done on the host, in the intake policy setting. The API reads it only at start." },
  { n: 3, title: "Restart intake, then check this page", body: "The channel appears here after its first captured message. Choose its stop-basis default separately." },
];
