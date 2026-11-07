"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLoaded } from "@/components/trading/hooks";
import { Chip, DataBanner, Empty, PageHeader, SafetyNote, Skeleton, SourceBadge, card } from "@/components/trading/ui";
import { DecisionCardPanel } from "@/components/trading/DecisionCard";
import { Pill } from "@/components/motion/Controls";
import { ago, getApprovals, getDecisions } from "@/services/trading";
import type { DecisionSummary } from "@/types/trading";
import { cn } from "@/lib/utils";

type Tab = "all" | "pending" | "approved" | "rejected";
const TABS: Array<[Tab, string]> = [["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]];
const XL = 1280;
const label = (d: DecisionSummary): string => `${d.symbol}${d.instrumentType === "option" ? ` ${d.strike ?? ""} ${d.optionType ?? ""}` : ""}`.trim();

/** Split view: the list on the left, the read-only card of the selected decision on the right (large screens). Below that width a row opens the full card page. Approval stays in Telegram. */
export default function DecisionsPage() {
  const router = useRouter();
  const dec = useLoaded(() => getDecisions(), 20_000), app = useLoaded(getApprovals, 20_000);
  const [tab, setTab] = React.useState<Tab>("all");
  const [sel, setSel] = React.useState<string | null>(null);
  const act = new Map((app.loaded?.data ?? []).map((a) => [a.riskDecisionId, a.action]));
  const stateOf = (d: DecisionSummary): Tab => { const a = act.get(d.id); return a === "APPROVE" ? "approved" : a === "REJECT" ? "rejected" : "pending"; };
  const rows = (dec.loaded?.data ?? []).filter((d) => d.effectiveStatus !== "SUPERSEDED");
  const shown = rows.filter((d) => tab === "all" || stateOf(d) === tab);
  const count = (t: Tab): number => (t === "all" ? rows.length : rows.filter((d) => stateOf(d) === t).length);
  const current = shown.find((d) => d.id === sel) ?? null;
  const open = (d: DecisionSummary): void => { if (typeof window !== "undefined" && window.innerWidth < XL) router.push(`/decision/${d.id}`); else setSel(d.id); };

  return (
    <div className="space-y-4">
      <PageHeader title="Decisions" subtitle="Every signal that reached the risk gates, with its approval status. Select one to read its card." right={<SourceBadge loading={dec.loading} />} />
      <DataBanner onRetry={() => { dec.refresh(); app.refresh(); }} />
      <SafetyNote>Approving or rejecting happens in the Telegram approval bot, which re-checks every gate. This page only shows the result.</SafetyNote>
      <div role="tablist" aria-label="Filter by status" className="inline-flex rounded-md border border-slate-200/80 p-0.5 font-mono text-xs">{TABS.map(([k, l]) => (
        <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded px-3 py-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal-500", tab === k ? "bg-slate-50 text-ink" : "text-slate-500 hover:text-ink")}>{l} <span className="text-slate-400">{count(k)}</span></button>))}
      </div>
      {!dec.loaded ? <Skeleton h={320} /> : shown.length === 0 ? <Empty title="No decisions here" hint={tab === "all" ? "They appear after a message becomes a claim and the risk gates run." : "None with this status."} /> : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <section className={cn(card, "overflow-hidden")} aria-label="Decision list">
            <ul className="max-h-[72vh] divide-y divide-slate-200/60 overflow-y-auto">{shown.map((d) => {
              const st = stateOf(d), on = d.id === current?.id;
              return (<li key={d.id}><button type="button" onClick={() => open(d)} aria-current={on ? "true" : undefined} className={cn("flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal-500", on && "bg-slate-50 shadow-[inset_2px_0_0_#00D4AA]")}>
                <span className="min-w-0"><span className="block truncate text-sm font-medium text-ink">{label(d)} {d.side ? <Chip kind={d.side} /> : null}</span><span className="block truncate font-mono text-[11px] text-slate-500">{ago(d.createdAt)} · {d.reasonCode.replaceAll("_", " ").toLowerCase()}</span></span>
                {st === "approved" ? <Pill tone="ok">approved</Pill> : st === "rejected" ? <Pill tone="bad">rejected</Pill> : <Chip kind={d.effectiveStatus} />}
              </button></li>);
            })}</ul>
          </section>
          <section className="hidden xl:block" aria-label="Selected decision">
            {current ? <div className={cn(card, "max-h-[78vh] overflow-y-auto p-5")}><DecisionCardPanel id={current.id} embedded /></div> : <div className={cn(card, "grid h-64 place-items-center p-6 text-center text-sm text-slate-500")}>Select a decision to read its card here.</div>}
          </section>
        </div>
      )}
    </div>
  );
}
