"use client";

import React, { useMemo, useState } from "react";
import { useLoaded } from "@/components/trading/hooks";
import { Chip, DataBanner, Empty, PageHeader, Pnl, Skeleton, SourceBadge, card } from "@/components/trading/ui";
import { duration, getApprovals, getDecisions, getOutcomes, inr, px, signed } from "@/services/trading";
import { cn } from "@/lib/utils";

type Kind = "signal" | "approval" | "trade";
interface Entry { id: string; at: string; kind: Kind; title: string; detail: string; chip: string; chipLabel?: string; amount?: number }
const FILTERS = [["all", "Everything"], ["signal", "Signals"], ["approval", "Approvals"], ["trade", "Closed trades"]] as const;
const PAGE = 25;

export default function HistoryPage() {
  const dec = useLoaded(() => getDecisions(), 30_000), app = useLoaded(getApprovals, 30_000), out = useLoaded(getOutcomes, 30_000);
  const [kind, setKind] = useState<(typeof FILTERS)[number][0]>("all"), [q, setQ] = useState(""), [shown, setShown] = useState(PAGE);
  const loaded = dec.loaded ?? app.loaded ?? out.loaded;
  const source = loaded ? "live" : undefined, note = undefined;

  const entries = useMemo<Entry[]>(() => {
    const e: Entry[] = [];
    for (const d of dec.loaded?.data ?? []) e.push({ id: `s${d.id}`, at: d.createdAt, kind: "signal", title: `${d.symbol}${d.instrumentType === "option" ? ` ${d.strike ?? ""} ${d.optionType ?? ""}` : ""} ${d.side ?? ""}`.trim(), detail: `v${d.version} · entry ${px(d.entryPrice)} · SL ${px(d.stopLoss)}${d.targets.length ? ` · T ${d.targets.map(px).join(" / ")}` : ""} · ${d.reasonCode.replaceAll("_", " ").toLowerCase()}`, chip: d.effectiveStatus });
    for (const a of app.loaded?.data ?? []) e.push({ id: `a${a.id}`, at: a.createdAt, kind: "approval", title: `Decision ${a.riskDecisionId.slice(0, 8)} v${a.decisionVersion}`, detail: `${a.actorType} ${a.actorRef}${a.reason ? ` · “${a.reason}”` : ""}`, chip: a.action, chipLabel: a.action === "APPROVE" ? "Approved" : "Rejected" });
    for (const o of out.loaded?.data ?? []) e.push({ id: `t${o.tradeId}`, at: o.closedAt, kind: "trade", title: `${o.symbol} ${o.side}`, detail: `${o.closeReason.replaceAll("_", " ").toLowerCase()} · held ${duration(o.holdingSeconds)} · ${signed(o.rMultiple)}R`, chip: o.outcome, amount: o.pnl });
    return e.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  }, [dec.loaded, app.loaded, out.loaded]);

  const rows = entries.filter((e) => (kind === "all" || e.kind === kind) && (!q.trim() || `${e.title} ${e.detail}`.toLowerCase().includes(q.trim().toLowerCase())));
  const visible = rows.slice(0, shown);
  const days = useMemo(() => { const m = new Map<string, Entry[]>(); for (const e of visible) { const k = new Date(e.at).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }); (m.get(k) ?? m.set(k, []).get(k)!).push(e); } return [...m.entries()]; }, [visible]);

  return (
    <div className="space-y-6">
      <PageHeader title="History" subtitle="Everything that happened, newest first: signals, your approvals and rejections, and closed simulated trades." right={<SourceBadge source={source} note={note} loading={dec.loading || app.loading || out.loading} />} />
      <DataBanner source={source} note={note} onRetry={() => { dec.refresh(); app.refresh(); out.refresh(); }} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">{FILTERS.map(([k, l]) => <button key={k} onClick={() => { setKind(k); setShown(PAGE); }} className={cn("rounded-full border px-3.5 py-1.5 text-xs font-medium transition", kind === k ? "border-royal-600 bg-royal-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>{l}</button>)}</div>
        <input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder="Search symbol or reason" aria-label="Search history" className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-royal-500 focus:outline-none focus:ring-2 focus:ring-royal-500/15 sm:w-64" />
      </div>
      {!loaded ? <Skeleton h={300} /> : rows.length === 0 ? <Empty title="Nothing to show" hint={entries.length === 0 ? "No signals, approvals or closed trades are recorded yet." : "No entry matches this filter or search."} /> : (
        <div className="space-y-5">
          {days.map(([day, list]) => (
            <section key={day}>
              <h2 className="mb-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">{day}</h2>
              <ul className={cn(card, "divide-y divide-slate-50 overflow-hidden")}>
                {list.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                    <time className="w-12 shrink-0 pt-0.5 font-mono text-xs text-slate-400" dateTime={e.at}>{new Date(e.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}</time>
                    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-ink">{e.title}</p><Chip kind={e.chip}>{e.chipLabel}</Chip><span className="text-[11px] text-slate-400">{e.kind}</span></div><p className="mt-0.5 break-words text-xs text-slate-500">{e.detail}</p></div>
                    {e.amount !== undefined && <Pnl value={e.amount} className="shrink-0 text-sm font-semibold">{inr(e.amount)}</Pnl>}
                  </li>))}
              </ul>
            </section>))}
          {rows.length > shown && <button onClick={() => setShown((n) => n + PAGE)} className="mx-auto block rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Show {Math.min(PAGE, rows.length - shown)} more ({rows.length - shown} left)</button>}
        </div>
      )}
    </div>
  );
}
