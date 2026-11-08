"use client";
import React from "react";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Card, CardBody, CardHeader, EvidencePanel, PageHeader, ProvenanceBadge } from "@/ds/primitives";
import { Select } from "@/ds/controls";
import Link from "next/link";

export default function EvidencePage() {
  const [stance, setStance] = React.useState<"ALL" | "SUPPORTS" | "CONTRADICTS" | "NEUTRAL" | "MISSING">("ALL");
  return (
    <>
      <PageHeader title="Evidence Explorer" description="Every piece of evidence behind a research case or decision, with its stance, source, age and where it was used. Missing evidence is listed, not hidden." actions={<Select label="Stance" value={stance} onChange={setStance} options={[{ value: "ALL", label: "All stances" }, { value: "SUPPORTS", label: "Supports" }, { value: "CONTRADICTS", label: "Contradicts" }, { value: "NEUTRAL", label: "Neutral" }, { value: "MISSING", label: "Missing" }]} />} />
      <Card label="Evidence"><CardHeader title="Evidence records" /><CardBody>
        <Data def={EP.evidence} what="evidence">{(d) => { const rows = d.filter((e) => stance === "ALL" || e.stance === stance); return (
          <ul className="space-y-4">{rows.map((e) => <li key={e.id} className="space-y-1">
            <EvidencePanel items={[{ id: e.id, kind: e.kind, source: e.source, at: e.at, stance: e.stance, summary: e.summary, freshness: e.freshness, reliability: e.reliability }]} />
            <p className="flex flex-wrap items-center gap-2 pl-1 text-xs text-fg-muted"><ProvenanceBadge kind={e.dataSource === "FIXTURE" ? "FIXTURE" : "LIVE"} />Used by: {e.usedBy.map((u) => <Link key={u.id} className="text-accent underline" href={u.type === "DECISION" ? `/decisions/${u.id}` : "/research"}>{u.label}</Link>)}</p></li>)}
            {rows.length === 0 && <p className="text-sm text-fg-muted">No evidence with that stance.</p>}</ul>); }}</Data>
      </CardBody></Card>
    </>
  );
}
