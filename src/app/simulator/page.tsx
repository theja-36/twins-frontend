"use client";
import React from "react";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, Disclosure, KeyValue, PageHeader } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { DataTable } from "@/ds/table";
import { money, price, pct } from "@/lib/fmt";

export default function SimulatorPage() {
  return (
    <>
      <PageHeader title="What-if Simulator" description="Stored scenario estimates for a decision. Every figure is an ESTIMATE under stated assumptions, not a prediction and not an instruction." badges={<Badge tone="warn">ESTIMATE</Badge>} />
      <Banner tone="warn" title="Estimates only">The app does not run simulations itself: it shows reports the backend stored. Slippage, gaps and costs are modelled; real fills can differ.</Banner>
      <div className="mt-4"><Data def={EP.simulations} what="simulations">{(sims) => <div className="space-y-4">{sims.map((s) => (
        <Card key={s.id} label={s.subject}><CardHeader title={s.subject} subtitle={`${s.versions.simulator} · sizing ${s.versions.sizingModel} · cost ${s.versions.costModel}`} right={<Badge tone="warn">informational</Badge>} /><CardBody className="space-y-4">
          <div className="grid min-w-0 gap-3 md:grid-cols-2">{s.scenarios.map((sc) => <div key={sc.id} className="min-w-0 rounded-lg border border-line p-3 text-sm"><p className="mb-1 flex items-center gap-2 font-medium">{sc.label} <Badge tone={sc.permitted ? "ok" : "bad"}>{sc.permitted ? "within limits" : "NOT permitted"}</Badge></p>
            {!sc.permitted && <p className="mb-1 text-xs text-neg">{sc.notPermittedReasons.join("; ")}</p>}
            <KeyValue rows={[["Lots / qty", `${sc.sizing.lots} / ${sc.sizing.quantity}`], ["Gross exposure", money(sc.sizing.grossExposure)], ["Max loss at stop", money(sc.sizing.maxLossAtStop)], ["Costs at stop", money(sc.sizing.costsAtStop)], ["Breakeven price", price(sc.sizing.breakevenPrice)], ["Capital used", pct(sc.sizing.capitalUtilisationPct)]]} />
            <DataTable label={`${sc.label} targets`} dense rows={sc.sizing.targets} rowKey={(t) => t.target} cols={[{ key: "t", header: "Target", render: (t) => price(t.target) }, { key: "n", header: "Net profit", align: "right", render: (t) => money(t.netProfit) }, { key: "r", header: "Net R:R", align: "right", render: (t) => t.netRewardToRisk ?? "—" }]} /></div>)}</div>
          <Disclosure title="Gap and adverse-move stress"><DataTable label="Gaps" dense rows={s.gaps} rowKey={(g) => String(g.gapPct)} cols={[{ key: "g", header: "Gap", render: (g) => `${g.gapPct}%` }, { key: "l", header: "Total loss", align: "right", render: (g) => money(g.totalLoss) }, { key: "m", header: "× planned loss", align: "right", render: (g) => g.multipleOfPlannedLoss }, { key: "f", header: "Flags", render: (g) => <span className="flex gap-1">{g.gappedThroughStop && <Badge tone="warn">through stop</Badge>}{g.exceedsRiskBudget && <Badge tone="bad">over budget</Badge>}</span> }]} />
            <ul className="mt-2 text-sm text-fg-muted">{s.volatility.map((v) => <li key={v.shockPoints}>Volatility +{v.shockPoints} pts: {v.status === "NOT_MODELLED" ? <Badge tone="mute">not modelled</Badge> : money(v.pnl)} — {v.note}</li>)}</ul></Disclosure>
          {s.portfolioImpact && <Disclosure title="Portfolio impact if taken"><KeyValue cols={2} rows={[["Open risk after", money(s.portfolioImpact.openRiskAfter)], ["Open notional after", money(s.portfolioImpact.openNotionalAfter)], ["Group risk after", money(s.portfolioImpact.groupRiskAfter)], ["Daily budget after a stop-out", money(s.portfolioImpact.dailyBudgetAfterStopOut)], ["Positions after", String(s.portfolioImpact.positionsAfter)]]} /></Disclosure>}
          <Disclosure title="Assumptions and limitations"><ul className="list-disc space-y-1 pl-5 text-sm text-fg-muted">{[...s.assumptions, ...s.limitations].map((x) => <li key={x}>{x}</li>)}</ul></Disclosure>
        </CardBody></Card>))}</div>}</Data></div>
    </>
  );
}
