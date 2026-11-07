"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLoaded } from "@/components/trading/hooks";
import { Chip, DataBanner, Empty, Skeleton, card } from "@/components/trading/ui";
import { EquityAreaChart } from "@/components/trading/charts";
import { SourceHealthWidget } from "@/components/trading/Widgets";
import { CalendarPanel, NewsPanel } from "@/components/trading/Panels";
import { CountUp, PulseDot, Sparkline } from "@/components/motion/Motion";
import { Pill, SampleBadge, Tip } from "@/components/motion/Controls";
import { ago, getApprovals, getDecisions, getOutcomes, getPaperSummary, getPositions } from "@/services/trading";
import { getSystemConfig } from "@/services/system";
import { currentDrawdownR, dayPnl, equityCurve, exposureBySymbol } from "@/lib/portfolio";
import { heroFigures, sparkPath } from "@/lib/cockpit";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const cfg = useLoaded(getSystemConfig, 60_000), sum = useLoaded(getPaperSummary, 15_000), pos = useLoaded(getPositions, 15_000), out = useLoaded(getOutcomes, 30_000);
  const dec = useLoaded(() => getDecisions(), 20_000), app = useLoaded(getApprovals, 20_000);
  const c = cfg.loaded?.data, s = sum.loaded?.data;
  const paperOn = c?.paperTrading.effective === true;
  const curve = React.useMemo(() => equityCurve(out.loaded?.data ?? []), [out.loaded]);
  const [metric, setMetric] = React.useState<"pnl" | "r">("pnl");
  const open = (pos.loaded?.data ?? []).filter((p) => p.state === "OPEN" || p.state === "PENDING_ENTRY");
  const day = pos.loaded && out.loaded ? dayPnl(out.loaded.data, pos.loaded.data, new Date()) : null;
  const hero = heroFigures(curve.map((p) => p.pnl), day);
  const decisions = (dec.loaded?.data ?? []).filter((d) => d.effectiveStatus !== "SUPERSEDED");
  const approved = new Map((app.loaded?.data ?? []).map((a) => [a.riskDecisionId, a.action]));
  const tone = (n: number | null | undefined): "up" | "down" | "flat" => (!n ? "flat" : n > 0 ? "up" : "down");
  const exp = exposureBySymbol(pos.loaded?.data ?? []);

  return (
    <div className="space-y-4">
      <DataBanner onRetry={() => { cfg.refresh(); sum.refresh(); pos.refresh(); }} />

      {/* Hero strip: big tabular figures */}
      <section className={cn(card, "grid grid-cols-2 items-stretch lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]")} aria-label="Portfolio hero">
        <HeroCell wide title="Paper P&L (total)" tip="Cumulative profit and loss of simulated closed trades. The API exposes no capital figure, so no portfolio value is shown.">
          <div className="flex items-end gap-4">
            <span className={cn("text-4xl font-semibold tracking-tight sm:text-[44px]", tone(hero.total) === "up" && "text-emerald-500", tone(hero.total) === "down" && "text-rose-500")}><CountUp value={hero.total} prefix="₹" className="font-mono tabular-nums" /></span>
            <Sparkline path={sparkPath(hero.spark, 140, 36)} tone={tone(hero.total)} width={140} height={36} label="Cumulative paper P&L, last closed trades" />
          </div>
          <p className="mt-1 text-xs text-slate-500">{paperOn ? `${s?.closedTrades ?? 0} closed trades` : "paper trading is off: nothing is simulated"}</p>
        </HeroCell>
        <HeroCell title="Day P&L"><span className={cn("text-3xl font-semibold tracking-tight", tone(day) === "up" && "text-emerald-500", tone(day) === "down" && "text-rose-500")}><CountUp value={day} prefix="₹" className="font-mono tabular-nums" /></span><p className="mt-1 text-xs text-slate-500">closed today plus open</p></HeroCell>
        <HeroCell title="Exposure"><span className="text-3xl font-semibold tracking-tight text-ink"><CountUp value={s ? s.exposure : null} prefix="₹" className="font-mono tabular-nums" /></span><p className="mt-1 text-xs text-slate-500">{s ? `${s.openPositions} open · ${s.pendingEntries} pending` : "—"}</p></HeroCell>
        <HeroCell title="Drawdown"><span className={cn("text-3xl font-semibold tracking-tight", currentDrawdownR(curve) > 0 ? "text-rose-500" : "text-ink")}><CountUp value={out.loaded ? currentDrawdownR(curve) : null} decimals={2} suffix=" R" className="font-mono tabular-nums" /></span><p className="mt-1 text-xs text-slate-500">from the closed-trade peak</p></HeroCell>
        <HeroCell wide title="Regime"><RegimeBadge /></HeroCell>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Centerpiece chart */}
        <section className={cn(card, "p-4 sm:p-5")} aria-label="Equity curve">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><h2 className="text-sm font-semibold text-ink">Paper equity curve</h2><p className="text-xs text-slate-500">cumulative, per closed trade</p></div>
            <div className="inline-flex rounded-md border border-slate-200/80 p-0.5 font-mono text-xs" role="group" aria-label="Metric">
              {(["pnl", "r"] as const).map((m) => <button key={m} type="button" aria-pressed={metric === m} onClick={() => setMetric(m)} className={cn("rounded px-2.5 py-1 transition-colors", metric === m ? "bg-slate-50 text-ink" : "text-slate-500 hover:text-ink")}>{m === "pnl" ? "₹ P&L" : "R"}</button>)}
            </div>
          </div>
          {!out.loaded ? <Skeleton h={360} /> : curve.length === 0 ? <div className="grid h-[360px] place-items-center"><Empty title="No closed paper trades yet" hint={paperOn ? "The curve draws itself as simulated trades close." : "Paper trading is off, so nothing is simulated and no curve exists."} /></div> : <EquityAreaChart curve={curve} height={360} metric={metric} />}
        </section>

        {/* Right rail: live decisions */}
        <section className={cn(card, "flex max-h-[470px] flex-col overflow-hidden xl:h-[470px]")} aria-label="Decisions feed">
          <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3"><h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><PulseDot tone={decisions.length ? "ok" : "off"} live={decisions.length > 0} label="decisions feed" />Decisions</h2><Link href="/decisions" className="inline-flex items-center gap-1 text-xs font-medium text-royal-600 hover:underline">All <ArrowRight className="h-3 w-3" /></Link></div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!dec.loaded ? <div className="p-4"><Skeleton h={160} /></div> : decisions.length === 0 ? <div className="p-4"><Empty title="No decisions yet" hint="They appear after a message becomes a claim and the risk gates run." /></div> : (
              <ul className="divide-y divide-slate-200/60">{decisions.slice(0, 30).map((d) => {
                const a = approved.get(d.id);
                return (<li key={d.id}><Link href={`/decision/${d.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal-500">
                  <span className="min-w-0"><span className="block truncate text-sm font-medium text-ink">{d.symbol}{d.instrumentType === "option" ? ` ${d.strike ?? ""} ${d.optionType ?? ""}` : ""}</span><span className="block truncate font-mono text-[11px] text-slate-500">{ago(d.createdAt)} · {d.reasonCode.replaceAll("_", " ").toLowerCase()}</span></span>
                  {a ? <Pill tone={a === "APPROVE" ? "ok" : "bad"}>{a === "APPROVE" ? "approved" : "rejected"}</Pill> : <Chip kind={d.effectiveStatus} />}</Link></li>);
              })}</ul>
            )}
          </div>
        </section>
      </div>

      {/* Bottom strip: exposure | sources | news | calendar */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className={cn(card, "p-4")} aria-label="Exposure by symbol">
          <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-semibold text-ink">Exposure</h2><Link href="/positions" className="text-xs font-medium text-royal-600 hover:underline">Portfolio</Link></div>
          {!pos.loaded ? <Skeleton h={90} /> : exp.length === 0 ? <p className="text-sm text-slate-500">{open.length === 0 ? (paperOn ? "No open positions." : "Paper trading is off.") : "—"}</p> : (
            <ul className="space-y-2">{exp.slice(0, 5).map((e) => <li key={e.symbol} className="text-xs"><div className="flex justify-between font-mono"><span className="text-ink">{e.symbol}</span><span className="text-slate-500">{e.share.toFixed(1)}%</span></div><div className="mt-1 h-1 rounded-full bg-slate-100"><div className="h-1 rounded-full bg-royal-500" style={{ width: `${Math.min(100, e.share)}%` }} /></div></li>)}</ul>
          )}
        </section>
        <SourceHealthWidget compact />
        <NewsPanel compact />
        <CalendarPanel compact />
      </div>
    </div>
  );
}

function HeroCell({ title, tip, wide = false, children }: { title: string; tip?: string; wide?: boolean; children: React.ReactNode }) {
  const body = <div className="px-4 py-3 sm:px-5 sm:py-4"><p className="mb-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-500">{title}</p>{children}</div>;
  return <div className={cn("min-w-0 border-b border-slate-200/80 lg:border-b-0", wide && "col-span-2 lg:col-span-1")}>{tip ? <Tip text={tip}>{body}</Tip> : body}</div>;
}

/** SAMPLE until the regime detector feeds a route. Labelled as such. */
function RegimeBadge() {
  return (
    <div className="space-y-1"><div className="flex items-center gap-2"><Pill tone="info">Range-bound</Pill><SampleBadge note="regime detector not connected" /></div><p className="text-xs text-slate-500">NIFTY · invented value</p></div>
  );
}

