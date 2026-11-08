"use client";
import Link from "next/link";
import React from "react";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, KeyValue, PageHeader } from "@/ds/primitives";
import { Banner, EmptyState } from "@/ds/states";
import { claimTitle, stopQuality } from "@/lib/claims";
import { entryText, expiryText, blockerText } from "@/lib/channels";
import { istTime } from "@/lib/view";

export default function SignalDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return (
    <>
      <PageHeader title="Signal Details" description="One parsed claim and why it is (or is not) usable." actions={<Link href="/telegram/history" className="text-sm text-accent underline">Back to history</Link>} />
      <Data def={EP.claims} what="claim">{(d) => {
        const c = d.claims.find((x) => x.id === id);
        if (!c) return <EmptyState title="Claim not found">No claim with id <span className="num">{id}</span> is in the latest 100. It may be older, or the link may be wrong.</EmptyState>;
        const sq = stopQuality(c.claim);
        return <div className="space-y-4">
          <Banner tone="info" title="A parsed claim is not a decision">It is unverified content from a channel. It becomes a trade only after research, stop-loss validation, risk checks and your approval.</Banner>
          <Card label="Claim"><CardHeader title={claimTitle(c.claim)} subtitle={`Channel ${c.channel} · received ${istTime(c.receivedAt)}`} right={<Badge tone={c.resultKind === "claim" ? "ok" : "warn"}>{c.resultKind ?? "n/a"}</Badge>} /><CardBody>
            {c.claim ? <KeyValue cols={2} rows={[["Action", c.claim.action ?? "—"], ["Entry", entryText(c.claim.entry)], ["Stop-loss", c.claim.stopLoss == null ? "not stated" : String(c.claim.stopLoss)], ["Stop quality", <Badge key="q" tone={sq.level === "good" ? "ok" : sq.level === "poor" ? "bad" : "warn"} title={sq.detail}>{sq.label}</Badge>], ["Targets", c.claim.targets.length ? c.claim.targets.join(", ") : "none stated"], ["Expiry", expiryText(c.claim.expiry)], ["Level basis", `${c.claim.levelBasis ?? "unspecified"}${c.claim.levelBasisInferred ? " (inferred)" : ""}${c.claim.levelBasisConflict ? " — CONFLICT" : ""}`], ["Parser version", c.parserVersion]]} /> : <p className="text-sm text-fg-muted">No structured claim could be extracted.</p>}
          </CardBody></Card>
          <Card label="Blockers"><CardHeader title="What stops this being usable" subtitle={c.assessmentOutcome ? `Assessment: ${c.assessmentOutcome.replaceAll("_", " ").toLowerCase()}` : undefined} /><CardBody>
            {c.blockers.length === 0 ? <p className="text-sm text-fg-muted">No blockers recorded.</p> : <ul className="space-y-1.5">{c.blockers.map((b) => <li key={b.code} className="flex items-center gap-2 text-sm"><Badge tone={b.severity === "insufficient" ? "warn" : "bad"}>{b.severity}</Badge>{blockerText(b.code)}</li>)}</ul>}
          </CardBody></Card></div>;
      }}</Data>
    </>
  );
}
