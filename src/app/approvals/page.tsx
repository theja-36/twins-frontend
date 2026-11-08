"use client";
import Link from "next/link";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, PageHeader, RiskBadge, DecisionBadge } from "@/ds/primitives";
import { Banner, DisabledByDesign } from "@/ds/states";
import { DataTable } from "@/ds/table";
import { dateTime, money } from "@/lib/fmt";
import { BOT_LINK } from "@/lib/botLink";

export default function ApprovalsPage() {
  return (
    <>
      <PageHeader title="Approval Centre" description="Decisions waiting for a human, with the revalidation that must pass first. Approve and reject controls appear only when the backend publishes an authorised contract." />
      <Data def={EP.approvals} what="approvals">{(a) => (
        <div className="space-y-4">
          <DisabledByDesign title="No approve / reject controls">Approving needs an authenticated user and a published approval contract. Neither exists yet, so this screen is read-only. Approvals continue in the Telegram bot.{BOT_LINK ? <> <a href={BOT_LINK} target="_blank" rel="noopener noreferrer" className="text-accent underline">Open the approval bot</a> (opens the bot, not a specific decision).</> : <> The bot link is not configured (NEXT_PUBLIC_TWINS_APPROVAL_BOT_URL must be exactly https://t.me/&lt;bot&gt;).</>}</DisabledByDesign>
          <Card label="Pending"><CardHeader title={`Pending (${a.pending.length})`} /><CardBody className="space-y-3">
            {a.pending.length === 0 && <p className="text-sm text-fg-muted">Nothing is waiting.</p>}
            {a.pending.map((p) => <div key={p.decisionId} className="rounded-lg border border-line p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><Link className="font-medium hover:underline" href={`/decisions/${p.decisionId}`}>{p.subject}</Link><span className="flex gap-1.5"><DecisionBadge outcome={p.outcome} /><RiskBadge verdict={p.riskVerdict} /></span></div>
              <p className="num mt-1 text-xs text-fg-muted">{p.permittedLots} lots · max loss {money(p.maxLoss)} · valid until {dateTime(p.validUntil)}</p>
              <p className="mt-2 flex items-center gap-2"><Badge tone={p.revalidation.passed ? "ok" : "bad"}>revalidation {p.revalidation.passed ? "passed" : "FAILED"}</Badge><span className="text-xs text-fg-faint">{dateTime(p.revalidation.at)}</span></p>
              <ul className="mt-1 text-xs text-fg-muted">{p.revalidation.checks.map((c) => <li key={c.name}>{c.ok ? "✓" : "✗"} {c.name}: {c.detail}</li>)}</ul>
              <p className="mt-2 text-xs text-warn">{p.action.reason}</p></div>)}
          </CardBody></Card>
          <Card label="History"><CardHeader title="Approval history" /><CardBody><DataTable label="Approval history" dense rows={a.history} rowKey={(h) => h.decisionId + h.at} empty="No approvals yet." cols={[{ key: "s", header: "Subject", render: (h) => h.subject }, { key: "a", header: "Action", render: (h) => <Badge tone={h.action === "APPROVE" ? "ok" : "bad"}>{h.action}</Badge> }, { key: "t", header: "When", render: (h) => dateTime(h.at) }, { key: "r", header: "Revalidated", hideBelow: "sm", render: (h) => (h.revalidationPassed ? "yes" : "no") }]} /></CardBody></Card>
        </div>)}</Data>
    </>
  );
}
