"use client";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, KeyValue, Metric, MetricGrid, PageHeader, ProvenanceBadge } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { signedMoney, pnlTone, count } from "@/lib/fmt";

export default function PaperPage() {
  return (
    <>
      <PageHeader title="Paper Trading" description="Simulated execution only. No order reaches a broker; fills are modelled against stored prices." badges={<ProvenanceBadge kind="PAPER" />} />
      <div className="space-y-4">
        <Data def={EP.paperStatus} what="paper trading status">{(p) => (<>
          <Banner tone="info" title="Paper mode">Live trading: <b>disabled</b>. Broker orders: <b>none</b>. This is a simulation.</Banner>
          <Card label="Status"><CardHeader title="Status" right={<Badge tone={p.enabled ? "warn" : "mute"}>{p.enabled ? "running" : "off"}</Badge>} /><CardBody><KeyValue cols={2} rows={[["Armed by host", p.armedByHost === undefined ? "unreadable" : p.armedByHost ? "yes" : "no"], ["Modelled slippage", p.slippageBps == null ? "—" : `${p.slippageBps} bps`], ["Entry expiry", p.entryExpiryMinutes == null ? "—" : `${p.entryExpiryMinutes} min`], ["Breakeven after T1", p.breakevenAfterTarget1 ? "yes" : "no"], ["Square-off (IST min)", p.squareOffIstMinutes == null ? "none" : String(p.squareOffIstMinutes)], ["Exit fractions", (p.exitFractions ?? []).join(" / ") || "—"]]} /></CardBody></Card>
          <MetricGrid cols={4}><Metric label="Open positions" value={count(p.summary.openPositions)} /><Metric label="Pending entries" value={count(p.summary.pendingEntries)} /><Metric label="Realised P&L" value={signedMoney(String(p.summary.realizedPnl))} tone={pnlTone(String(p.summary.realizedPnl))} hint="Booked on closed paper trades" /><Metric label="Unrealised P&L" value={signedMoney(String(p.summary.unrealizedPnl))} tone={pnlTone(String(p.summary.unrealizedPnl))} hint="Mark-to-market; can change" /></MetricGrid>
        </>)}</Data>
        <Card label="Readiness"><CardHeader title="Readiness checks" subtitle="Informational. Passing every check does not enable live trading." /><CardBody>
          <Data def={EP.paperReadiness} what="readiness" rows={3}>{(r) => <ul className="space-y-1.5 text-sm">{r.items.map((i) => <li key={i.id} className="flex flex-wrap items-start gap-2"><Badge tone={i.status === "pass" ? "ok" : i.status === "fail" ? "bad" : "mute"}>{i.status}</Badge><span><b className="font-medium">{i.title}</b> <span className="text-fg-muted">{i.detail}</span></span></li>)}</ul>}</Data>
        </CardBody></Card>
      </div>
    </>
  );
}
