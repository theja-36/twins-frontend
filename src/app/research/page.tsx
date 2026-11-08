"use client";
import React from "react";
import { EP } from "@/api/registry";
import type { ResearchCase } from "@/api/contracts/types";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, Disclosure, KeyValue, PageHeader, ProvenanceBadge } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { ASSESSMENT_TEXT } from "@/lib/view";
import { dateTime } from "@/lib/fmt";

const VT: Record<string, "ok" | "warn" | "bad" | "mute" | "info"> = { SUPPORTIVE: "ok", NEUTRAL: "mute", CAUTION: "warn", ADVERSE: "bad", BLOCKING: "bad", INCOMPLETE: "warn" };
function Case({ c }: { c: ResearchCase }) {
  return (
    <Card label={c.subject}><CardHeader title={c.subject} subtitle={`${c.source === "TELEGRAM" ? "Telegram signal" : "Independent opportunity"} · package v${c.packageVersion} · ${dateTime(c.createdAt)}`} right={<Badge tone={c.halt ? "bad" : c.assessment === "RESEARCH_SUPPORTIVE" ? "ok" : "warn"}>{ASSESSMENT_TEXT[c.assessment] ?? c.assessment}</Badge>} /><CardBody className="space-y-3">
      <p className="text-xs text-fg-muted">Research progress: {c.progress.completed} of {c.progress.total} specialists completed. A research view is not a recommendation.</p>
      {c.halt && <Banner tone="bad" title="Research halted">{c.haltReason ?? "A blocking finding stopped this case."}</Banner>}
      {c.instrumentValidation.status !== "VERIFIED" && <Banner tone="warn" title={`Instrument ${c.instrumentValidation.status.toLowerCase()}`}>{c.instrumentValidation.detail}</Banner>}
      {c.missingRequired.length > 0 && <Banner tone="warn" title="Missing required input">{c.missingRequired.join(", ")}</Banner>}
      {c.contradictions.length > 0 && <div className="rounded-lg border border-line p-3 text-sm"><p className="label mb-1">Contradictions</p>{c.contradictions.map((x, i) => <p key={i}>{x.supportive.join(", ")} (supportive) vs {x.opposing.join(", ")} ({x.opposingVerdict.toLowerCase()})</p>)}</div>}
      {c.marketContext && <KeyValue cols={2} rows={[["Regime", c.marketContext.regime], ["Direction", c.marketContext.direction], ["Volatility", c.marketContext.volatility], ["Event risk", c.marketContext.eventRisk], ["Context data", <span key="s" className="flex gap-1"><ProvenanceBadge kind={c.marketContext.dataSource === "FIXTURE" ? "FIXTURE" : "LIVE"} />{c.marketContext.stale && <Badge tone="warn">stale</Badge>}</span>]]} />}
      <Disclosure title={`Specialist reports (${c.reports.length})`}><ul className="divide-y divide-line">{c.reports.map((r) => <li key={r.agentId} className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm"><div className="min-w-0"><span className="font-medium">{r.role}</span> <span className="text-fg-faint">v{r.agentVersion}</span><p className="text-fg-muted">{r.executionStatus === "COMPLETED" ? r.summary : `Did not run: ${r.executionStatus.toLowerCase()}`}</p>{r.riskFlags.length > 0 && <p className="text-xs text-warn">flags: {r.riskFlags.join(", ")}</p>}</div><Badge tone={r.executionStatus === "COMPLETED" ? VT[r.verdict] ?? "mute" : "warn"}>{r.executionStatus === "COMPLETED" ? r.verdict : "UNAVAILABLE"}</Badge></li>)}</ul></Disclosure>
      <p className="num text-2xs text-fg-faint">package sha256 {c.packageSha256}</p>
    </CardBody></Card>
  );
}
export default function ResearchPage() {
  return (
    <>
      <PageHeader title="Research Workspace" description="The research package behind each candidate: specialist verdicts, contradictions and what is missing. Telegram and independent cases are labelled separately." />
      <Data def={EP.research} what="research cases">{(cs) => <div className="space-y-4">{cs.map((c) => <Case key={`${c.candidateId}-${c.packageVersion}`} c={c} />)}</div>}</Data>
    </>
  );
}
