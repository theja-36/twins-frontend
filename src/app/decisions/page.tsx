"use client";
import Link from "next/link";
import React from "react";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Card, CardBody, CardHeader, DecisionBadge, PageHeader, RiskBadge, WorkflowBadge, Badge } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { Select } from "@/ds/controls";
import { DataTable } from "@/ds/table";
import { dateTime, money } from "@/lib/fmt";

export default function DecisionsPage() {
  const [outcome, setOutcome] = React.useState<string>("ALL"), [wf, setWf] = React.useState<string>("ALL");
  return (
    <>
      <PageHeader title="Decision Centre" description="Every decision with its outcome and its workflow state side by side. QUALIFIED is not APPROVED, and APPROVED is not EXECUTED." actions={<><Select label="Outcome" value={outcome} onChange={setOutcome} options={[{ value: "ALL", label: "All outcomes" }, ...["QUALIFIED", "WAIT", "REJECT", "EVALUATION_ONLY", "NO_TRADE"].map((v) => ({ value: v, label: v.replace("_", " ") }))]} /><Select label="Workflow" value={wf} onChange={setWf} options={[{ value: "ALL", label: "All states" }, ...["PENDING", "APPROVED", "REJECTED", "EXPIRED", "SUPERSEDED", "CANCELLED"].map((v) => ({ value: v, label: v }))]} /></>} />
      <Card label="Decisions"><CardHeader title="Decisions" subtitle="Per-user; permitted size comes from the backend and is never computed here" /><CardBody>
        <Data def={EP.decisions} what="decisions">{(ds) => { const rows = ds.filter((d) => (outcome === "ALL" || d.outcome === outcome) && (wf === "ALL" || d.workflowState === wf)); return <div className="space-y-3">
          {ds.some((d) => d.dataSource === "FIXTURE") && <Banner tone="warn" title="Fixture-backed decisions">Some decisions were made on fixture data and must not be treated as real opportunities.</Banner>}
          <DataTable label="Decisions" rows={rows} rowKey={(d) => d.id} filterText={(d) => d.subject} cols={[
            { key: "s", header: "Subject", render: (d) => <Link href={`/decisions/${d.id}`} className="font-medium hover:underline">{d.subject}</Link>, sort: (d) => d.subject },
            { key: "src", header: "Source", hideBelow: "sm", render: (d) => <Badge tone={d.candidateSource === "INDEPENDENT" ? "info" : "mute"}>{d.candidateSource}</Badge> },
            { key: "o", header: "Outcome", render: (d) => <DecisionBadge outcome={d.outcome} /> }, { key: "w", header: "Workflow", render: (d) => <WorkflowBadge state={d.workflowState} /> },
            { key: "r", header: "Risk", hideBelow: "sm", render: (d) => (d.risk ? <RiskBadge verdict={d.risk.verdict} /> : "—") },
            { key: "z", header: "Max loss at stop", align: "right", hideBelow: "md", render: (d) => (d.permittedSize ? money(d.permittedSize.maxLossAtStop) : "no size") },
            { key: "v", header: "Valid until", align: "right", hideBelow: "md", render: (d) => dateTime(d.validUntil), sort: (d) => d.validUntil }]} /></div>; }}</Data>
      </CardBody></Card>
    </>
  );
}
