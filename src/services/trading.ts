import { BackendError, reportError, reportOk } from "./backendState";
import type { ApprovalSummary, DecisionSummary, Loaded, OutcomeStats, PaperStatus, PnlSummary, PositionView, TradeOutcome } from "@/types/trading";

/**
 * Data layer. The server tells us whether it is wired to a backend (`/api/twins/mode`); every call reads the backend through the server-side proxy (`/api/twins/*`, GET only; the API token never
 * reaches the browser). There is NO sample data: when the backend is missing or unreachable a call throws a BackendError, the shared state (backendState.ts) shows one clear banner, and pages
 * show nothing rather than invented numbers.
 */
let modePromise: Promise<boolean> | null = null;
export function isLive(): Promise<boolean> {
  if (!modePromise) modePromise = fetch("/api/twins/mode", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { configured: false })).then((j) => Boolean(j.configured)).catch(() => false);
  return modePromise;
}
export const recheckMode = (): void => { modePromise = null; };

export async function load<T>(path: string, pick: (raw: any) => T | null = (r) => r): Promise<Loaded<T>> {
  const key = path.split("?")[0] ?? path; // errors are tracked per endpoint
  if (!(await isLive())) { recheckMode(); reportError("not_configured", key); throw new BackendError("not_configured"); }
  let res: Response;
  try { res = await fetch(`/api/twins/${path}`, { cache: "no-store" }); } catch { reportError("unreachable", key); throw new BackendError("unreachable"); }
  if (res.status === 503) { reportError("not_configured", key); throw new BackendError("not_configured"); }
  if (res.status === 401) { reportError("unauthorized", key); throw new BackendError("unauthorized"); }
  if (!res.ok) { const kind = res.status === 502 || res.status >= 500 ? "unreachable" : "bad_answer"; reportError(kind, key); throw new BackendError(kind); }
  try { const data = pick(await res.json()); if (data === undefined || data === null) throw new Error("empty"); reportOk(key); return { data: data as T, source: "live" }; }
  catch { reportError("bad_answer", key); throw new BackendError("bad_answer"); }
}

// ─── fetchers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const getDecisions = (status?: string) => load<DecisionSummary[]>(`risk/decisions?limit=100${status ? `&status=${status}` : ""}`, (r) => r.decisions);
export const getApprovals = () => load<ApprovalSummary[]>("risk/approvals?limit=100", (r) => r.approvals);
export const getPaperStatus = () => load<PaperStatus>("paper/status");
export const getPaperSummary = () => load<PnlSummary>("paper/summary");
export const getPositions = () => load<PositionView[]>("paper/positions?limit=200", (r) => r.positions);
export const getOutcomes = () => load<TradeOutcome[]>("paper/outcomes?limit=500", (r) => r.outcomes);
export const getOutcomeStats = () => load<OutcomeStats>("paper/outcomes/stats");

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
