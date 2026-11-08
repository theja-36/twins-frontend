import type { ApprovalSummary, DecisionCardData, DecisionSummary, SourceStatus, TelegramClaim } from "@/types/trading";

/** Pure view-model helpers for the Studio pages (unit tested). No data is invented here: every value comes from an API-shaped input. */
export type Tone = "ok" | "warn" | "bad" | "info" | "mute";

export const words = (c: string): string => c.replaceAll("_", " ").replaceAll(".", " ").toLowerCase();
export const decisionTitle = (d: DecisionSummary): string => (d.instrumentType === "option" ? `${d.symbol} ${d.strike ?? ""} ${d.optionType ?? ""}`.trim() : d.symbol);

export type StatusGroup = "ready" | "pending" | "rejected" | "expired";
export function statusGroup(s: string): StatusGroup { return s === "APPROVED_FOR_REVIEW" ? "ready" : s === "REJECTED" ? "rejected" : s === "EXPIRED" ? "expired" : "pending"; }
export const STATUS_LABEL: Record<StatusGroup, { label: string; tone: Tone }> = { ready: { label: "Approved for review", tone: "ok" }, pending: { label: "Pending", tone: "warn" }, rejected: { label: "Rejected", tone: "bad" }, expired: { label: "Expired", tone: "mute" } };
/** Superseded versions are history, not live decisions. */
export const liveDecisions = (rows: readonly DecisionSummary[]): DecisionSummary[] => rows.filter((d) => d.effectiveStatus !== "SUPERSEDED");

export type StopQ = { level: "valid" | "unspecified" | "missing" | "invalid"; label: string; tone: Tone };
/** Stop quality of a decision, from its stored reason code and stop level (the risk layer's own words). */
export function decisionStop(d: DecisionSummary): StopQ {
  const r = d.reasonCode.toUpperCase();
  if (r.includes("STOP_LOSS_BASIS_UNSPECIFIED")) return { level: "unspecified", label: "Stop: basis not stated", tone: "warn" };
  if (r.includes("STOP_LOSS_INVALID")) return { level: "invalid", label: "Stop: invalid", tone: "bad" };
  if (r.includes("STOP_LOSS_MISSING") || d.stopLoss === null) return { level: "missing", label: "Stop: missing", tone: "bad" };
  return { level: "valid", label: "Stop: present", tone: "ok" };
}

/** Human decision on a decision version, from the approvals ledger. Reading this never grants anything. */
export function approvalFor(d: DecisionSummary, approvals: readonly ApprovalSummary[]): { label: string; tone: Tone } {
  const a = approvals.filter((x) => x.riskDecisionId === d.id && x.decisionVersion === d.version).sort((p, q) => (p.createdAt < q.createdAt ? 1 : -1))[0];
  if (a) return a.action === "APPROVE" ? { label: "Approved by a person", tone: "ok" } : { label: "Rejected by a person", tone: "bad" };
  const g = statusGroup(d.effectiveStatus);
  return g === "ready" ? { label: "Waiting for a person in the bot", tone: "info" } : g === "expired" ? { label: "Expired without a decision", tone: "mute" } : g === "rejected" ? { label: "Rejected by the risk rules", tone: "mute" } : { label: "Not approvable yet", tone: "mute" };
}

/** Same arithmetic as the production decision card: weight x confidence of scoring agents, SUPPORTIVE / NEUTRAL / everything else against. */
export function agentShares(card: Pick<DecisionCardData, "agents">): { bull: number; neutral: number; bear: number } | null {
  const sc = card.agents.filter((a) => a.scored);
  const w = (a: (typeof sc)[number]): number => a.weight * ((a.confidence ?? 0) / 100);
  const total = sc.reduce((s, a) => s + w(a), 0);
  if (total === 0) return null;
  const part = (f: (v: string) => boolean): number => (sc.filter((a) => f(a.verdict)).reduce((s, a) => s + w(a), 0) / total) * 100;
  return { bull: part((v) => v === "SUPPORTIVE"), neutral: part((v) => v === "NEUTRAL"), bear: part((v) => v !== "SUPPORTIVE" && v !== "NEUTRAL") };
}

export const SRC_TONE: Record<SourceStatus, Tone> = { OK: "ok", DEGRADED: "warn", STALE: "warn", FAILING: "bad", MISSING: "mute", INVALID: "bad" };
export function ageText(sec: number | null): string {
  if (sec === null || !Number.isFinite(sec)) return "age unknown";
  if (sec < 90) return `${Math.max(0, Math.round(sec))} s old`;
  if (sec < 5400) return `${Math.round(sec / 60)} min old`;
  return sec < 172800 ? `${Math.round(sec / 3600)} h old` : `${Math.round(sec / 86400)} d old`;
}
export const ageSince = (iso: string | null, now: number): number | null => (iso ? Math.max(0, Math.round((now - Date.parse(iso)) / 1000)) : null);

/** Market is derived from the index name: the API has no market field on claims. */
export const marketOf = (underlying: string | null): "NSE" | "BSE" | "unknown" => (underlying === null ? "unknown" : ["SENSEX", "BANKEX"].includes(underlying.toUpperCase()) ? "BSE" : "NSE");

/** A "complete" claim states an action and an entry. Result reports are dropped at intake since parser v3, so this is NOT a result-report filter. */
export const isCompleteClaim = (c: TelegramClaim): boolean => c.claim !== null && c.claim.action !== null && c.claim.entry.type !== null && c.claim.entry.type !== "unspecified";

export interface ClaimFilters { channel: string; market: "all" | "NSE" | "BSE"; side: "all" | "buy" | "sell" | "none"; outcome: "all" | "INSUFFICIENT_EVIDENCE" | "REJECT"; sinceHours: number | null; completeOnly: boolean }
export const NO_CLAIM_FILTERS: ClaimFilters = { channel: "all", market: "all", side: "all", outcome: "all", sinceHours: null, completeOnly: false };
/** Filters run on the records already loaded (the API has no market, side or date parameters). */
export function applyClaimFilters(rows: readonly TelegramClaim[], f: ClaimFilters): TelegramClaim[] {
  return rows.filter((r) => {
    const c = r.claim;
    if (f.channel !== "all" && r.channel !== f.channel) return false;
    if (f.market !== "all" && marketOf(c?.underlying ?? null) !== f.market) return false;
    if (f.side !== "all" && (f.side === "none" ? c?.action != null : c?.action !== f.side)) return false;
    if (f.outcome !== "all" && r.assessmentOutcome !== f.outcome) return false;
    if (f.sinceHours !== null && (r.ageSeconds === null || r.ageSeconds > f.sinceHours * 3600)) return false;
    if (f.completeOnly && !isCompleteClaim(r)) return false;
    return true;
  });
}
export const activeFilterCount = (f: ClaimFilters): number => [f.channel !== "all", f.market !== "all", f.side !== "all", f.outcome !== "all", f.sinceHours !== null, f.completeOnly].filter(Boolean).length;

/** Link rule for the approval bot, shared with the decision page. */
export const BOT_URL_PATTERN = /^https:\/\/t\.me\/[A-Za-z0-9_]{5,32}$/;

export const istTime = (iso: string | null): string => (iso ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false, day: "2-digit", month: "short" }).format(new Date(iso)) : "—");
export const num = (v: string | number | null | undefined): number | null => { if (v === null || v === undefined || v === "") return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
export const rupees = (n: number | null | undefined): string => (n === null || n === undefined || !Number.isFinite(n) ? "—" : `${n < 0 ? "−" : ""}₹${Math.abs(Math.round(n)).toLocaleString("en-IN")}`);
export const signedRupees = (n: number): string => `${n < 0 ? "−" : "+"}₹${Math.abs(Math.round(n)).toLocaleString("en-IN")}`;
export const ASSESSMENT_TEXT: Record<string, string> = { RESEARCH_SUPPORTIVE: "Research: supportive", RESEARCH_NEUTRAL: "Research: neutral", RESEARCH_CAUTION: "Research: caution", RESEARCH_ADVERSE: "Research: adverse" };
