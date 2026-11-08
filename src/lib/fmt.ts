/**
 * Decimal-safe display formatting. The backend sends money/prices as DECIMAL STRINGS; these helpers only reshape the text (BigInt rounding, Indian digit grouping). They never convert to a JS float, so the UI cannot introduce a rounding error and is never the authority for a figure.
 */
const RE = /^-?\d+(\.\d+)?$/;
export const isDec = (v: unknown): v is string => typeof v === "string" && RE.test(v.trim());

/** Round a decimal string half-away-from-zero to `dp` places (pure BigInt). */
export function roundDec(v: string, dp: number): string {
  const s = v.trim(); if (!RE.test(s)) return s;
  const neg = s.startsWith("-"), [i = "0", f = ""] = (neg ? s.slice(1) : s).split(".");
  const scaled = BigInt(i + f.padEnd(dp, "0").slice(0, dp)) + (f.length > dp && Number(f[dp]) >= 5 ? BigInt(1) : BigInt(0));
  const str = scaled.toString().padStart(dp + 1, "0"), out = dp === 0 ? str : `${str.slice(0, -dp)}.${str.slice(-dp)}`;
  return neg && scaled !== BigInt(0) ? `-${out}` : out;
}
const group = (int: string): string => (int.length <= 3 ? int : `${int.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${int.slice(-3)}`);
export function groupDec(v: string): string { const neg = v.startsWith("-"), [i = "0", f] = (neg ? v.slice(1) : v).split("."); return `${neg ? "−" : ""}${group(i)}${f ? `.${f}` : ""}`; }
export const NA = "—";
/** ₹ amount, 2 dp by default. `null`/invalid -> "—" (never "0"). */
export function money(v: string | null | undefined, dp = 2): string { return v != null && isDec(v) ? `₹${groupDec(roundDec(v, dp))}` : NA; }
export function signedMoney(v: string | null | undefined, dp = 2): string { if (v == null || !isDec(v)) return NA; const r = roundDec(v, dp); return `${r.startsWith("-") ? "−" : "+"}₹${groupDec(r.replace("-", ""))}`; }
export function price(v: string | null | undefined, dp = 2): string { return v != null && isDec(v) ? groupDec(roundDec(v, dp)) : NA; }
export function pct(v: string | number | null | undefined, dp = 1): string {
  if (v == null) return NA; if (typeof v === "string") return isDec(v) ? `${roundDec(v, dp)}%` : NA;
  return Number.isFinite(v) ? `${v.toFixed(dp)}%` : NA; // display only
}
/** A ratio 0..1 shown as a percentage (display only; the backend computed it). */
export const ratioPct = (v: number | null | undefined, dp = 1): string => (v == null || !Number.isFinite(v) ? NA : `${(v * 100).toFixed(dp)}%`);
export const sign = (v: string | null | undefined): -1 | 0 | 1 | null => (v == null || !isDec(v) ? null : v.startsWith("-") ? (/^-0(\.0+)?$/.test(v) ? 0 : -1) : /^0(\.0+)?$/.test(v) ? 0 : 1);
export const pnlTone = (v: string | null | undefined): "ok" | "bad" | "mute" => { const s = sign(v); return s === 1 ? "ok" : s === -1 ? "bad" : "mute"; };
export const count = (n: number | null | undefined): string => (n == null ? NA : n.toLocaleString("en-IN"));
export function duration(sec: number | null | undefined): string { if (sec == null) return NA; if (sec < 60) return `${Math.round(sec)}s`; if (sec < 3600) return `${Math.round(sec / 60)}m`; if (sec < 86400) return `${(sec / 3600).toFixed(1)}h`; return `${(sec / 86400).toFixed(1)}d`; }
export const dateTime = (iso: string | null | undefined): string => (iso ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso)) + " IST" : NA);
export const words = (c: string): string => c.replaceAll("_", " ").replaceAll(".", " ").toLowerCase();
