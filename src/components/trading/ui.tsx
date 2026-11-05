import React from "react";
import { cn } from "@/lib/utils";
import type { DataSource, TradeOutcome } from "@/types/trading";

const label = "text-[11px] font-mono uppercase tracking-wider text-slate-500";
export const card = "rounded-2xl border border-slate-200/80 bg-white shadow-card";

export function PageHeader({ title, subtitle, right }: { title: string; subtitle: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">{title}</h1><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>
      {right}
    </div>
  );
}

export function SourceBadge({ source, note, loading }: { source?: DataSource; note?: string; loading?: boolean }) {
  const live = source === "live";
  const text = source === undefined ? "Loading" : live ? "Live · paper" : source === "mock" ? "Mock data" : "Mock · backend down";
  return (
    <span title={note} className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium", live ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800")}>
      <span className={cn("h-2 w-2 rounded-full", live ? "bg-emerald-500" : "bg-amber-500", loading && "animate-pulse")} />{text}
    </span>
  );
}

export function SafetyNote({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-xs text-amber-900"><span className="font-mono font-semibold uppercase tracking-wider">Paper only</span><span>{children}</span></div>;
}

export function Stat({ title, value, sub, tone, accent }: { title: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "up" | "down" | "flat"; accent?: boolean }) {
  return (
    <div className={cn(card, "p-4 sm:p-5", accent && "border-acid-400 bg-gradient-to-br from-acid-50/80 to-white")}>
      <p className={label}>{title}</p>
      <p className={cn("mt-2 font-mono text-2xl font-semibold tracking-tight sm:text-[26px]", tone === "up" && "text-emerald-600", tone === "down" && "text-rose-600", (!tone || tone === "flat") && "text-ink")}>{value}</p>
      {sub && <p className="mt-1.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function Pnl({ value, children, className }: { value: number | null | undefined; children: React.ReactNode; className?: string }) {
  return <span className={cn("font-mono tabular-nums", value === null || value === undefined || value === 0 ? "text-slate-600" : value > 0 ? "text-emerald-600" : "text-rose-600", className)}>{children}</span>;
}

const CHIP: Record<string, string> = {
  BUY: "bg-emerald-50 text-emerald-700 border-emerald-200", SELL: "bg-rose-50 text-rose-700 border-rose-200",
  OPEN: "bg-royal-50 text-royal-700 border-royal-200", PENDING_ENTRY: "bg-amber-50 text-amber-800 border-amber-200", CLOSED: "bg-slate-100 text-slate-600 border-slate-200", CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
  APPROVED_FOR_REVIEW: "bg-acid-100 text-acid-700 border-acid-300", PENDING: "bg-amber-50 text-amber-800 border-amber-200", REJECTED: "bg-rose-50 text-rose-700 border-rose-200", EXPIRED: "bg-slate-100 text-slate-500 border-slate-200", SUPERSEDED: "bg-slate-100 text-slate-500 border-slate-200",
  WIN: "bg-emerald-50 text-emerald-700 border-emerald-200", LOSS: "bg-rose-50 text-rose-700 border-rose-200", BREAKEVEN: "bg-slate-100 text-slate-600 border-slate-200", APPROVE: "bg-acid-100 text-acid-700 border-acid-300",
};
export function Chip({ kind, children }: { kind: string; children?: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide", CHIP[kind] ?? "bg-slate-100 text-slate-600 border-slate-200")}>{children ?? kind.replaceAll("_", " ")}</span>;
}

export function Empty({ title, hint }: { title: string; hint: string }) {
  return <div className={cn(card, "px-6 py-14 text-center")}><p className="text-base font-semibold text-ink">{title}</p><p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{hint}</p></div>;
}
export function Skeleton({ h = 96 }: { h?: number }) { return <div style={{ height: h }} className="animate-pulse rounded-2xl bg-slate-200/60" />; }

/** Stop ← entry → targets, with the last price marker. Works for BUY and SELL (the axis is simply price). */
export function LevelBar({ stop, entry, targets, last, targetsHit }: { stop: number; entry: number; targets: number[]; last: number | null; targetsHit: number }) {
  const all = [stop, entry, ...targets, ...(last === null ? [] : [last])];
  const lo = Math.min(...all), hi = Math.max(...all), span = hi - lo || 1;
  const x = (p: number) => `${((p - lo) / span) * 100}%`;
  return (
    <div className="relative h-9 w-full min-w-[180px]" aria-label="price ladder">
      <div className="absolute left-0 right-0 top-[17px] h-1 rounded-full bg-slate-200" />
      <div className="absolute top-[17px] h-1 rounded-full bg-rose-300/80" style={{ left: x(Math.min(stop, entry)), width: `${(Math.abs(entry - stop) / span) * 100}%` }} />
      <div className="absolute top-[17px] h-1 rounded-full bg-emerald-300/80" style={{ left: x(Math.min(entry, targets[targets.length - 1] ?? entry)), width: `${(Math.abs((targets[targets.length - 1] ?? entry) - entry) / span) * 100}%` }} />
      <Tick at={x(stop)} cls="bg-rose-500" tip={`Stop ${stop}`} /><Tick at={x(entry)} cls="bg-slate-500" tip={`Entry ${entry}`} />
      {targets.map((t, i) => <Tick key={i} at={x(t)} cls={i < targetsHit ? "bg-emerald-600" : "bg-emerald-400"} tip={`T${i + 1} ${t}`} hollow={i >= targetsHit} />)}
      {last !== null && <div className="absolute top-0 -translate-x-1/2" style={{ left: x(last) }} title={`Last ${last}`}><div className="mx-auto h-0 w-0 border-x-4 border-t-[7px] border-x-transparent border-t-royal-600" /><div className="mx-auto h-5 w-0.5 bg-royal-600" /></div>}
    </div>
  );
}
function Tick({ at, cls, tip, hollow }: { at: string; cls: string; tip: string; hollow?: boolean }) {
  return <div title={tip} className={cn("absolute top-[12px] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white", hollow ? "bg-white ring-2 ring-emerald-400" : cls)} style={{ left: at }} />;
}

/** Cumulative R equity curve (inline SVG, no dependency). */
export function EquityCurve({ outcomes }: { outcomes: TradeOutcome[] }) {
  const sorted = [...outcomes].sort((a, b) => Date.parse(a.closedAt) - Date.parse(b.closedAt));
  let cum = 0; const pts = [0, ...sorted.map((o) => (cum += o.rMultiple))];
  const W = 640, H = 220, P = 24, lo = Math.min(0, ...pts), hi = Math.max(0.5, ...pts), span = hi - lo || 1;
  const X = (i: number) => P + (i / Math.max(1, pts.length - 1)) * (W - 2 * P), Y = (v: number) => H - P - ((v - lo) / span) * (H - 2 * P);
  const line = pts.map((v, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const up = pts[pts.length - 1]! >= 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Cumulative R multiple by closed trade">
      <defs><linearGradient id="eq" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={up ? "#2563EB" : "#E11D48"} stopOpacity="0.22" /><stop offset="1" stopColor={up ? "#2563EB" : "#E11D48"} stopOpacity="0" /></linearGradient></defs>
      <line x1={P} x2={W - P} y1={Y(0)} y2={Y(0)} stroke="#CBD5E1" strokeDasharray="4 4" />
      <path d={`${line} L${X(pts.length - 1)},${Y(lo)} L${X(0)},${Y(lo)} Z`} fill="url(#eq)" />
      <path d={line} fill="none" stroke={up ? "#2563EB" : "#E11D48"} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(pts.length - 1)} cy={Y(pts[pts.length - 1]!)} r="5" fill="#A3E635" stroke="#0A0E17" strokeWidth="1.5" />
      <text x={P} y={14} className="fill-slate-400" fontSize="11" fontFamily="monospace">{hi.toFixed(1)}R</text><text x={P} y={H - 6} className="fill-slate-400" fontSize="11" fontFamily="monospace">{lo.toFixed(1)}R</text>
    </svg>
  );
}

export function Bar({ value, max, tone }: { value: number; max: number; tone: "up" | "down" }) {
  return <div className="h-2 w-full rounded-full bg-slate-100"><div className={cn("h-2 rounded-full", tone === "up" ? "bg-emerald-500" : "bg-rose-400")} style={{ width: `${Math.min(100, (Math.abs(value) / (max || 1)) * 100)}%` }} /></div>;
}

/** Shown when the page is NOT reading live data: says why, and offers a retry. Hidden when the data is live. */
export function DataBanner({ source, note, onRetry }: { source?: DataSource; note?: string; onRetry?: () => void }) {
  if (source === undefined || source === "live") return null;
  const down = source === "mock-fallback";
  return (
    <div role="status" className={cn("flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-xs", down ? "border-rose-200 bg-rose-50/70 text-rose-800" : "border-amber-200 bg-amber-50/70 text-amber-900")}>
      <span><b>{down ? "Backend problem." : "Sample data."}</b> {note ?? "These numbers are examples, not real activity."}</span>
      {onRetry && <button onClick={onRetry} className="rounded-lg border border-current/30 px-2.5 py-1 font-semibold hover:bg-white/50">Retry</button>}
    </div>
  );
}
export function Section({ title, hint, children, right }: { title: string; hint?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className={cn(card, "p-5 sm:p-6")}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>{hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}</div>{right}</div>
      {children}
    </section>
  );
}
export function KV({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return <dl className="divide-y divide-slate-100 text-sm">{rows.map(([k, v]) => <div key={k} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between"><dt className="text-slate-500">{k}</dt><dd className="break-words font-mono text-[13px] font-medium text-ink sm:text-right">{v}</dd></div>)}</dl>;
}
export function Dot({ tone }: { tone: "ok" | "warn" | "bad" | "off" }) {
  return <span className={cn("inline-block h-2 w-2 rounded-full", tone === "ok" && "bg-emerald-500", tone === "warn" && "bg-amber-500", tone === "bad" && "bg-rose-500", tone === "off" && "bg-slate-300")} />;
}
