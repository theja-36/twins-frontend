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
  analysis: { assessment: string; decidedBy: string; agents: Array<{ id: string; verdict: "supportive" | "neutral" | "caution" | "adverse" | "unavailable"; note: string }>; closeCalls: string[] };
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

export const SIGNALS: StudioSignal[] = [
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

export const OVERVIEW = {
  asOf: "Mon 09 Nov 2026 · 09:48 IST",
  safety: [["Engine", "off"], ["Shadow", "on"], ["Live trading", "off"], ["Paper", "off"]] as const,
  counts: { today: 14, ready: 1, blocked: 9, channels: 3 },
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
