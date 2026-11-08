"use client";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, Metric, MetricGrid, PageHeader } from "@/ds/primitives";
import { DataTable } from "@/ds/table";
import { Banner } from "@/ds/states";
import { ClaimTable } from "../claimTable";
import { ageText } from "@/lib/view";
import { count } from "@/lib/fmt";

export default function IntakePage() {
  return (
    <>
      <PageHeader title="Signal Intake" description="Messages as they arrive and what the parser made of them. A parsed claim is not a decision: it still needs research, stop-loss validation and risk checks." />
      <div className="space-y-4">
        <Banner tone="info" title="Claims are unverified">Every field below was parsed from a message. Nothing here is a recommendation or an approval.</Banner>
        <Card label="Queue"><CardHeader title="Intake queue" /><CardBody>
          <Data def={EP.intake} what="intake queue" rows={2}>{(i) => <div className="space-y-3"><MetricGrid cols={4}><Metric label="Total" value={count(i.total)} />{Object.entries(i.counts).slice(0, 3).map(([k, v]) => <Metric key={k} label={k.replaceAll("_", " ")} value={count(v)} />)}</MetricGrid>
            <p className="text-xs text-fg-muted">Oldest open item: {i.oldestOpenSeconds == null ? "none" : `${ageText(i.oldestOpenSeconds)} old`}</p>
            <DataTable label="Recent intake" dense rows={i.recent} rowKey={(r) => r.id} pageSize={8} cols={[{ key: "c", header: "Channel", render: (r) => <span className="num">{r.channel}</span> }, { key: "t", header: "Type", hideBelow: "sm", render: (r) => r.type }, { key: "s", header: "Status", render: (r) => <Badge tone={r.status === "completed" ? "ok" : r.status === "failed" ? "bad" : "info"}>{r.status}</Badge> }, { key: "a", header: "Attempts", align: "right", render: (r) => String(r.attempts) }]} /></div>}</Data>
        </CardBody></Card>
        <Card label="Claims"><CardHeader title="Parsed claims" subtitle="Newest first" /><CardBody>
          <Data def={EP.claims} what="claims" empty={<p className="text-sm text-fg-muted">No claims yet.</p>}>{(d) => <ClaimTable rows={d.claims} label="Parsed claims" />}</Data>
        </CardBody></Card>
      </div>
    </>
  );
}
