"use client";
import React from "react";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Card, CardBody, CardHeader, PageHeader } from "@/ds/primitives";
import { DateRange, Select, rangeCutoff, type DateRangeKey } from "@/ds/controls";
import { ClaimTable } from "../claimTable";

export default function HistoryPage() {
  const [range, setRange] = React.useState<DateRangeKey>("30d"), [kind, setKind] = React.useState<"all" | "claim" | "ambiguous" | "unsupported">("all");
  return (
    <>
      <PageHeader title="Signal History" description="Past claims from Telegram, filterable by date and parse result." actions={<><Select label="Parse result" value={kind} onChange={setKind} options={[{ value: "all", label: "All results" }, { value: "claim", label: "Claims" }, { value: "ambiguous", label: "Ambiguous" }, { value: "unsupported", label: "Unsupported" }]} /><DateRange value={range} onChange={setRange} /></>} />
      <Card label="History"><CardHeader title="Claims" subtitle="Telegram-sourced only" /><CardBody>
        <Data def={EP.claims} what="claim history" empty={<p className="text-sm text-fg-muted">No claims in the history.</p>}>{(d) => { const cut = rangeCutoff(range); const rows = d.claims.filter((c) => (kind === "all" || c.resultKind === kind) && (cut === null || (c.receivedAt !== null && Date.parse(c.receivedAt) >= cut))); return <ClaimTable rows={rows} label="Claim history" />; }}</Data>
      </CardBody></Card>
    </>
  );
}
