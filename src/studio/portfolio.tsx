"use client";
import React from "react";
import type { OutcomeStats, PaperStatus, PnlSummary, PositionView, TradeOutcome } from "@/types/trading";
import { currentDrawdownR, dayPnl, equityCurve, exposureBySymbol } from "@/lib/portfolio";
import { sparkPath } from "@/lib/cockpit";
import { arr, obj, useRead } from "./data";
import { Card, Chip, FilterGroup, HBar, Metric, Notice, ReadGate, Table } from "./kit";
import { rupees, signedRupees, words } from "./model";

const STATES = [["all", "All"], ["OPEN", "Open"], ["PENDING_ENTRY", "Pending entry"], ["CLOSED", "Closed"], ["CANCELLED", "Cancelled"]] as const;
export const STATE_TONE = { OPEN: "ok", PENDING_ENTRY: "info", CLOSED: "mute", CANCELLED: "mute" } as const;
const tone = (n: number) => (n >= 0 ? "st-tone-ok" : "st-tone-bad");

export function usePortfolioReads() {
  return {
    pos: useRead<PositionView[]>("paper/positions?limit=200", arr<"positions", PositionView>("positions"), 10_000),
    sum: useRead<PnlSummary>("paper/summary", obj<PnlSummary>("totalPnl"), 15_000),
    out: useRead<TradeOutcome[]>("paper/outcomes?limit=500", arr<"outcomes", TradeOutcome>("outcomes"), 30_000),
    stats: useRead<OutcomeStats>("paper/outcomes/stats", obj<OutcomeStats>("n"), 30_000),
    status: useRead<PaperStatus>("paper/status", obj<PaperStatus>("mode"), 30_000),
  };
}

export function PortfolioView() {
  const { pos, sum, out, stats, status } = usePortfolioReads();
  const [st, setSt] = React.useState<(typeof STATES)[number][0]>("all");
  const off = status.status === "ok" && status.data ? !status.data.enabled : null;
  return (
    <>
      {off === true ? <Notice tone="info" title="Paper trading is off.">The figures below are what the paper engine last recorded. Nothing is being simulated now.</Notice> : null}
      <Card title="Paper summary" sub="Simulated trades only. No order is ever placed.">
        <ReadGate read={sum} what="the paper summary">
          {(s) => (
            <div className="st-kv num" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
              <div>Available capital<strong style={{ color: "var(--ink3)" }}>Not available</strong><span style={{ fontSize: 11.5 }}>The API exposes no capital figure</span></div>
              <div>Paper P&amp;L<strong className={tone(s.totalPnl)}>{signedRupees(s.totalPnl)}</strong></div>
              <div>Realised<strong className={tone(s.realizedPnl)}>{signedRupees(s.realizedPnl)}</strong></div>
              <div>Unrealised<strong className={tone(s.unrealizedPnl)}>{signedRupees(s.unrealizedPnl)}</strong></div>
              <div>Exposure<strong>{rupees(s.exposure)}</strong></div>
              <div>Trades<strong>{s.openPositions} open · {s.pendingEntries} pending · {s.closedTrades} closed</strong></div>
            </div>)}
        </ReadGate>
      </Card>
      <div className="st-grid">
        <Card title="Positions" sub="Last prices come from the paper engine; the API gives no quote time per position.">
          <FilterGroup label="Position state" options={STATES} value={st} onChange={setSt} />
          <div style={{ height: 8 }} />
          <ReadGate read={pos} what="paper positions" isEmpty={(d) => d.length === 0} emptyHint="No paper position exists. While paper trading is off none are opened.">
            {(rows) => { const list = rows.filter((p) => st === "all" || p.state === st); return list.length === 0 ? <div className="st-empty"><h3>No positions in this state</h3><p>Choose another state. This is a filter result.</p></div> : (
              <Table caption="Paper positions" rows={list} rowKey={(p) => p.tradeId} cols={[
                { key: "s", label: "Instrument", render: (p) => <b>{p.symbol} · {p.side}</b> },
                { key: "st", label: "State", render: (p) => <Chip tone={STATE_TONE[p.state]}>{words(p.state)}</Chip> },
                { key: "q", label: "Qty", className: "num", render: (p) => `${p.remainingQuantity}/${p.quantity}` },
                { key: "e", label: "Entry / last", className: "num", render: (p) => `${p.fillPrice ?? p.entryPrice} / ${p.lastPrice ?? "—"}` },
                { key: "x", label: "Stop / targets", className: "num", render: (p) => `${p.stop} / ${p.targets.join(" ")}` },
                { key: "p", label: "P&L", className: "num", render: (p) => <span className={tone(p.totalPnl)}>{signedRupees(p.totalPnl)}</span> },
              ]} />); }}
          </ReadGate>
        </Card>
      </div>
      <div className="st-grid st-two">
        <Card title="Exposure by symbol" sub="Open and pending positions, by notional.">
          <ReadGate read={pos} what="exposure" isEmpty={(d) => exposureBySymbol(d).length === 0} emptyHint="Nothing is open, so there is no exposure.">
            {(rows) => <>{exposureBySymbol(rows).map((e) => <HBar key={e.symbol} label={e.symbol} value={rupees(e.notional)} share={e.share} foot={`${e.share}% of open exposure`} />)}
              <p className="st-sub" style={{ margin: "10px 0 0" }}>A sector breakdown is not shown: instruments carry no sector tag yet, so none is invented.</p></>}
          </ReadGate>
        </Card>
        <Card title="Equity curve" sub="Cumulative paper P&L in closing order, from closed trades only.">
          <ReadGate read={out} what="the equity curve" isEmpty={(d) => equityCurve(d).length < 2} emptyHint="At least two closed trades are needed to draw a curve.">
            {(rows) => { const c = equityCurve(rows), d = sparkPath(c.map((p) => p.pnl), 600, 160, 8); return (
              <><svg viewBox="0 0 600 160" className="st-curve" role="img" aria-label={`Cumulative paper P&L over ${c.length} closed trades, now ${signedRupees(c[c.length - 1]?.pnl ?? 0)}`}><path d={d} fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /></svg>
                <div className="st-legend"><span><i className="st-dot" style={{ background: "var(--brand)" }} />cumulative P&amp;L</span><span>Drawdown now <b>{currentDrawdownR(c)} R</b></span><span>Today <b>{signedRupees(dayPnl(rows, pos.data ?? [], new Date()))}</b></span></div></>); }}
          </ReadGate>
        </Card>
      </div>
      <div className="st-grid">
        <Card title="Closed paper trades" sub="Newest first.">
          <ReadGate read={out} what="closed paper trades" isEmpty={(d) => d.length === 0} emptyHint="No paper trade has closed yet. While paper trading is off none can.">
            {(rows) => <Table caption="Trade history" rows={[...rows].sort((a, b) => (a.closedAt < b.closedAt ? 1 : -1)).slice(0, 30)} rowKey={(o) => o.tradeId} cols={[
              { key: "s", label: "Instrument", render: (o) => <b>{o.symbol}</b> },
              { key: "o", label: "Outcome", render: (o) => <Chip tone={o.outcome === "WIN" ? "ok" : o.outcome === "LOSS" ? "bad" : "mute"}>{o.outcome.toLowerCase()}</Chip> },
              { key: "p", label: "P&L", className: "num", render: (o) => <span className={tone(o.pnl)}>{signedRupees(o.pnl)}</span> },
              { key: "r", label: "R", className: "num", render: (o) => o.rMultiple.toFixed(2) },
              { key: "c", label: "Closed by", render: (o) => words(o.closeReason) },
              { key: "d", label: "Closed", render: (o) => new Date(o.closedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short" }) },
            ]} />}
          </ReadGate>
        </Card>
      </div>
      <Card title="Outcome attribution" sub="Results by how trades closed and by source trust.">
        <ReadGate read={stats} what="outcome statistics">
          {(s) => !s.sampleIsMeaningful ? (
            <Notice tone="info" title="Too thin to read.">Only {s.n} closed trade{s.n === 1 ? "" : "s"} so far; at least {s.minSampleForMeaning} are needed before attribution means anything. The counts below are shown for completeness, not as a result.
              <div className="st-kv num" style={{ marginTop: 10 }}><div>Trades<strong>{s.n}</strong></div><div>Wins / losses<strong>{s.wins} / {s.losses}</strong></div><div>Worst drawdown<strong>{s.maxDrawdownR} R</strong></div><div>Needed<strong>{s.minSampleForMeaning}</strong></div></div></Notice>
          ) : (
            <div className="st-grid st-three">{([["By close reason", s.byCloseReason], ["By source trust", s.bySourceTrustTier], ["By research assessment", s.byResearchAssessment]] as const).map(([t, g]) => (
              <div key={t}><h4>{t}</h4>{Object.keys(g).length === 0 ? <p className="st-sub">No data.</p> : Object.entries(g).map(([k, v]) => <HBar key={k} label={words(k)} value={`${v.n} · ${v.winRate === null ? "—" : Math.round(v.winRate * 100)}% won`} share={v.winRate === null ? 0 : v.winRate * 100} foot={`avg ${v.avgR === null ? "—" : v.avgR.toFixed(2)} R`} />)}</div>))}</div>)}
        </ReadGate>
      </Card>
    </>
  );
}
