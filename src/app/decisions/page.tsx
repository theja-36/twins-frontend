"use client";

import React from "react";
import Link from "next/link";
import { useLoaded } from "@/components/trading/hooks";
import { Chip, DataBanner, Empty, PageHeader, SafetyNote, Skeleton, SourceBadge, card } from "@/components/trading/ui";
import { Stagger, StaggerItem } from "@/components/motion/Motion";
import { Pill } from "@/components/motion/Controls";
import { ago, getApprovals, getDecisions, inr } from "@/services/trading";
import type { DecisionSummary } from "@/types/trading";
import { cn } from "@/lib/utils";

type Tab = "all" | "pending" | "approved" | "rejected";
const TABS: Array<[Tab, string]> = [["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]];

export default function DecisionsPage() {
  const dec = useLoaded(() => getDecisions(), 20_000), app = useLoaded(getApprovals, 20_000);
  const [tab, setTab] = React.useState<Tab>("all");
  const act = new Map((app.loaded?.data ?? []).map((a) => [a.riskDecisionId, a.action]));
  const stateOf = (d: DecisionSummary): Tab => { const a = act.get(d.id); return a === "APPROVE" ? "approved" : a === "REJECT" ? "rejected" : "pending"; };
  const rows = (dec.loaded?.data ?? []).filter((d) => d.effectiveStatus !== "SUPERSEDED");
  const shown = rows.filter((d) => tab === "all" || stateOf(d) === tab);
  const count = (t: Tab): number => (t === "all" ? rows.length : rows.filter((d) => stateOf(d) === t).length);
  return (
    <div className="space-y-6">
      <PageHeader title="Decisions" subtitle="Every signal that reached the risk gates, with its approval status. Open one for the full card." right={<SourceBadge loading={dec.loading} />} />
      <DataBanner onRetry={() => { dec.refresh(); app.refresh(); }} />
      <SafetyNote>Approving or rejecting happens in the Telegram approval bot, which re-checks every gate. This page only shows the result.</SafetyNote>
      <div role="tablist" aria-label="Filter by status" className="inline-flex rounded-xl border border-slate-200/80 bg-slate-50 p-1">{TABS.map(([k, l]) => (
        <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-lg px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal-500", tab === k ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink")}>{l} <span className="ml-1 font-mono text-xs text-slate-400">{dec.loaded ? count(k) : "—"}</span></button>))}</div>
      {!dec.loaded ? <Skeleton h={260} /> : shown.length === 0 ? <Empty title="No decisions here" hint={tab === "all" ? "They appear after a message becomes a claim and the risk gates run." : "None with this status."} /> : (
        <Stagger className="grid gap-3 md:grid-cols-2">{shown.map((d) => {
          const st = stateOf(d);
          return (<StaggerItem key={d.id}><Link href={`/decision/${d.id}`} className={cn(card, "block p-5 transition hover:-translate-y-0.5 hover:shadow-cardHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal-500")}>
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-ink">{d.symbol}{d.instrumentType === "option" ? ` ${d.strike ?? ""} ${d.optionType ?? ""}` : ""} {d.side ? <Chip kind={d.side} /> : null}</h2><p className="mt-0.5 text-xs text-slate-500">{d.expiry ? `exp ${d.expiry} · ` : ""}{ago(d.createdAt)} · v{d.version}</p></div>
              {st === "approved" ? <Pill tone="ok">approved</Pill> : st === "rejected" ? <Pill tone="bad">rejected</Pill> : <Chip kind={d.effectiveStatus} />}</div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs"><div><dt className="text-slate-400">Quantity</dt><dd className="font-mono text-ink">{d.plannedQuantity ?? "—"}</dd></div><div><dt className="text-slate-400">Largest loss</dt><dd className="font-mono text-ink">{d.plannedMaxLossAmount ? inr(Number(d.plannedMaxLossAmount)) : "—"}</dd></div><div><dt className="text-slate-400">Source trust</dt><dd className="font-mono text-ink">{d.sourceTrustTier?.replace("TIER_", "tier ") ?? "unknown"}</dd></div></dl>
            <p className="mt-3 text-xs text-slate-500">{d.reasonCode.replaceAll("_", " ").toLowerCase()}</p></Link></StaggerItem>);
        })}</Stagger>
      )}
    </div>
  );
}
