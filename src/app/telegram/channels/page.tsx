"use client";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, PageHeader } from "@/ds/primitives";
import { DataTable } from "@/ds/table";
import { ageText } from "@/lib/view";
import { count } from "@/lib/fmt";

export default function ChannelsPage() {
  return (
    <>
      <PageHeader title="Telegram Channels" description="Which channels the platform has heard from. Identifiers are masked and message text is never shown." />
      <Card label="Channels"><CardHeader title="Channels" subtitle="Telegram-sourced signals only; independent opportunities are a separate surface" /><CardBody>
        <Data def={EP.channels} what="channels" empty={<p className="text-sm text-fg-muted">No channel has sent a message yet.</p>}>{(d) => (
          <DataTable label="Channels" rows={d.channels} rowKey={(c) => c.id} filterText={(c) => `${c.channel} ${c.name ?? ""}`} cols={[
            { key: "n", header: "Channel", render: (c) => <span><span className="font-medium">{c.name ?? "Unnamed"}</span> <span className="num text-fg-faint">{c.channel}</span></span>, sort: (c) => c.name ?? c.channel },
            { key: "m", header: "Messages", align: "right", render: (c) => count(c.messages), sort: (c) => c.messages },
            { key: "c", header: "Claims", align: "right", hideBelow: "sm", render: (c) => `${c.claims.claim} / ${c.claims.ambiguous} / ${c.claims.unsupported}`, },
            { key: "l", header: "Last message", align: "right", render: (c) => (c.lastMessageAgeSeconds == null ? "—" : `${ageText(c.lastMessageAgeSeconds)} ago`), sort: (c) => c.lastMessageAgeSeconds },
            { key: "cap", header: "Capture", render: (c) => (c.captureAllowed === null ? <Badge tone="warn">unknown</Badge> : c.captureAllowed ? <Badge tone="ok">allowed</Badge> : <Badge tone="bad">not allowed</Badge>) }]} />)}</Data>
        <p className="mt-2 text-xs text-fg-faint">Claims column: complete / ambiguous / unsupported.</p>
      </CardBody></Card>
    </>
  );
}
