"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLoaded } from "@/components/trading/hooks";
import { Chip, DataBanner, Dot, Empty, PageHeader, Skeleton, SourceBadge, card } from "@/components/trading/ui";
import { EquityAreaChart } from "@/components/trading/charts";
import { QuickActions, RegimeWidget, SourceHealthWidget } from "@/components/trading/Widgets";
import { CountUp, HoverLift, PulseDot, Stagger, StaggerItem } from "@/components/motion/Motion";
import { Pill, Tip } from "@/components/motion/Controls";
import { ago, getApprovals, getDecisions, getOutcomes, getPaperSummary, getPositions, inr, px } from "@/services/trading";
import { controlOf, getHealth, getSystemConfig } from "@/services/system";
import { currentDrawdownR, dayPnl, equityCurve } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

function Kpi({ title, value, decimals = 0, prefix = "", suffix = "", sub, tone, tip }: { title: string; value: number | null; decimals?: number; prefix?: string; suffix?: string; sub?: string; tone?: "up" | "down" | "flat"; tip?: string }) {
  const body = (
    <HoverLift className={cn(card, "h-full p-4 sm:p-5")}>
      <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">{title}</p>
      <p className={cn("mt-2 text-2xl font-semibold tracking-tight sm:text-[26px]", tone === "up" && "text-emerald-500", tone === "down" && "text-rose-500", (!tone || tone === "flat") && "text-ink")}><CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} className="font-mono tabular-nums" /></p>
      {sub ? <p className="mt-1.5 text-xs text-slate-500">{sub}</p> : null}
    </HoverLift>
  );
  return tip ? <Tip text={tip}>{body}</Tip> : body;
}

export default function DashboardPage() {
  const cfg = useLoaded(getSystemConfig, 60_000), health = useLoaded(getHealth, 20_000), sum = useLoaded(getPaperSummary, 15_000), pos = useLoaded(getPositions, 15_000), out = useLoaded(getOutcomes, 30_000);
  const dec = useLoaded(() => getDecisions(), 20_000), app = useLoaded(getApprovals, 20_000);
  const c = cfg.loaded?.data, h = health.loaded?.data, s = sum.loaded?.data;
  const paperOn = c?.paperTrading.effective === true;
  const curve = React.useMemo(() => equityCurve(out.loaded?.data ?? []), [out.loaded]);
  const open = (pos.loaded?.data ?? []).filter((p) => p.state === "OPEN" || p.state === "PENDING_ENTRY");
  const day = pos.loaded && out.loaded ? dayPnl(out.loaded.data, pos.loaded.data, new Date()) : null;
  const decisions = (dec.loaded?.data ?? []).filter((d) => d.effectiveStatus !== "SUPERSEDED");
  const approved = new Map((app.loaded?.data ?? []).map((a) => [a.riskDecisionId, a.action]));
  const kill = controlOf(c?.runtimeControls, "killSwitchActive"), intake = controlOf(c?.runtimeControls, "intakeEnabled");
  const tone = (n: number | null | undefined): "up" | "down" | "flat" => (!n ? "flat" : n > 0 ? "up" : "down");

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Where the system stands, what needs you, and whether it is safe." right={<SourceBadge loading={cfg.loading || sum.loading} />} />
      <DataBanner onRetry={() => { cfg.refresh(); sum.refresh(); pos.refresh(); }} />

      <section className={cn(card, "flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4")} aria-label="Safety posture">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">Safety</span>
        {!c ? <Skeleton h={20} /> : (<>
          <Flag tone="ok" label="Live trading" value="Locked" />
          <Flag tone={kill === undefined ? "warn" : kill ? "bad" : "ok"} label="Kill switch" value={kill === undefined ? "unreadable" : kill ? "ACTIVE" : "Clear"} />
          <Flag tone={c.agentEngine.enabled ? "warn" : "ok"} label="Agent engine" value={c.agentEngine.enabled ? "Enforcing" : c.agentEngine.shadow ? "Shadow" : "Off"} />
          <Flag tone={paperOn ? "warn" : "off"} label="Paper trading" value={paperOn ? "Running" : "Off"} />
          <Flag tone={intake === undefined ? "warn" : intake ? "ok" : "warn"} label="Intake" value={intake === undefined ? "unreadable" : intake ? "On" : "Off"} />
          <Flag tone={h ? (h.database?.ok && h.redis?.ok ? "ok" : "bad") : "off"} label="System" value={h ? (h.database?.ok && h.redis?.ok ? "Healthy" : "Degraded") : "—"} />
        </>)}
      </section>

      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StaggerItem><Kpi title="Paper P&L (total)" value={s ? s.totalPnl : null} prefix="₹" tone={tone(s?.totalPnl)} sub={paperOn ? `${s?.closedTrades ?? 0} closed` : "paper trading is off"} /></StaggerItem>
        <StaggerItem><Kpi title="Day P&L" value={day} prefix="₹" tone={tone(day)} sub={paperOn ? "closed today plus open" : "paper trading is off"} /></StaggerItem>
        <StaggerItem><Kpi title="Exposure" value={s ? s.exposure : null} prefix="₹" sub={s ? `${s.openPositions} open · ${s.pendingEntries} pending` : undefined} tip="Notional of open paper positions" /></StaggerItem>
        <StaggerItem><Kpi title="Drawdown" value={out.loaded ? currentDrawdownR(curve) : null} decimals={2} suffix=" R" tone={currentDrawdownR(curve) > 0 ? "down" : "flat"} sub="from the closed-trade peak" tip="Current distance below the best cumulative R so far" /></StaggerItem>
      </Stagger>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={cn(card, "p-5 lg:col-span-2")} aria-label="Equity curve">
          <div className="mb-2 flex items-center justify-between"><h2 className="text-base font-semibold text-ink">Paper equity curve</h2><span className="text-xs text-slate-500">cumulative P&L, closed trades</span></div>
          {!out.loaded ? <Skeleton h={220} /> : curve.length === 0 ? <Empty title="No closed paper trades yet" hint={paperOn ? "The curve draws itself as simulated trades close." : "Paper trading is off, so nothing is simulated and no curve exists."} /> : <EquityAreaChart curve={curve} />}
        </section>
        <SourceHealthWidget compact />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cn(card, "overflow-hidden")} aria-label="Open positions">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold text-ink">Open positions <span className="text-xs font-normal text-slate-400">paper</span></h2><Link href="/positions" className="inline-flex items-center gap-1 text-xs font-medium text-royal-600 hover:underline">Portfolio <ArrowRight className="h-3 w-3" /></Link></div>
          {!pos.loaded ? <div className="p-5"><Skeleton h={120} /></div> : open.length === 0 ? <div className="p-5"><Empty title="No open positions" hint={paperOn ? "Positions appear after you approve a trade in Telegram." : "Paper trading is off."} /></div> : (
            <ul className="divide-y divide-slate-50">{open.slice(0, 6).map((p) => (
              <li key={p.tradeId} className="flex items-center justify-between gap-3 px-5 py-3"><span className="flex items-center gap-3"><PulseDot tone={p.state === "OPEN" ? "ok" : "warn"} label={p.state.toLowerCase()} /><span><span className="block text-sm font-medium text-ink">{p.symbol} <Chip kind={p.side} /></span><span className="block font-mono text-xs text-slate-500">entry {px(p.fillPrice ?? p.entryPrice)} · stop {px(p.stop)}</span></span></span>
                <span className={cn("font-mono text-sm tabular-nums", p.unrealizedPnl > 0 ? "text-emerald-500" : p.unrealizedPnl < 0 ? "text-rose-500" : "text-slate-500")}>{inr(p.unrealizedPnl)}</span></li>))}</ul>
          )}
        </section>
        <section className={cn(card, "overflow-hidden")} aria-label="Recent decisions">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold text-ink">Recent decisions</h2><Link href="/decisions" className="inline-flex items-center gap-1 text-xs font-medium text-royal-600 hover:underline">All decisions <ArrowRight className="h-3 w-3" /></Link></div>
          {!dec.loaded ? <div className="p-5"><Skeleton h={120} /></div> : decisions.length === 0 ? <div className="p-5"><Empty title="No decisions yet" hint="They appear after a message becomes a claim and the risk gates run." /></div> : (
            <ul className="divide-y divide-slate-50">{decisions.slice(0, 6).map((d) => {
              const a = approved.get(d.id);
              return (<li key={d.id}><Link href={`/decision/${d.id}`} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal-500">
                <span className="min-w-0"><span className="block truncate text-sm font-medium text-ink">{d.symbol}{d.instrumentType === "option" ? ` ${d.strike ?? ""} ${d.optionType ?? ""}` : ""}</span><span className="block text-xs text-slate-500">{ago(d.createdAt)} · {d.reasonCode.replaceAll("_", " ").toLowerCase()}</span></span>
                {a ? <Pill tone={a === "APPROVE" ? "ok" : "bad"}>{a === "APPROVE" ? "approved" : "rejected"}</Pill> : <Chip kind={d.effectiveStatus} />}</Link></li>);
            })}</ul>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2"><RegimeWidget /><QuickActions /></div>
    </div>
  );
}

function Flag({ tone, label, value }: { tone: "ok" | "warn" | "bad" | "off"; label: string; value: string }) {
  return <span className="inline-flex items-center gap-2 text-sm"><Dot tone={tone} /><span className="text-slate-500">{label}</span><span className="font-semibold text-ink">{value}</span></span>;
}
