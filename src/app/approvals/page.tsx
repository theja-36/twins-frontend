"use client";

import React from "react";
import { useLoaded } from "@/components/trading/hooks";
import { Chip, DataBanner, Empty, LevelBar, PageHeader, SafetyNote, Skeleton, SourceBadge, card } from "@/components/trading/ui";
import { ago, getApprovals, getDecisions, inr, px } from "@/services/trading";
import type { ApprovalSummary, DecisionSummary } from "@/types/trading";
import { cn } from "@/lib/utils";

export default function ApprovalsPage() {
  const dec = useLoaded(() => getDecisions("APPROVED_FOR_REVIEW"), 15_000), app = useLoaded(getApprovals, 15_000);
  const approvedIds = new Map((app.loaded?.data ?? []).filter((a) => a.action === "APPROVE").map((a) => [a.riskDecisionId, a]));
  const cards = (dec.loaded?.data ?? []).filter((d) => d.effectiveStatus === "APPROVED_FOR_REVIEW");
  const waiting = cards.filter((d) => !approvedIds.has(d.id)), done = cards.filter((d) => approvedIds.has(d.id));

  return (
    <div className="space-y-6">
      <PageHeader title="Approval cards" subtitle="A human decides every trade. Nothing is simulated or sent until you approve." right={<SourceBadge source={dec.loaded?.source} note={dec.loaded?.note} loading={dec.loading} />} />
      <DataBanner source={dec.loaded?.source} note={dec.loaded?.note} onRetry={() => { dec.refresh(); app.refresh(); }} />
      <SafetyNote>Approving is recorded by the backend after it re-checks every gate. This page is read-only: approve or reject in Telegram (or with the operator command) until a secure sign-in is added here.</SafetyNote>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">Waiting for you <span className="rounded-full bg-acid-300 px-2 py-0.5 text-xs font-bold text-ink">{waiting.length}</span></h2>
        {!dec.loaded ? <Skeleton h={200} /> : waiting.length === 0 ? <Empty title="Nothing waiting" hint="When a signal passes every gate it shows up here as a card for you to review." /> : <div className="grid gap-4 md:grid-cols-2">{waiting.map((d) => <ApprovalCard key={d.id} d={d} />)}</div>}
      </section>

      {done.length > 0 && (
        <section className="space-y-3"><h2 className="text-sm font-semibold text-ink">Approved, handed to paper trading</h2><div className="grid gap-4 md:grid-cols-2">{done.map((d) => <ApprovalCard key={d.id} d={d} approval={approvedIds.get(d.id)} />)}</div></section>
      )}

      <section className={cn(card, "overflow-hidden")}>
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold text-ink">Recent decisions you made</h2></div>
        {!app.loaded ? <div className="p-5"><Skeleton h={80} /></div> : app.loaded.data.length === 0 ? <p className="px-5 py-8 text-sm text-slate-500">No approvals or rejections recorded yet.</p> : (
          <ul className="divide-y divide-slate-50">{app.loaded.data.slice(0, 15).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3"><div className="flex items-center gap-3"><Chip kind={a.action} /><div><p className="text-sm text-ink">Decision <span className="font-mono text-xs text-slate-500">{a.riskDecisionId.slice(0, 8)}</span> v{a.decisionVersion}</p><p className="text-xs text-slate-400">{a.actorType} {a.actorRef}{a.reason ? ` · “${a.reason}”` : ""}</p></div></div><span className="text-xs text-slate-400">{ago(a.createdAt)}</span></li>
          ))}</ul>
        )}
      </section>
    </div>
  );
}

function ApprovalCard({ d, approval }: { d: DecisionSummary; approval?: ApprovalSummary }) {
  const entry = Number(d.entryPrice), stop = Number(d.stopLoss), targets = d.targets.map(Number);
  const ok = [entry, stop, ...targets].every(Number.isFinite) && targets.length > 0;
  const title = d.instrumentType === "option" ? `${d.symbol} ${d.strike ?? ""} ${d.optionType ?? ""}`.trim() : d.symbol;
  return (
    <article className={cn(card, "p-5", !approval && "border-acid-400 bg-gradient-to-br from-acid-50/60 to-white")}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-ink">{title}</h3>{d.side && <Chip kind={d.side} />}</div>
        {approval ? <Chip kind="APPROVE">Approved</Chip> : <span className="rounded-md bg-ink px-2 py-0.5 text-[11px] font-semibold text-acid-300">Needs your decision</span>}
      </header>
      {ok && <div className="mt-4"><LevelBar stop={stop} entry={entry} targets={targets} last={null} targetsHit={0} /><div className="mt-1 flex justify-between font-mono text-[11px] text-slate-400"><span>SL {px(stop)}</span><span>entry {px(entry)}</span><span>T {targets.map((t) => px(t)).join(" · ")}</span></div></div>}
      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div><dt className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Quantity</dt><dd className="font-mono font-medium text-ink">{d.plannedQuantity ?? "—"}</dd></div>
        <div><dt className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Max loss</dt><dd className="font-mono font-medium text-rose-600">{d.plannedMaxLossAmount ? inr(Number(d.plannedMaxLossAmount)) : "—"}</dd></div>
        <div><dt className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Risk : reward</dt><dd className="font-mono font-medium text-ink">{d.riskReward ? `1 : ${d.riskReward}` : "—"}</dd></div>
      </dl>
      <footer className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400"><span>v{d.version} · {ago(d.createdAt)} · trust {d.sourceTrustTier?.replace("TIER_", "tier ") ?? "—"}</span>{approval ? <span>by {approval.actorType} {approval.actorRef}</span> : <span className="font-medium text-slate-500">approve in Telegram</span>}</footer>
    </article>
  );
}
