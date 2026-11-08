"use client";
import { EP, epIntel } from "@/api/registry";
import { useEndpoint } from "@/api/query";
import { Data, DataView } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, KeyValue, PageHeader } from "@/ds/primitives";
import { Banner } from "@/ds/states";

function Perf({ id }: { id: string }) {
  const q = useEndpoint(epIntel.performance(id));
  return <DataView q={q} what="channel performance" rows={2}>{(d) => <div className="space-y-2">
    <KeyValue cols={2} rows={[["Claims", String(d.funnel.claims.claim)], ["Ambiguous", String(d.funnel.claims.ambiguous)], ["Unsupported", String(d.funnel.claims.unsupported)], ["Candidates", Object.entries(d.funnel.candidates).map(([k, v]) => `${k.toLowerCase()} ${v}`).join(", ") || "none"]]} />
    <p className="text-sm"><Badge tone="mute">outcomes: not available</Badge> <span className="text-fg-muted">{d.outcomes.reason}</span></p>
    <p className="text-xs text-fg-faint">{d.archive.note}</p></div>}</DataView>;
}
export default function ChannelStrategyPage() {
  return (
    <>
      <PageHeader title="Channel Strategy Intelligence" description="What each Telegram channel claimed and what the pipeline did with it. Reliability needs resolved real outcomes and is not available yet; counts are never shown as a verdict." />
      <Banner tone="info" title="Counts, not quality">Win rates and reliability are not shown: no resolved real outcome is linked to a live channel.</Banner>
      <div className="mt-4"><Data def={EP.intelChannels} what="channels">{(d) => <div className="space-y-4">{d.channels.map((c) => (
        <Card key={c.id} label={`Channel ${c.channel}`}><CardHeader title={`Channel ${c.channel}`} subtitle={`${c.messages} messages · health ${c.health.status.toLowerCase()}`} right={<Badge tone="mute">reliability: not available</Badge>} /><CardBody><Perf id={c.id} /></CardBody></Card>))}</div>}</Data></div>
    </>
  );
}
