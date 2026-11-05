"use client";

import React, { useMemo, useState } from "react";
import { useLoaded } from "@/components/trading/hooks";
import { Chip, DataBanner, Empty, LevelBar, PageHeader, Pnl, SafetyNote, Skeleton, SourceBadge, Stat, card } from "@/components/trading/ui";
import { ago, getPositions, inr, px, signed } from "@/services/trading";
import type { PositionView } from "@/types/trading";
import { cn } from "@/lib/utils";

const FILTERS = [["ALL", "All"], ["OPEN", "Open"], ["PENDING_ENTRY", "Pending"], ["CLOSED", "Closed"], ["CANCELLED", "Cancelled"]] as const;

export default function PositionsPage() {
  const { loaded, loading, refresh } = useLoaded(getPositions, 10_000);
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("ALL");
  const all = loaded?.data ?? [];
  const rows = useMemo(() => all.filter((p) => filter === "ALL" || p.state === filter), [all, filter]);
  const open = all.filter((p) => p.state === "OPEN");
  const unreal = open.reduce((a, p) => a + p.unrealizedPnl, 0), realized = all.reduce((a, p) => a + p.realizedPnl, 0);
  const exposure = open.reduce((a, p) => a + (p.lastPrice ?? p.fillPrice ?? 0) * p.remainingQuantity, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Positions" subtitle="Simulated trades, managed by stop, targets and a trailing stop. Prices refresh every 10 seconds." right={<div className="flex items-center gap-2"><SourceBadge source={loaded?.source} note={loaded?.note} loading={loading} /><button onClick={refresh} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Refresh</button></div>} />
      <DataBanner source={loaded?.source} note={loaded?.note} onRetry={refresh} />
      <SafetyNote>These are simulated positions. Nothing here is sent to a broker, and no real order exists.</SafetyNote>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat title="Open positions" value={open.length} sub={`${all.filter((p) => p.state === "PENDING_ENTRY").length} waiting for entry`} />
        <Stat title="Unrealised P&L" value={inr(unreal)} tone={unreal > 0 ? "up" : unreal < 0 ? "down" : "flat"} sub="Open quantity at last price" accent={unreal > 0} />
        <Stat title="Realised P&L" value={inr(realized)} tone={realized > 0 ? "up" : realized < 0 ? "down" : "flat"} sub="Partial and final exits" />
        <Stat title="Exposure" value={inr(exposure)} sub="Open quantity × last price" />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={cn("rounded-full border px-3.5 py-1.5 text-xs font-medium transition", filter === k ? "border-royal-600 bg-royal-600 text-white shadow-hero" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>{l}{k !== "ALL" && <span className="ml-1.5 opacity-70">{all.filter((p) => p.state === k).length}</span>}</button>)}
      </div>

      {!loaded ? <div className="space-y-3"><Skeleton /><Skeleton /></div> : rows.length === 0 ? (
        <Empty title="No positions here yet" hint={filter === "ALL" ? "A paper trade is created only after a human approves a decision, and only when paper trading is switched on for this server." : "Nothing matches this filter."} />
      ) : (
        <>
          <div className={cn(card, "hidden overflow-x-auto md:block")}>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-left"><Th>Instrument</Th><Th>State</Th><Th right>Qty</Th><Th right>Entry / fill</Th><Th right>Last</Th><Th>Stop · Entry · Targets</Th><Th right>P&L</Th><Th right>R</Th></tr></thead>
              <tbody>{rows.map((p) => <Row key={p.tradeId} p={p} />)}</tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">{rows.map((p) => <MobileCard key={p.tradeId} p={p} />)}</div>
        </>
      )}
    </div>
  );
}

const Th = ({ children, right }: { children?: React.ReactNode; right?: boolean }) => <th className={cn("px-4 py-3 text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500", right && "text-right")}>{children}</th>;

function Row({ p }: { p: PositionView }) {
  return (
    <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
      <td className="px-4 py-3.5"><div className="flex items-center gap-2"><span className="font-semibold text-ink">{p.symbol}</span><Chip kind={p.side} /></div><div className="mt-0.5 text-xs text-slate-400">{p.openedAt ? `opened ${ago(p.openedAt)}` : "not filled"}</div></td>
      <td className="px-4 py-3.5"><Chip kind={p.state} />{p.trailingActive && <span className="ml-1.5 text-[11px] font-medium text-royal-600">trailing</span>}</td>
      <td className="px-4 py-3.5 text-right font-mono tabular-nums">{p.remainingQuantity}<span className="text-slate-400">/{p.quantity}</span></td>
      <td className="px-4 py-3.5 text-right font-mono tabular-nums">{px(p.entryPrice)}{p.fillPrice !== null && <div className="text-xs text-slate-400">fill {px(p.fillPrice)}</div>}</td>
      <td className="px-4 py-3.5 text-right font-mono tabular-nums">{px(p.lastPrice)}</td>
      <td className="px-4 py-3.5 pr-6"><LevelBar stop={p.stop} entry={p.entryPrice} targets={p.targets} last={p.lastPrice} targetsHit={p.targetsHit} /><div className="mt-0.5 flex justify-between font-mono text-[10px] text-slate-400"><span>SL {px(p.stop)}</span><span>{p.targetsHit}/{p.targets.length} targets</span></div></td>
      <td className="px-4 py-3.5 text-right"><Pnl value={p.totalPnl} className="font-semibold">{inr(p.totalPnl)}</Pnl>{p.realizedPnl !== 0 && p.state === "OPEN" && <div className="text-xs text-slate-400">booked {inr(p.realizedPnl)}</div>}</td>
      <td className="px-4 py-3.5 text-right"><Pnl value={p.rMultiple}>{p.rMultiple === null ? "—" : `${signed(p.rMultiple)}R`}</Pnl></td>
    </tr>
  );
}

function MobileCard({ p }: { p: PositionView }) {
  return (
    <div className={cn(card, "p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div><div className="flex items-center gap-2"><span className="text-base font-semibold text-ink">{p.symbol}</span><Chip kind={p.side} /><Chip kind={p.state} /></div><p className="mt-1 text-xs text-slate-400">{p.openedAt ? `opened ${ago(p.openedAt)}` : "waiting for entry"} · qty {p.remainingQuantity}/{p.quantity}</p></div>
        <div className="text-right"><Pnl value={p.totalPnl} className="text-lg font-semibold">{inr(p.totalPnl)}</Pnl><div><Pnl value={p.rMultiple} className="text-xs">{p.rMultiple === null ? "" : `${signed(p.rMultiple)}R`}</Pnl></div></div>
      </div>
      <div className="mt-3"><LevelBar stop={p.stop} entry={p.entryPrice} targets={p.targets} last={p.lastPrice} targetsHit={p.targetsHit} /></div>
      <div className="mt-1 grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-500"><span>SL {px(p.stop)}</span><span className="text-center">last {px(p.lastPrice)}</span><span className="text-right">{p.targetsHit}/{p.targets.length} T</span></div>
    </div>
  );
}
