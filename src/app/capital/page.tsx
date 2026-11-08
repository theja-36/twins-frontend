"use client";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, KeyValue, Metric, MetricGrid, PageHeader } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { DataTable } from "@/ds/table";
import { money, pct, dateTime } from "@/lib/fmt";

export default function CapitalPage() {
  return (
    <>
      <PageHeader title="Capital Management" description="The capital profile that sizing uses. It belongs to one account; capital is never pooled across users." />
      <Data def={EP.capital} what="capital profile">{(c) => (
        <div className="space-y-4">
          <Banner tone="info" title="Per-account capital">This profile is isolated to <b>{c.account}</b>. Nothing here is shared with, or visible to, other users.</Banner>
          <MetricGrid cols={4}><Metric label="Total capital" value={money(c.totalCapital, 0)} /><Metric label="Available" value={money(c.availableCapital, 0)} /><Metric label="Allocated" value={money(c.allocated, 0)} /><Metric label="Utilisation" value={pct(c.utilisationPct)} /></MetricGrid>
          <Card label="Limits"><CardHeader title="Sizing limits" subtitle={`Version ${c.version} · effective ${dateTime(c.effectiveFrom)}`} right={<Badge tone="mute">read-only</Badge>} /><CardBody><KeyValue cols={2} rows={[["Risk per trade", pct(c.riskPercent, 2)], ["Max risk per trade", money(c.maxRiskPerTrade)], ["Max daily loss", money(c.maxDailyLoss, 0)], ["Max lots", String(c.maxLots)], ["Min reward:risk", c.minRewardToRisk], ["Max concurrent", String(c.maxConcurrent)], ["Max position notional", pct(c.maxPositionNotionalPct, 0)], ["Allowed underlyings", c.allowedUnderlyings.join(", ")]]} /><p className="mt-2 text-xs text-fg-muted">Editing the profile is not offered: no authorised write contract exists. Size is always computed by the backend.</p></CardBody></Card>
          <Card label="History"><CardHeader title="Profile history" /><CardBody><DataTable label="Profile versions" dense rows={c.history} rowKey={(h) => String(h.version)} cols={[{ key: "v", header: "Version", render: (h) => `v${h.version}` }, { key: "f", header: "Effective", render: (h) => dateTime(h.effectiveFrom) }, { key: "c", header: "Capital", align: "right", render: (h) => money(h.totalCapital, 0) }, { key: "b", header: "By", hideBelow: "sm", render: (h) => h.createdBy }]} /></CardBody></Card>
        </div>)}</Data>
    </>
  );
}
