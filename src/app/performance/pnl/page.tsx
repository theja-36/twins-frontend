"use client";
import React from "react";
import { EP } from "@/api/registry";
import type { PerfMetrics } from "@/api/contracts/types";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, Metric, MetricGrid, PageHeader, ProvenanceBadge, Tabs, TabPanel } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { ChartCard, LineArea } from "@/ds/charts";
import { DataTable } from "@/ds/table";
import { ReliabilityBadge } from "@/ds/Reliability";
import { signedMoney, pnlTone, ratioPct, count, money } from "@/lib/fmt";

function Figures({ m, label }: { m: PerfMetrics; label: string }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-medium">{label}</span><ReliabilityBadge r={m.reliability} /><span className="text-fg-muted">{m.eligible} closed paper outcomes</span></div>
      {m.eligible === 0 ? <p className="text-sm text-fg-muted">No closed outcomes in this set, so no figures are shown.</p> : <MetricGrid cols={4}>
        <Metric label="Net P&L (realised)" value={signedMoney(m.netPnl)} tone={pnlTone(m.netPnl)} hint="After costs; closed trades only" /><Metric label="Win rate" value={ratioPct(m.winRate.value)} sub={m.winRate.interval ? `95% interval ${ratioPct(m.winRate.interval.lower, 0)}–${ratioPct(m.winRate.interval.upper, 0)}` : "interval n/a"} hint={m.winRate.definition} />
        <Metric label="Expectancy (R)" value={m.expectancyR.value === null ? "—" : m.expectancyR.value.toFixed(2)} sub={m.expectancyR.interval95 ? `95%: ${m.expectancyR.interval95.lower.toFixed(1)} to ${m.expectancyR.interval95.upper.toFixed(1)}` : undefined} hint={m.expectancyR.definition} /><Metric label="Profit factor" value={m.profitFactor.value === null ? "—" : m.profitFactor.value.toFixed(2)} hint={m.profitFactor.definition} />
        <Metric label="Gross P&L" value={signedMoney(m.grossPnl)} /><Metric label="Costs" value={money(m.costs)} /><Metric label="Max drawdown" value={money(m.maxDrawdown.value)} sub={m.maxDrawdown.basis} /><Metric label="Sample" value={count(m.eligible)} tone={m.status === "SUFFICIENT" ? "mute" : "warn"} sub={m.status === "SUFFICIENT" ? undefined : "insufficient for conclusions"} /></MetricGrid>}
    </div>
  );
}
export default function PnlPage() {
  const [tab, setTab] = React.useState<"validated" | "fixture" | "all">("validated");
  return (
    <>
      <PageHeader title="P&L & Analytics" description="Realised paper P&L and its statistics. Validated and fixture-backed results are never blended." badges={<ProvenanceBadge kind="PAPER" />} />
      <div className="space-y-4">
        <Card label="Today"><CardHeader title="Paper account summary (served today)" subtitle="Realised and unrealised are separate" /><CardBody>
          <Data def={EP.paperSummary} what="paper summary" rows={2}>{(s) => <MetricGrid cols={4}><Metric label="Realised" value={signedMoney(String(s.realizedPnl))} tone={pnlTone(String(s.realizedPnl))} /><Metric label="Unrealised" value={signedMoney(String(s.unrealizedPnl))} tone={pnlTone(String(s.unrealizedPnl))} hint="Changes with price" /><Metric label="Closed trades" value={count(s.closedTrades)} /><Metric label="Open" value={count(s.openPositions)} /></MetricGrid>}</Data>
        </CardBody></Card>
        <Data def={EP.aOverview} what="analytics overview">{(a) => (<>
          <Banner tone="warn" title="Paper analytics · fixture data is not validated">{a.notice}</Banner>
          <Tabs label="Result set" value={tab} onChange={setTab} tabs={[{ value: "validated", label: "Validated" }, { value: "fixture", label: "Fixture (not validated)" }, { value: "all", label: "All (mixed)" }]} />
          <TabPanel id="validated" active={tab === "validated"}><Card label="Validated"><CardBody><Figures m={a.data.validatedOnly} label="Validated outcomes only" /></CardBody></Card></TabPanel>
          <TabPanel id="fixture" active={tab === "fixture"}><Card label="Fixture"><CardBody><Figures m={a.data.fixtureOnly} label="Fixture-backed outcomes" /></CardBody></Card></TabPanel>
          <TabPanel id="all" active={tab === "all"}><Card label="All"><CardBody><Figures m={a.data.all} label="All outcomes (includes fixture data)" /></CardBody></Card></TabPanel>
          <ChartCard title="Cumulative net P&L" subtitle="Closed paper trades · fixture-backed" summary={`Cumulative net P&L over ${a.data.equity.length} points`} table={{ headers: ["Date", "Cumulative net"], rows: a.data.equity.map((e) => [new Date(e.at).toLocaleDateString("en-IN"), signedMoney(e.cumulativeNet)]) }}>
            <LineArea data={a.data.equity.map((e) => ({ d: new Date(e.at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), v: Number(e.cumulativeNet) }))} xKey="d" yKey="v" /></ChartCard>
        </>)}</Data>
        <Data def={EP.aStrategies} what="strategy breakdown" rows={3}>{(s) => (
          <Card label="Breakdown"><CardHeader title="By strategy and instrument" subtitle="Each row carries its own sample and reliability" /><CardBody><DataTable label="Breakdown" dense rows={[...s.data.byStrategy.map((x) => ({ ...x, g: "Strategy" })), ...s.data.byInstrument.map((x) => ({ ...x, g: "Instrument" })), ...s.data.byExitReason.map((x) => ({ ...x, g: "Exit reason" }))]} rowKey={(r) => r.g + r.key} cols={[{ key: "g", header: "Group", render: (r) => r.g }, { key: "k", header: "Key", render: (r) => r.key }, { key: "n", header: "n", align: "right", render: (r) => String(r.metrics.eligible) }, { key: "p", header: "Net P&L", align: "right", render: (r) => signedMoney(r.metrics.netPnl) }, { key: "r", header: "Reliability", render: (r) => <ReliabilityBadge r={r.metrics.reliability} /> }]} /></CardBody></Card>)}</Data>
        <Card label="Closed trades"><CardHeader title="Closed trades (served today)" /><CardBody>
          <Data def={EP.paperOutcomes} what="closed trades" empty={<p className="text-sm text-fg-muted">No closed trades.</p>}>{(os) => <DataTable label="Closed trades" dense rows={os} rowKey={(o) => o.tradeId} cols={[{ key: "s", header: "Symbol", render: (o) => o.symbol }, { key: "o", header: "Outcome", render: (o) => <Badge tone={o.outcome === "WIN" ? "ok" : o.outcome === "LOSS" ? "bad" : "mute"}>{o.outcome}</Badge> }, { key: "p", header: "P&L", align: "right", render: (o) => signedMoney(String(o.pnl)) }, { key: "r", header: "R", align: "right", render: (o) => o.rMultiple.toFixed(2) }]} />}</Data>
        </CardBody></Card>
      </div>
    </>
  );
}
