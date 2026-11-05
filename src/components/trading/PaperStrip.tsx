"use client";
import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLoaded } from "./hooks";
import { Pnl, SourceBadge, card } from "./ui";
import { getOutcomeStats, getPaperStatus, inr, pct } from "@/services/trading";
import { cn } from "@/lib/utils";

/** Dashboard strip: the paper-trading headline numbers and its switch state. Read-only. */
export function PaperStrip() {
  const st = useLoaded(getPaperStatus, 15_000), os = useLoaded(getOutcomeStats, 30_000);
  const s = st.loaded?.data, stats = os.loaded?.data;
  const cells: Array<[string, React.ReactNode]> = [
    ["Open positions", s ? s.summary.openPositions : "—"],
    ["Unrealised", s ? <Pnl value={s.summary.unrealizedPnl}>{inr(s.summary.unrealizedPnl)}</Pnl> : "—"],
    ["Realised", s ? <Pnl value={s.summary.realizedPnl}>{inr(s.summary.realizedPnl)}</Pnl> : "—"],
    ["Win rate", stats ? `${pct(stats.winRate)} · ${stats.n} trades` : "—"],
  ];
  return (
    <section className={cn(card, "p-4 sm:p-5")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-sm font-semibold text-ink">Paper trading</h2>
          <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", s?.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600")}>{s ? (s.enabled ? "Running" : "Switched off") : "…"}</span>
          <SourceBadge source={st.loaded?.source} note={st.loaded?.note} loading={st.loading} />
        </div>
        <div className="flex gap-2 text-xs font-medium"><Link href="/positions" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50">Positions <ArrowRight className="h-3 w-3" /></Link><Link href="/pnl" className="inline-flex items-center gap-1 rounded-lg bg-royal-600 px-3 py-1.5 text-white shadow-hero hover:bg-royal-700">P&L <ArrowRight className="h-3 w-3" /></Link></div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">{cells.map(([k, v]) => <div key={k}><dt className="text-[11px] font-mono uppercase tracking-wider text-slate-400">{k}</dt><dd className="mt-1 font-mono text-lg font-semibold text-ink">{v}</dd></div>)}</dl>
    </section>
  );
}
