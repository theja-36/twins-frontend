"use client";
import Link from "next/link";
import React from "react";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, DecisionBadge, Metric, MetricGrid, PageHeader, WorkflowBadge, ProvenanceBadge } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { sessionAt, formatCountdown } from "@/lib/marketHours";
import { money, signedMoney, pnlTone, ratioPct, count } from "@/lib/fmt";
import { safetyFlags } from "@/lib/cockpit";

function Safety() {
  return (
    <Data def={EP.systemConfig} what="safety state" rows={2}>{(c) => {
      const rc = c.runtimeControls, flags = safetyFlags({ paperEffective: c.paperTrading.effective, engineEnabled: !!c.agentEngine.enabled, engineShadow: !!c.agentEngine.shadow, kill: rc?.killSwitchActive, intake: rc?.intakeEnabled });
      return <div className="flex flex-wrap gap-2">{flags.map((f) => <Badge key={f.key} tone={f.tone === "off" ? "mute" : f.tone} title={f.label}>{f.label}: {f.value}</Badge>)}</div>;
    }}</Data>
  );
}
export default function Dashboard() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t); }, []);
  const ses = now ? sessionAt(now) : null;
  return (
    <>
      <PageHeader title="Dashboard" description="What needs attention now. Each panel loads on its own, so one failing source never hides the rest." badges={<ProvenanceBadge kind="PAPER" />} />
      <div className="space-y-4">
        <Card label="Safety"><CardHeader title="Safety posture" subtitle="Read from the backend; an unreadable value is shown as unreadable, never assumed safe" /><CardBody><Safety /></CardBody></Card>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card label="Market session"><CardHeader title="Market session" subtitle="NSE · IST" /><CardBody>{ses ? <><div className="text-lg font-semibold">{ses.label}</div><p className="num mt-1 text-xs text-fg-faint">{ses.nextLabel} in {formatCountdown(ses.secondsToChange)}</p></> : <p className="text-sm text-fg-muted">…</p>}<Link href="/market" className="mt-2 inline-block text-sm text-accent underline">Market overview</Link></CardBody></Card>
          <Card label="Paper P&L"><CardHeader title="Paper P&L" subtitle="Realised and unrealised are separate" /><CardBody>
            <Data def={EP.paperSummary} what="paper summary" rows={2}>{(s) => <MetricGrid cols={2}><Metric label="Realised" value={signedMoney(String(s.realizedPnl))} tone={pnlTone(String(s.realizedPnl))} hint="Booked on closed paper trades" /><Metric label="Unrealised" value={signedMoney(String(s.unrealizedPnl))} tone={pnlTone(String(s.unrealizedPnl))} hint="Mark-to-market on open paper positions; may change" /><Metric label="Open positions" value={count(s.openPositions)} /><Metric label="Exposure" value={money(String(s.exposure), 0)} /></MetricGrid>}</Data>
          </CardBody></Card>
          <Card label="Intake"><CardHeader title="Telegram intake" /><CardBody>
            <Data def={EP.intake} what="intake status" rows={2}>{(i) => <MetricGrid cols={2}><Metric label="Total received" value={count(i.total)} /><Metric label="Open" value={count((i.counts["received"] ?? 0) + (i.counts["processing"] ?? 0))} hint="Not yet processed" /></MetricGrid>}</Data>
          </CardBody></Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card label="Decisions"><CardHeader title="Latest decisions" subtitle="Outcome and workflow state are separate" right={<Link href="/decisions" className="text-sm text-accent underline">Decision Centre</Link>} /><CardBody>
            <Data def={EP.decisions} what="decisions" rows={3}>{(ds) => <ul className="divide-y divide-line">{ds.slice(0, 5).map((d) => <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><Link href={`/decisions/${d.id}`} className="font-medium hover:underline">{d.subject}</Link><span className="flex gap-1.5"><DecisionBadge outcome={d.outcome} /><WorkflowBadge state={d.workflowState} /></span></li>)}</ul>}</Data>
          </CardBody></Card>
          <Card label="Performance"><CardHeader title="Paper performance" subtitle="Analytics contract · paper only" right={<Link href="/performance/pnl" className="text-sm text-accent underline">P&L &amp; analytics</Link>} /><CardBody>
            <Data def={EP.aOverview} what="analytics" rows={3}>{(a) => { const v = a.data.validatedOnly, f = a.data.fixtureOnly; return <div className="space-y-3"><Banner tone="info" title={a.notice.split(".")[0] ?? "Paper only"}>{a.notice}</Banner><MetricGrid cols={2}><Metric label="Validated outcomes" value={count(v.eligible)} hint="Excludes fixture-backed data" sub={v.eligible === 0 ? "none yet" : undefined} /><Metric label="Fixture outcomes" value={count(f.eligible)} sub="NOT_VALIDATED_FIXTURE" tone="warn" /><Metric label="Win rate (validated)" value={ratioPct(v.winRate.value)} sub={`n=${v.winRate.n}`} /><Metric label="Net P&L (validated)" value={signedMoney(v.netPnl)} tone={pnlTone(v.netPnl)} /></MetricGrid></div>; }}</Data>
          </CardBody></Card>
        </div>
      </div>
    </>
  );
}
