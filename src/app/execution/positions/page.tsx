"use client";
import React from "react";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, Disclosure, PageHeader, ProvenanceBadge, Timeline } from "@/ds/primitives";
import { DataTable } from "@/ds/table";
import { Banner } from "@/ds/states";
import { dateTime, price, signedMoney, pnlTone } from "@/lib/fmt";

export default function PositionsPage() {
  return (
    <>
      <PageHeader title="Open Positions" description="Paper positions with realised and unrealised P&L kept apart. A position with no recent price shows no unrealised figure." badges={<ProvenanceBadge kind="PAPER" />} />
      <div className="space-y-4">
        <Card label="Positions"><CardHeader title="Positions" subtitle="Per-user paper positions (Stage 07)" /><CardBody>
          <Data def={EP.positionsV2} what="positions">{(ps) => <div className="space-y-3"><DataTable label="Positions" rows={ps} rowKey={(p) => p.id} cols={[
            { key: "i", header: "Instrument", render: (p) => <span className="font-medium">{p.instrument}</span> }, { key: "st", header: "State", render: (p) => <Badge tone={p.status === "OPEN" ? "info" : "mute"}>{p.status}{p.exitReason ? ` · ${p.exitReason.toLowerCase()}` : ""}</Badge> },
            { key: "q", header: "Qty", align: "right", render: (p) => p.quantity }, { key: "e", header: "Entry", align: "right", hideBelow: "sm", render: (p) => price(p.avgEntryPrice) }, { key: "sl", header: "Stop", align: "right", hideBelow: "sm", render: (p) => price(p.stopLoss) },
            { key: "lp", header: "Last price", align: "right", render: (p) => (p.lastPrice ? price(p.lastPrice.price) : <Badge tone="warn">no price</Badge>) },
            { key: "r", header: "Realised", align: "right", render: (p) => <span className={pnlTone(p.realizedPnl) === "bad" ? "text-neg" : pnlTone(p.realizedPnl) === "ok" ? "text-pos" : ""}>{signedMoney(p.realizedPnl)}</span> },
            { key: "u", header: "Unrealised", align: "right", render: (p) => (p.unrealizedPnl === null ? <span className="text-fg-faint" title="Unrealised needs a recent price">n/a</span> : signedMoney(p.unrealizedPnl)) }]} />
            {ps.map((p) => <Disclosure key={p.id} title={`${p.instrument}: events`}><Timeline label={`${p.instrument} events`} items={p.events.map((e) => ({ at: e.at, title: e.kind, detail: e.detail }))} /></Disclosure>)}</div>}</Data>
        </CardBody></Card>
        <Card label="Served today"><CardHeader title="Positions served by the current API" subtitle="Legacy read route; values are numbers from the backend" /><CardBody>
          <Data def={EP.paperPositions} what="paper positions" empty={<p className="text-sm text-fg-muted">No paper positions.</p>}>{(ps) => <DataTable label="Paper positions" dense rows={ps} rowKey={(p) => p.tradeId} cols={[{ key: "s", header: "Symbol", render: (p) => p.symbol }, { key: "st", header: "State", render: (p) => <Badge tone={p.state === "OPEN" ? "info" : "mute"}>{p.state.replace("_", " ")}</Badge> }, { key: "q", header: "Remaining", align: "right", render: (p) => String(p.remainingQuantity) }, { key: "r", header: "Realised", align: "right", render: (p) => signedMoney(String(p.realizedPnl)) }, { key: "u", header: "Unrealised", align: "right", render: (p) => (p.lastPrice === null ? "n/a" : signedMoney(String(p.unrealizedPnl))) }]} />}</Data>
        </CardBody></Card>
        <Banner tone="info" title="Realised vs unrealised">Realised P&amp;L is booked on exits. Unrealised is a mark to the last price and can change or vanish when prices go stale.</Banner>
      </div>
    </>
  );
}
