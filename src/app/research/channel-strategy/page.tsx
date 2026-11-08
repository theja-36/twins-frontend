"use client";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, PageHeader } from "@/ds/primitives";
import { DataTable } from "@/ds/table";
import { ratioPct } from "@/lib/fmt";
import { ReliabilityBadge } from "@/ds/Reliability";

export default function ChannelStrategyPage() {
  return (
    <>
      <PageHeader title="Channel Strategy Intelligence" description="Patterns observed per Telegram channel, with sample size and reliability. Small samples are shown as insufficient, never as a verdict." />
      <Data def={EP.channelStrategy} what="channel strategy">{(chs) => <div className="space-y-4">{chs.map((c) => (
        <Card key={c.channelId} label={c.channelLabel}><CardHeader title={c.channelLabel} subtitle={`${c.sample} outcomes`} right={<ReliabilityBadge r={c.reliability} />} /><CardBody className="space-y-3">
          <DataTable label={`${c.channelLabel} patterns`} dense rows={c.patterns} rowKey={(p) => p.pattern} cols={[{ key: "p", header: "Pattern", render: (p) => p.pattern }, { key: "n", header: "Sample", align: "right", render: (p) => String(p.n) }, { key: "w", header: "Win rate", align: "right", render: (p) => ratioPct(p.winRate) }, { key: "r", header: "Reliability", render: (p) => <ReliabilityBadge r={p.reliability} /> }]} />
          <p className="text-sm"><Badge tone={c.drift.status === "DRIFT" || c.drift.status === "DEGRADATION" ? "warn" : "mute"}>drift: {c.drift.status.replaceAll("_", " ").toLowerCase()}</Badge> <span className="text-fg-muted">{c.drift.note}</span></p>
        </CardBody></Card>))}</div>}</Data>
    </>
  );
}
