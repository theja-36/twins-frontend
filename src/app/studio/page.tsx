"use client";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import type { ApprovalSummary, DecisionSummary, SourceHealthProfile, SystemConfig, TelegramChannel } from "@/types/trading";
import { arr, obj, refreshAll, useRead } from "@/studio/data";
import { Card, Chip, Metric, PageHead, ReadGate, SampleBadge, Skeleton } from "@/studio/kit";
import { usePortfolioReads, STATE_TONE } from "@/studio/portfolio";
import { SRC_TONE, STATUS_LABEL, ageSince, ageText, approvalFor, decisionStop, decisionTitle, liveDecisions, signedRupees, statusGroup, rupees, words, type Tone } from "@/studio/model";
import { currentDrawdownR, dayPnl, equityCurve } from "@/lib/portfolio";
import { SAMPLE_REGIME } from "@/studio/sample";

const tone = (n: number): string => (n >= 0 ? "st-tone-ok" : "st-tone-bad");
const sf = (v: boolean | undefined, on: string, off: string, onT: Tone, offT: Tone): [string, Tone] => (v === undefined ? ["unreadable", "warn"] : v ? [on, onT] : [off, offT]);

export default function Overview() {
  const dec = useRead<DecisionSummary[]>("risk/decisions?limit=100", arr<"decisions", DecisionSummary>("decisions"));
  const apr = useRead<ApprovalSummary[]>("risk/approvals?limit=100", arr<"approvals", ApprovalSummary>("approvals"));
  const chans = useRead<TelegramChannel[]>("telegram/channels", arr<"channels", TelegramChannel>("channels"));
  const src = useRead<SourceHealthProfile>("market/sources", (r) => (r && typeof r === "object" && Array.isArray((r as SourceHealthProfile).providers) ? (r as SourceHealthProfile) : null), 30_000);
  const cfg = useRead<SystemConfig>("system/config", obj<SystemConfig>("environment"), 60_000);
  const { pos, sum, out } = usePortfolioReads();
  const rc = cfg.data?.runtimeControls;
  const flags: Array<[string, string, Tone]> = cfg.data ? [
    ["Engine", cfg.data.agentEngine.enabled ? "enforcing" : "off", cfg.data.agentEngine.enabled ? "warn" : "mute"], ["Shadow", cfg.data.agentEngine.shadow ? "on" : "off", cfg.data.agentEngine.shadow ? "ok" : "mute"],
    ["Live trading", "off", "ok"], ["Paper", cfg.data.paperTrading.effective ? "on" : "off", cfg.data.paperTrading.effective ? "warn" : "mute"],
    ["Kill switch", ...sf(rc?.killSwitchActive, "ACTIVE", "off", "bad", "ok")]] : [];
  return (
    <>
      <PageHead title="Overview" sub="What arrived, what is held back, and what needs you." right={flags.length ? flags.map(([k, v, t]) => <span key={k} className="st-pill">{k} <Chip tone={t}>{v}</Chip></span>) : <span className="st-pill">Safety state: {cfg.status === "loading" ? "loading" : "unavailable"}</span>} />

      <ReadGate read={dec} what="decisions" skeleton={<div className="st-grid st-hero">{[0, 1, 2, 3].map((k) => <Skeleton key={k} h={138} />)}</div>} isEmpty={(d) => liveDecisions(d).length === 0} emptyHint="No decision exists yet.">
        {(all) => { const d = liveDecisions(all); const n = (g: string): number => d.filter((x) => statusGroup(x.effectiveStatus) === g).length; return (
          <section className="st-grid st-hero" aria-label="Decisions at a glance">
            <Metric tone="lav" label="Decisions loaded" value={d.length} foot="Latest 100 from the risk layer" />
            <Metric tone="mint" label="Approved for review" value={n("ready")} foot="Decide in the approval bot" />
            <Metric tone="peach" label="Pending" value={n("pending")} foot="Not approvable yet" />
            <Metric tone="white" label="Channels captured" value={chans.status === "ok" ? (chans.data?.length ?? 0) : "—"} foot={chans.status === "ok" ? "Masked ids only" : "Channel list unavailable"} />
          </section>); }}
      </ReadGate>

      <Card title="Paper portfolio" sub="Simulated trades only. No order is ever placed." right={<Link href="/studio/portfolio" className="st-btn ghost">Open portfolio <ArrowRight size={16} aria-hidden /></Link>}>
        <ReadGate read={sum} what="the paper summary">
          {(s) => (
            <div className="st-kv num" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
              <div>Available capital<strong style={{ color: "var(--ink3)" }}>Not available</strong><span style={{ fontSize: 11.5 }}>The API exposes no capital figure</span></div>
              <div>Paper P&amp;L<strong className={tone(s.totalPnl)}>{signedRupees(s.totalPnl)}</strong></div>
              <div>Day P&amp;L<strong className={out.data && pos.data ? tone(dayPnl(out.data, pos.data, new Date())) : ""}>{out.data && pos.data ? signedRupees(dayPnl(out.data, pos.data, new Date())) : "—"}</strong></div>
              <div>Exposure<strong>{rupees(s.exposure)}</strong></div>
              <div>Drawdown now<strong>{out.data ? `${currentDrawdownR(equityCurve(out.data))} R` : "—"}</strong></div>
            </div>)}
        </ReadGate>
        <h3 style={{ margin: "18px 0 2px", fontSize: 14 }}>Open paper positions</h3>
        <p className="st-sub" style={{ margin: "0 0 4px" }}>Last prices come from the paper engine. The API gives no quote time per position.</p>
        <ReadGate read={pos} what="paper positions" isEmpty={(r) => r.filter((p) => p.state === "OPEN" || p.state === "PENDING_ENTRY").length === 0} emptyHint="No open or pending paper position.">
          {(rows) => <ul className="st-list">{rows.filter((p) => p.state === "OPEN" || p.state === "PENDING_ENTRY").slice(0, 5).map((p) => (
            <li key={p.tradeId} className="st-row"><div className="grow"><div className="t">{p.symbol} · {p.side}</div><div className="s num">{p.remainingQuantity} qty · entry {p.fillPrice ?? p.entryPrice}{p.lastPrice !== null ? ` · last ${p.lastPrice}` : ""}</div></div>
              <div style={{ textAlign: "right" }}><Chip tone={STATE_TONE[p.state]}>{words(p.state)}</Chip>{p.state === "OPEN" ? <div className={`num ${tone(p.totalPnl)}`} style={{ fontWeight: 800, marginTop: 4 }}>{signedRupees(p.totalPnl)}</div> : null}</div></li>))}</ul>}
        </ReadGate>
      </Card>

      <section className="st-grid st-two">
        <Card title="Recent decisions" sub="The newest decisions and where each stands." right={<Link href="/studio/deck" className="st-btn">Open the deck <ArrowRight size={16} aria-hidden /></Link>}>
          <ReadGate read={dec} what="decisions" isEmpty={(d) => liveDecisions(d).length === 0}>
            {(all) => { const top = liveDecisions(all).slice(0, 3); return (
              <>
                <div className="st-stackmini" aria-hidden><div /><div /><div><b style={{ fontFamily: "var(--font-jakarta)", fontSize: 18 }}>{top[0] ? decisionTitle(top[0]) : ""}</b><br /><span className="st-sub">{top[0] ? STATUS_LABEL[statusGroup(top[0].effectiveStatus)].label : ""}</span></div></div>
                <ul className="st-list">{top.map((d) => { const g = STATUS_LABEL[statusGroup(d.effectiveStatus)]; const ap = apr.status === "ok" ? approvalFor(d, apr.data ?? []).label : "Approval ledger not readable"; return (
                  <li key={d.id} className="st-row"><span className="st-avatar" aria-hidden>{d.symbol.slice(0, 2)}</span><div className="grow"><div className="t">{decisionTitle(d)} · {d.side ?? "—"}</div><div className="s">{statusGroup(d.effectiveStatus) === "ready" ? "Passed every gate" : words(d.reasonCode || "no reason recorded")} · {ageText(ageSince(d.createdAt, Date.now())).replace(" old", " ago")}</div><div className="s">{ap} · {decisionStop(d).label}</div></div><Chip tone={g.tone}>{g.label}</Chip></li>); })}</ul>
              </>); }}
          </ReadGate>
        </Card>
        <Card title="Market regime" right={<SampleBadge />} sub="What kind of market this is.">
          <div className="st-note"><strong style={{ color: "var(--ink)" }}>{SAMPLE_REGIME.label}</strong><br />{SAMPLE_REGIME.note}</div>
          <h2 style={{ marginTop: 18 }}>Source health</h2><p className="st-sub">Missing, stale and failing stay distinct.</p>
          <ReadGate read={src} what="source health" unavailableHint="The source-health route is not on this backend.">
            {(s) => <ul className="st-list">{s.providers.map((p) => <li key={p.provider} className="st-row"><div className="grow"><div className="t">{p.provider}</div><div className="s">{p.reasons[0] ?? `data ${ageText(p.dataAgeSeconds)}`}</div></div><Chip tone={SRC_TONE[p.status]}>{p.status.toLowerCase()}</Chip></li>)}</ul>}
          </ReadGate>
        </Card>
      </section>

      <Card title="Go to" sub="Every link opens a read-only page." right={<button className="st-btn ghost" onClick={refreshAll}><RefreshCw size={15} aria-hidden />Refresh data</button>}>
        <div className="st-qa"><Link href="/studio/deck">Decisions<small>One card at a time</small></Link><Link href="/studio/signals">Signals<small>Filter and inspect claims</small></Link><Link href="/studio/channels">Channels<small>Captured chats</small></Link><Link href="/studio/market">Market<small>Prices and sources</small></Link></div>
      </Card>
    </>
  );
}
