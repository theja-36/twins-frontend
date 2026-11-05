"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PaperStrip } from "@/components/trading/PaperStrip";
import { useLoaded } from "@/components/trading/hooks";
import { Chip, DataBanner, Dot, Empty, PageHeader, Skeleton, SourceBadge, Stat, card } from "@/components/trading/ui";
import { ago, getApprovals, getDecisions, inr, px } from "@/services/trading";
import { getHealth, getNotifications, getSystemConfig } from "@/services/system";
import { cn } from "@/lib/utils";

const SEV: Record<string, string> = { critical: "bg-rose-500", warning: "bg-amber-500", info: "bg-royal-500" };

export default function OverviewPage() {
  const cfg = useLoaded(getSystemConfig, 60_000), health = useLoaded(getHealth, 20_000), dec = useLoaded(() => getDecisions(), 20_000), app = useLoaded(getApprovals, 20_000), notes = useLoaded(() => getNotifications(8), 30_000);
  const c = cfg.loaded?.data, h = health.loaded?.data;
  const decisions = (dec.loaded?.data ?? []).filter((d) => d.effectiveStatus !== "SUPERSEDED");
  const approvedIds = new Set((app.loaded?.data ?? []).filter((a) => a.action === "APPROVE").map((a) => a.riskDecisionId));
  const waiting = decisions.filter((d) => d.effectiveStatus === "APPROVED_FOR_REVIEW" && !approvedIds.has(d.id));
  const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
  const today = decisions.filter((d) => Date.parse(d.createdAt) >= midnight.getTime());
  const sources = [cfg.loaded, health.loaded, dec.loaded].filter(Boolean) as NonNullable<typeof cfg.loaded>[];
  const worst = sources.find((s) => s.source === "mock-fallback") ?? sources.find((s) => s.source === "mock") ?? sources[0];
  const source = sources.length && sources.every((s) => s.source === "live") ? "live" : worst?.source;
  const allOk = h && h.database?.ok && h.redis?.ok;

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" subtitle="What needs you, what the system is doing, and whether it is safe." right={<SourceBadge source={source} note={worst?.note} loading={cfg.loading || health.loading} />} />
      <DataBanner source={source} note={worst?.note} onRetry={() => { cfg.refresh(); health.refresh(); dec.refresh(); }} />

      <section className={cn(card, "flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4")} aria-label="Safety posture">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">Safety</span>
        {!c ? <Skeleton h={20} /> : (
          <>
            <Pill tone="ok" label="Live trading" value="Locked" />
            <Pill tone={c.runtimeControls?.KILL_SWITCH_ACTIVE ? "bad" : "ok"} label="Kill switch" value={c.runtimeControls ? (c.runtimeControls.KILL_SWITCH_ACTIVE ? "ACTIVE" : "Clear") : "unreadable"} />
            <Pill tone={c.agentEngine.enabled ? "warn" : "ok"} label="Agent engine" value={c.agentEngine.enabled ? "Enforcing" : c.agentEngine.shadow ? "Shadow" : "Off"} />
            <Pill tone={c.paperTrading.effective ? "warn" : "off"} label="Paper trading" value={c.paperTrading.effective ? "Running" : "Off"} />
            <Pill tone={c.runtimeControls?.INTAKE_ENABLED ? "ok" : "warn"} label="Intake" value={c.runtimeControls ? (c.runtimeControls.INTAKE_ENABLED ? "On" : "Off") : "unreadable"} />
          </>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat title="Waiting for you" value={dec.loaded ? waiting.length : "—"} sub={waiting.length ? "Approve or reject in Telegram" : "Nothing needs a decision"} accent={waiting.length > 0} />
        <Stat title="Signals today" value={dec.loaded ? today.length : "—"} sub={dec.loaded ? `${decisions.length} recent in total` : undefined} />
        <Stat title="Intake" value={h?.outbox ? h.outbox.completed : "—"} sub={h?.outbox ? (h.outbox.deadLetter + h.outbox.pending + h.outbox.processing === 0 ? "all processed" : `${h.outbox.pending + h.outbox.processing} in flight · ${h.outbox.deadLetter} dead-lettered`) : undefined} tone={h?.outbox && h.outbox.deadLetter > 0 ? "down" : undefined} />
        <Stat title="System" value={h ? (allOk ? "Healthy" : "Degraded") : "—"} tone={h ? (allOk ? "up" : "down") : undefined} sub={h ? `backup ${ago(h.lastSuccessfulBackupAt ?? null)} · audit check ${ago(h.lastSuccessfulAuditVerificationAt ?? null)}` : undefined} />
      </div>

      <PaperStrip />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cn(card, "overflow-hidden")}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold text-ink">Latest signals</h2><Link href="/signals" className="inline-flex items-center gap-1 text-xs font-semibold text-royal-700 hover:underline">All signals <ArrowRight className="h-3 w-3" /></Link></div>
          {!dec.loaded ? <div className="p-5"><Skeleton h={140} /></div> : decisions.length === 0 ? <div className="p-5"><Empty title="No signals yet" hint="They appear after the Telegram intake parses a message and the risk gates run." /></div> : (
            <ul className="divide-y divide-slate-50">{decisions.slice(0, 6).map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{d.symbol}{d.instrumentType === "option" ? ` ${d.strike ?? ""} ${d.optionType ?? ""}` : ""} <span className="font-normal text-slate-400">{d.side ?? ""}</span></p><p className="truncate font-mono text-[11px] text-slate-400">entry {px(d.entryPrice)} · SL {px(d.stopLoss)}{d.plannedMaxLossAmount ? ` · risk ${inr(Number(d.plannedMaxLossAmount))}` : ""} · {ago(d.createdAt)}</p></div><Chip kind={d.effectiveStatus} /></li>))}</ul>
          )}
        </section>
        <section className={cn(card, "overflow-hidden")}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold text-ink">Recent activity</h2><Link href="/notifications" className="inline-flex items-center gap-1 text-xs font-semibold text-royal-700 hover:underline">Notifications <ArrowRight className="h-3 w-3" /></Link></div>
          {!notes.loaded ? <div className="p-5"><Skeleton h={140} /></div> : notes.loaded.data.length === 0 ? <div className="p-5"><Empty title="Quiet so far" hint="Approvals, paper trades, breaker events and safety changes show up here." /></div> : (
            <ul className="divide-y divide-slate-50">{notes.loaded.data.slice(0, 6).map((n) => (
              <li key={n.id} className="flex items-start gap-3 px-5 py-3"><span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", SEV[n.severity])} /><div className="min-w-0 flex-1"><p className="text-sm text-ink">{n.title}</p>{n.detail && <p className="truncate text-xs text-slate-400">{n.detail}</p>}</div><time className="shrink-0 text-xs text-slate-400" dateTime={n.at}>{ago(n.at)}</time></li>))}</ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Pill({ tone, label, value }: { tone: "ok" | "warn" | "bad" | "off"; label: string; value: string }) {
  return <span className="inline-flex items-center gap-2 text-sm"><Dot tone={tone} /><span className="text-slate-500">{label}</span><span className="font-semibold text-ink">{value}</span></span>;
}
