"use client";
import Link from "next/link";
import React from "react";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, DecisionBadge, Disclosure, KeyValue, PageHeader, ProvenanceBadge, RiskBadge, Tabs, TabPanel, Timeline, WorkflowBadge } from "@/ds/primitives";
import { Banner, EmptyState, DisabledByDesign } from "@/ds/states";
import { money, price, pct, dateTime, ratioPct } from "@/lib/fmt";

type Tab = "why" | "size" | "stop" | "risk" | "life";
export default function DecisionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params), [tab, setTab] = React.useState<Tab>("why");
  return (
    <Data def={EP.decisions} what="decision">{(ds) => {
      const d = ds.find((x) => x.id === id);
      if (!d) return <EmptyState title="Decision not found">No decision with this id is visible to you.</EmptyState>;
      return <>
        <PageHeader title={d.subject} description={d.headline} badges={<><DecisionBadge outcome={d.outcome} /><WorkflowBadge state={d.workflowState} />{d.risk && <RiskBadge verdict={d.risk.verdict} />}<ProvenanceBadge kind={d.dataSource === "FIXTURE" ? "FIXTURE" : "LIVE"} /></>} actions={<Link href="/decisions" className="text-sm text-accent underline">All decisions</Link>} />
        <div className="space-y-4">
          <Banner tone="info" title="Outcome and workflow are separate">Outcome: <b>{d.outcome}</b> (what the engine concluded). Workflow: <b>{d.workflowState}</b> (where it is in human review). Nothing here has been executed.</Banner>
          {d.invalidated && <Banner tone="bad" title="Invalidated">Reason: {d.invalidated.reasonCode} at {dateTime(d.invalidated.at)}.</Banner>}
          <Tabs label="Decision sections" value={tab} onChange={setTab} tabs={[{ value: "why", label: "Why" }, { value: "size", label: "Size" }, { value: "stop", label: "Stop-loss" }, { value: "risk", label: "Risk" }, { value: "life", label: "Lifecycle" }]} />
          <TabPanel id="why" active={tab === "why"}><Card label="Reasoning"><CardBody className="grid gap-4 md:grid-cols-2">
            {([["Supporting", d.explanation.supporting], ["Missing", d.explanation.missing], ["Contradictory", d.explanation.contradictory], ["Risk restrictions", d.explanation.riskRestrictions], ["What would change this", d.whatWouldChange], ["Reassess when", d.explanation.reassess]] as const).map(([t, items]) => <div key={t}><p className="label mb-1">{t}</p>{items.length ? <ul className="list-disc space-y-1 pl-5 text-sm text-fg-muted">{items.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="text-sm text-fg-faint">None.</p>}</div>)}
            <div className="md:col-span-2 space-y-1"><p className="label">Reasons</p>{d.reasons.map((r) => <p key={r.code} className="text-sm"><Badge tone="mute">{r.category}</Badge> {r.detail}</p>)}{d.restrictions.map((r) => <p key={r.code} className="text-sm"><Badge tone="warn">RESTRICTION</Badge> {r.detail}</p>)}</div>
            <div className="md:col-span-2"><p className="label mb-1">Evidence</p><p className="text-sm text-fg-muted">{d.evidenceRefs.join(", ") || "none"} — <Link className="text-accent underline" href="/evidence">open the Evidence Explorer</Link></p></div>
            {d.confidence && <div className="md:col-span-2"><p className="label mb-1">Confidence (a strength score, not a probability)</p><p className="num text-sm">{d.confidence.score}/100 · {d.confidence.band} · <Badge tone="warn">{d.confidence.calibrationStatus}</Badge> · completeness {ratioPct(d.confidence.completeness, 0)}</p><p className="text-xs text-fg-muted">{d.confidence.caps.join("; ")}</p></div>}
          </CardBody></Card></TabPanel>
          <TabPanel id="size" active={tab === "size"}><Card label="Permitted size"><CardHeader title="Permitted size" subtitle="Computed by the backend. The app displays it and never recalculates it." /><CardBody>
            {d.permittedSize ? <KeyValue cols={2} rows={[["Lots", String(d.permittedSize.lots)], ["Quantity", String(d.permittedSize.quantity)], ["Max loss at stop", money(d.permittedSize.maxLossAtStop)], ["Risk per lot", money(d.permittedSize.riskPerLot)], ["Gross exposure", money(d.permittedSize.grossExposure)], ["Size multiplier", String(d.permittedSize.sizeMultiplier)], ["Binding limit", d.permittedSize.binding]]} /> : <p className="text-sm text-fg-muted">No size is permitted for this decision.</p>}
            {d.simulationId && <p className="mt-3 text-sm"><Link className="text-accent underline" href="/simulator">View the stored what-if estimate</Link></p>}
          </CardBody></Card></TabPanel>
          <TabPanel id="stop" active={tab === "stop"}><Card label="Stop-loss"><CardBody><KeyValue cols={2} rows={[["Validation", <Badge key="v" tone={d.stopLoss.validation.result === "VALID" ? "ok" : "bad"}>{d.stopLoss.validation.result}</Badge>], ["Rule version", d.stopLoss.validation.ruleVersion], ["Stop level", price(d.stopLoss.level)], ["Risk vs entry", pct(d.stopLoss.validation.riskPct)], ["Targets", d.stopLoss.targets.map((t) => price(t)).join(", ") || "—"], ["Reason", d.stopLoss.validation.reasonCode ?? "—"]]} /><p className="mt-2 text-xs text-fg-muted">A QUALIFIED decision requires a VALID mandatory stop-loss.</p></CardBody></Card></TabPanel>
          <TabPanel id="risk" active={tab === "risk"}><Card label="Risk"><CardBody>{d.risk ? <><p className="mb-2 text-sm">Verdict <RiskBadge verdict={d.risk.verdict} /> · policy v{d.risk.policyVersion}</p><ul className="space-y-2">{d.risk.reasons.map((r) => <li key={r.code} className="text-sm"><Badge tone={r.severity === "BLOCK" ? "bad" : r.severity === "RESTRICT" ? "warn" : "mute"}>{r.severity}</Badge> {r.detail}{r.correctiveAction && <span className="text-fg-muted"> — To fix: {r.correctiveAction}</span>}</li>)}{d.risk.reasons.length === 0 && <li className="text-sm text-fg-muted">No restrictions or blocks.</li>}</ul></> : <p className="text-sm text-fg-muted">Risk was not assessed.</p>}</CardBody></Card></TabPanel>
          <TabPanel id="life" active={tab === "life"}><Card label="Lifecycle"><CardBody className="space-y-3"><Timeline label="Decision lifecycle" items={d.lifecycle.map((l) => ({ at: l.at, title: `${l.from ?? "—"} → ${l.to}`, detail: `${l.actor}${l.reason ? ` · ${l.reason}` : ""}` }))} /><Disclosure title="Versions in force"><KeyValue rows={Object.entries(d.versions)} /></Disclosure><p className="text-xs text-fg-faint">Valid {dateTime(d.validFrom)} → {dateTime(d.validUntil)}</p></CardBody></Card></TabPanel>
          <DisabledByDesign title="Approval is not offered on this screen">Approval needs an authenticated user and a published approval contract. Neither exists yet; see the Approval Centre.</DisabledByDesign>
        </div></>;
    }}</Data>
  );
}
