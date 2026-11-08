"use client";
import React from "react";
import { EP } from "@/api/registry";
import type { Opportunity } from "@/api/contracts/types";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, Disclosure, KeyValue, PageHeader, ProvenanceBadge } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { Drawer } from "@/ds/overlay";
import { DataTable } from "@/ds/table";
import { price, dateTime, duration } from "@/lib/fmt";

const ST = { NEW: "info", IN_RESEARCH: "info", READY_FOR_DECISION: "ok", EXPIRED: "mute", WITHDRAWN: "mute", INVALIDATED: "bad", SUPERSEDED: "mute" } as const;
export default function OpportunitiesPage() {
  const [sel, setSel] = React.useState<Opportunity | null>(null);
  return (
    <>
      <PageHeader title="Independent Opportunities" description="Candidates the platform found by scanning on its own. These are NOT Telegram signals and are never mixed into Telegram results." badges={<Badge tone="info" title="Source: independent scan engine">INDEPENDENT</Badge>} />
      <Banner tone="warn" title="Not yet stop-validated">Opportunities carry a proposed stop only. A stop-loss is validated, and a size permitted, only inside a decision.</Banner>
      <div className="mt-4"><Card label="Opportunities"><CardHeader title="Candidates" /><CardBody>
        <Data def={EP.opportunities} what="opportunities">{(rows) => <DataTable label="Opportunities" rows={rows} rowKey={(o) => o.id} onRow={setSel} filterText={(o) => `${o.underlying} ${o.setup} ${o.state}`} cols={[
          { key: "u", header: "Instrument", render: (o) => <span className="font-medium">{o.underlying} <span className="text-fg-faint">{o.exchange}</span></span>, sort: (o) => o.underlying },
          { key: "sd", header: "Side", render: (o) => o.side }, { key: "st", header: "Setup", hideBelow: "sm", render: (o) => o.setup }, { key: "e", header: "Entry", align: "right", render: (o) => price(o.entry) }, { key: "sl", header: "Proposed stop", align: "right", hideBelow: "sm", render: (o) => price(o.stopLoss) },
          { key: "r", header: "Rank", align: "right", render: (o) => String(o.rankScore), sort: (o) => o.rankScore }, { key: "s", header: "State", render: (o) => <Badge tone={ST[o.state]}>{o.state.replaceAll("_", " ")}</Badge> }]} />}</Data>
        <p className="mt-2 text-xs text-fg-faint">Select a row for the rank breakdown and missing evidence.</p>
      </CardBody></Card></div>
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.underlying} · ${sel.setup}` : "Opportunity"}>{sel && <div className="space-y-4">
        <div className="flex gap-2"><Badge tone={ST[sel.state]}>{sel.state.replaceAll("_", " ")}</Badge><ProvenanceBadge kind={sel.dataSource === "FIXTURE" ? "FIXTURE" : "LIVE"} /></div>
        <KeyValue rows={[["Entry", price(sel.entry)], ["Proposed stop", price(sel.stopLoss)], ["Targets", sel.targets.map((t) => price(t)).join(", ")], ["Invalidation", `${sel.invalidation.condition} (${sel.invalidation.breachWhen.toLowerCase()} ${price(sel.invalidation.price)})`], ["Timeframe", duration(sel.timeframeSeconds)], ["Expires", dateTime(sel.expiresAt)], ["Last validated", dateTime(sel.lastValidatedAt)], ["Scan slot", sel.scanSlot]]} />
        <Disclosure defaultOpen title={`Rank ${sel.rankScore}: factors`}><ul className="text-sm">{sel.rankFactors.map((f) => <li key={f.code} className="flex justify-between py-1"><span>{f.note}</span><span className="num">+{f.points}</span></li>)}</ul></Disclosure>
        {sel.missingEvidence.length > 0 && <Banner tone="warn" title="Missing evidence">{sel.missingEvidence.join(", ")}</Banner>}</div>}</Drawer>
    </>
  );
}
