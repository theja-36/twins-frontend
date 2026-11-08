"use client";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, Metric, MetricGrid, PageHeader, RiskBadge } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { DataTable } from "@/ds/table";
import { money, dateTime } from "@/lib/fmt";

export default function RiskPage() {
  return (
    <>
      <PageHeader title="Risk Dashboard" description="Limits, usage and what is blocked. PASS, RESTRICTED and BLOCKED are different: RESTRICTED allows a reduced size, BLOCKED allows none." />
      <Data def={EP.riskOverview} what="risk overview">{(r) => (
        <div className="space-y-4">
          {r.killSwitch.active === null ? <Banner tone="warn" title="Kill switch unreadable">The kill-switch state could not be read, so it is not assumed clear.</Banner> : r.killSwitch.active ? <Banner tone="bad" title="KILL SWITCH ACTIVE">New entries are halted.</Banner> : null}
          <MetricGrid cols={4}>
            <Metric label="PASS" value={String(r.verdictCounts.PASS)} tone="ok" /><Metric label="RESTRICTED" value={String(r.verdictCounts.RESTRICTED)} tone="warn" /><Metric label="BLOCKED" value={String(r.verdictCounts.BLOCKED)} tone="bad" />
            <Metric label="Drawdown" value={r.drawdown.levelPct ? `${r.drawdown.levelPct}%` : "—"} sub={r.drawdown.status.replaceAll("_", " ").toLowerCase()} tone={r.drawdown.status === "NORMAL" ? "ok" : "warn"} />
          </MetricGrid>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card label="Daily loss"><CardHeader title="Daily loss budget" /><CardBody><p className="num text-lg">{money(r.dailyLoss.used)} <span className="text-sm text-fg-muted">of {money(r.dailyLoss.limit)}</span></p></CardBody></Card>
            <Card label="Exposure"><CardHeader title="Exposure" /><CardBody className="space-y-2 text-sm"><p className="num">Gross {money(r.exposure.gross)} · {r.exposure.openPositions}/{r.exposure.maxConcurrent} positions</p>{r.exposure.correlatedGroups.map((g) => <p key={g.group} className="num text-fg-muted">{g.group}: risk {money(g.risk)} of {money(g.limit)}</p>)}</CardBody></Card>
          </div>
          <Card label="Limits"><CardHeader title="Active limits" subtitle={`As of ${dateTime(r.asOf)} · ${r.account}`} /><CardBody><DataTable label="Limits" dense rows={r.limits} rowKey={(l) => l.name} cols={[{ key: "n", header: "Limit", render: (l) => l.name }, { key: "v", header: "Value", align: "right", render: (l) => l.value }]} /></CardBody></Card>
          <Card label="Controls"><CardHeader title="Active controls and blocks" /><CardBody className="space-y-2 text-sm">
            {r.activeControls.length === 0 && r.blocked.length === 0 && <p className="text-fg-muted">None.</p>}
            {r.activeControls.map((c) => <p key={c.scope + c.key}><Badge tone="warn">{c.kind}</Badge> {c.scope}{c.key ? ` ${c.key}` : ""}: {c.reason} <span className="text-fg-faint">since {dateTime(c.setAt)}</span></p>)}
            {r.blocked.map((b) => <p key={b.subject}><RiskBadge verdict="BLOCKED" /> {b.subject}: {b.detail}</p>)}</CardBody></Card>
          {r.dataQuality.length > 0 && <Banner tone="warn" title="Data-quality warnings">{r.dataQuality.map((q) => q.detail).join(" ")}</Banner>}
        </div>)}</Data>
    </>
  );
}
