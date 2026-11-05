"use client";

import React from "react";
import { useLoaded } from "@/components/trading/hooks";
import { Bar, DataBanner, EquityCurve, Chip, Empty, PageHeader, Pnl, SafetyNote, Skeleton, SourceBadge, Stat, card } from "@/components/trading/ui";
import { ago, duration, getOutcomeStats, getOutcomes, getPaperSummary, inr, pct, signed } from "@/services/trading";
import type { GroupStats } from "@/types/trading";
import { cn } from "@/lib/utils";

export default function PnlPage() {
  const sum = useLoaded(getPaperSummary, 15_000), st = useLoaded(getOutcomeStats, 30_000), out = useLoaded(getOutcomes, 30_000);
  const s = sum.loaded?.data, stats = st.loaded?.data, outcomes = out.loaded?.data ?? [];
  const source = st.loaded?.source ?? sum.loaded?.source;
  const note = st.loaded?.note ?? sum.loaded?.note;
  const tone = (n: number | null | undefined) => (n === null || n === undefined || n === 0 ? "flat" : n > 0 ? "up" : "down") as "up" | "down" | "flat";

  return (
    <div className="space-y-6">
      <PageHeader title="P&L and learning" subtitle="How the simulated trades are doing, measured in rupees and in R (multiples of the risk taken at entry)." right={<SourceBadge source={source} note={note} loading={sum.loading || st.loading} />} />
      <DataBanner source={source} note={note} onRetry={() => { sum.refresh(); st.refresh(); out.refresh(); }} />
      <SafetyNote>Statistics only measure. They do not change any agent, weight or limit.</SafetyNote>

      {!s || !stats ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Skeleton h={110} /><Skeleton h={110} /><Skeleton h={110} /><Skeleton h={110} /></div> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat title="Total P&L" value={inr(s.totalPnl)} tone={tone(s.totalPnl)} sub={`${inr(s.realizedPnl)} realised · ${inr(s.unrealizedPnl)} open`} accent={s.totalPnl > 0} />
            <Stat title="Win rate" value={pct(stats.winRate)} sub={`${stats.wins}W · ${stats.losses}L · ${stats.breakeven}BE of ${stats.n}`} />
            <Stat title="Expectancy" value={stats.expectancyR === null ? "—" : `${signed(stats.expectancyR)}R`} tone={tone(stats.expectancyR)} sub="Average R per trade" />
            <Stat title="Profit factor" value={stats.profitFactor ?? "—"} sub={`Max drawdown ${stats.maxDrawdownR}R`} />
          </div>

          {!stats.sampleIsMeaningful && <div className="rounded-xl border border-royal-200 bg-royal-50/70 px-4 py-2.5 text-xs text-royal-800"><b>Small sample.</b> {stats.n} closed trade{stats.n === 1 ? "" : "s"}; at least {stats.minSampleForMeaning} are needed before these numbers mean anything. Treat them as a wiring check, not as a result.</div>}

          <div className="grid gap-4 lg:grid-cols-3">
            <div className={cn(card, "p-5 lg:col-span-2")}>
              <div className="mb-3 flex items-baseline justify-between"><h2 className="text-base font-semibold text-ink">Equity curve</h2><span className="text-xs text-slate-500">cumulative R, by closed trade</span></div>
              {outcomes.length === 0 ? <Empty title="No closed trades yet" hint="The curve starts after the first simulated trade closes." /> : <EquityCurve outcomes={outcomes} />}
            </div>
            <div className={cn(card, "p-5")}>
              <h2 className="text-base font-semibold text-ink">Averages</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <Row k="Average win" v={stats.avgWinR === null ? "—" : `${signed(stats.avgWinR)}R`} /><Row k="Average loss" v={stats.avgLossR === null ? "—" : `${signed(stats.avgLossR)}R`} />
                <Row k="Total R" v={`${signed(stats.totalR)}R`} /><Row k="Average hold" v={duration(stats.avgHoldingSeconds)} />
                <Row k="Open / pending" v={`${s.openPositions} / ${s.pendingEntries}`} /><Row k="Closed / cancelled" v={`${s.closedTrades} / ${s.cancelledTrades}`} />
              </dl>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Breakdown title="By how the trade ended" data={stats.byCloseReason} />
            <Breakdown title="By source trust tier" data={stats.bySourceTrustTier} />
            <Breakdown title="By research assessment" data={stats.byResearchAssessment} />
          </div>

          <div className={cn(card, "overflow-hidden")}>
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold text-ink">Recent closed trades</h2></div>
            {outcomes.length === 0 ? <p className="px-5 py-8 text-sm text-slate-500">Nothing closed yet.</p> : (
              <ul className="divide-y divide-slate-50">{[...outcomes].sort((a, b) => Date.parse(b.closedAt) - Date.parse(a.closedAt)).slice(0, 12).map((o) => (
                <li key={o.tradeId} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3"><Chip kind={o.outcome} /><div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{o.symbol} <span className="text-slate-400">{o.side}</span></p><p className="truncate text-xs text-slate-400">{o.closeReason.replaceAll("_", " ").toLowerCase()} · held {duration(o.holdingSeconds)} · {ago(o.closedAt)}</p></div></div>
                  <div className="text-right"><Pnl value={o.pnl} className="text-sm font-semibold">{inr(o.pnl)}</Pnl><div><Pnl value={o.rMultiple} className="text-xs">{signed(o.rMultiple)}R</Pnl></div></div>
                </li>))}</ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0"><dt className="text-slate-500">{k}</dt><dd className="font-mono font-medium text-ink">{v}</dd></div>;

function Breakdown({ title, data }: { title: string; data: Record<string, GroupStats> }) {
  const entries = Object.entries(data), max = Math.max(1, ...entries.map(([, g]) => Math.abs(g.totalR)));
  return (
    <div className={cn(card, "p-5")}>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {entries.length === 0 ? <p className="mt-3 text-sm text-slate-500">No data yet.</p> : (
        <ul className="mt-3 space-y-3">{entries.map(([k, g]) => (
          <li key={k}><div className="flex items-baseline justify-between text-xs"><span className="font-medium text-slate-700">{k.replaceAll("_", " ").toLowerCase()}</span><span className="font-mono text-slate-500">{g.n} · win {pct(g.winRate)} · <Pnl value={g.totalR}>{signed(g.totalR)}R</Pnl></span></div><div className="mt-1.5"><Bar value={g.totalR} max={max} tone={g.totalR >= 0 ? "up" : "down"} /></div></li>
        ))}</ul>
      )}
    </div>
  );
}
