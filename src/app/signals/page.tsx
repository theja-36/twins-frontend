"use client";

import React, { useState } from "react";
import { useLoaded } from "@/components/trading/hooks";
import { Chip, Empty, LevelBar, PageHeader, Skeleton, SourceBadge, card } from "@/components/trading/ui";
import { ago, getDecisions, inr, px } from "@/services/trading";
import type { DecisionSummary } from "@/types/trading";
import { cn } from "@/lib/utils";

const FILTERS = [["", "All"], ["APPROVED_FOR_REVIEW", "Ready for review"], ["PENDING", "Pending"], ["REJECTED", "Rejected"], ["EXPIRED", "Expired"]] as const;

export default function SignalsPage() {
  const [status, setStatus] = useState<string>("");
  const { loaded, loading, refresh } = useLoaded(() => getDecisions(status || undefined), 20_000);
  React.useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);
  const rows = (loaded?.data ?? []).filter((d) => d.effectiveStatus !== "SUPERSEDED");

  return (
    <div className="space-y-6">
      <PageHeader title="Signals" subtitle="Every parsed signal after the safety gates: its levels, size and where it stands." right={<SourceBadge source={loaded?.source} note={loaded?.note} loading={loading} />} />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([k, l]) => <button key={k} onClick={() => setStatus(k)} className={cn("rounded-full border px-3.5 py-1.5 text-xs font-medium transition", status === k ? "border-royal-600 bg-royal-600 text-white shadow-hero" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>{l}</button>)}
      </div>
      {!loaded ? <div className="grid gap-4 md:grid-cols-2"><Skeleton h={220} /><Skeleton h={220} /></div> : rows.length === 0 ? <Empty title="No signals match" hint="New signals appear here after the Telegram intake parses them and the risk gates run." /> : (
        <div className="grid gap-4 md:grid-cols-2">{rows.map((d) => <SignalCard key={d.id} d={d} />)}</div>
      )}
    </div>
  );
}

function SignalCard({ d }: { d: DecisionSummary }) {
  const entry = Number(d.entryPrice), stop = Number(d.stopLoss), targets = d.targets.map(Number);
  const levels = Number.isFinite(entry) && Number.isFinite(stop) && targets.length > 0 && targets.every(Number.isFinite);
  const title = d.instrumentType === "option" ? `${d.symbol} ${d.strike ?? ""} ${d.optionType ?? ""}`.trim() : d.symbol;
  return (
    <article className={cn(card, "p-5 transition hover:shadow-cardHover")}>
      <header className="flex items-start justify-between gap-3">
        <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>{d.side && <Chip kind={d.side} />}<span className="text-xs text-slate-400">{d.market ?? ""} {d.instrumentType}{d.expiry ? ` · exp ${d.expiry}` : ""}</span></div><p className="mt-1 text-xs text-slate-400">v{d.version} · {ago(d.createdAt)} · {d.reasonCode.replaceAll("_", " ").toLowerCase()}</p></div>
        <Chip kind={d.effectiveStatus} />
      </header>
      {levels ? <div className="mt-4"><LevelBar stop={stop} entry={entry} targets={targets} last={null} targetsHit={0} /><div className="mt-1 flex justify-between font-mono text-[11px] text-slate-400"><span>SL {px(stop)}</span><span>entry {px(entry)}</span><span>T {targets.map((t) => px(t)).join(" · ")}</span></div></div> : <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">Levels incomplete: this signal cannot be sized or approved.</p>}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        <Field k="Quantity" v={d.plannedQuantity ?? "—"} /><Field k="Max loss" v={d.plannedMaxLossAmount ? inr(Number(d.plannedMaxLossAmount)) : "—"} /><Field k="Risk : reward" v={d.riskReward ? `1 : ${d.riskReward}` : "—"} />
        <Field k="Confidence" v={d.confidenceScore ? `${Math.round(Number(d.confidenceScore) * 100)}%` : "—"} /><Field k="Source trust" v={d.sourceTrustTier?.replace("TIER_", "Tier ") ?? "—"} /><Field k="Notional" v={d.plannedNotional ? inr(Number(d.plannedNotional)) : "—"} />
      </dl>
    </article>
  );
}
const Field = ({ k, v }: { k: string; v: React.ReactNode }) => <div><dt className="text-[11px] font-mono uppercase tracking-wider text-slate-400">{k}</dt><dd className="mt-0.5 font-mono font-medium text-ink">{v}</dd></div>;
