"use client";
import React from "react";
import type { ChannelNewsView, IndexPrice, MarketSnapshot, SourceHealthProfile } from "@/types/trading";
import { clusterTitle, orderClusters, polarityWidth, polarityWord, statusNote } from "@/lib/news";
import { sessionAt, formatCountdown } from "@/lib/marketHours";
import { obj, useRead } from "./data";
import { Card, Chip, HBar, ReadGate, SampleBadge } from "./kit";
import { SRC_TONE, ageText, type Tone } from "./model";
import { SAMPLE_EVENTS, SAMPLE_REGIME } from "./sample";

const INDEX = [["NIFTY", "NSE"], ["BANKNIFTY", "NSE"], ["SENSEX", "BSE"]] as const;
const ageTone = (s: number | null): Tone => (s === null ? "mute" : s <= 600 ? "ok" : s <= 3600 ? "warn" : "bad");

export function MarketView() {
  const snap = useRead<MarketSnapshot>("market/snapshot", obj<MarketSnapshot>("indices"));
  const src = useRead<SourceHealthProfile>("market/sources", (r) => (r && typeof r === "object" && Array.isArray((r as SourceHealthProfile).providers) ? (r as SourceHealthProfile) : null), 30_000);
  const news = useRead<ChannelNewsView>("news/telegram", obj<ChannelNewsView>("summary"), 60_000);
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t); }, []);
  const ses = sessionAt(now);
  return (
    <>
      <Card title="Index prices" sub="Last stored level for each index. The age shown is the age of the stored price, not proof of a live feed." right={<Chip tone={ses.state === "open" ? "ok" : "mute"} title="Exchange hours only; holidays are not modelled">NSE hours: {ses.label}{ses.secondsToChange ? ` · ${ses.nextLabel} in ${formatCountdown(ses.secondsToChange)}` : ""}</Chip>}>
        <ReadGate read={snap} what="index prices" unavailableHint="The market snapshot route is not on this backend.">
          {(m) => !m.visible ? <div className="st-gap"><strong>No market data is visible.</strong>The snapshot reports status &quot;{m.generation?.status ?? "none"}&quot;. Prices appear after a verified export.</div> : (
            <div className="st-grid st-three">{INDEX.map(([sym, mkt]) => {
              const p: IndexPrice | undefined = m.indices.find((i) => i.symbol === sym);
              return <div key={sym} className="st-card st-soft"><div className="st-idx"><b>{sym} <small style={{ color: "var(--ink3)" }}>{mkt}</small></b>
                {p ? <><strong className="num">{p.level.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{p.changePct1d !== null ? <Chip tone={p.changePct1d >= 0 ? "ok" : "bad"}>{p.changePct1d >= 0 ? "+" : "−"}{Math.abs(p.changePct1d).toFixed(2)}% vs previous close</Chip> : <Chip>no previous close</Chip>}<Chip tone={ageTone(p.ageSeconds)}>price {ageText(p.ageSeconds)}</Chip></div></>
                  : <><strong style={{ color: "var(--ink3)" }}>No price</strong><Chip tone="mute">not in the snapshot</Chip></>}</div></div>;
            })}</div>)}
        </ReadGate>
      </Card>

      <div className="st-grid st-two">
        <Card title="Source health" sub="Each data source, and whether it is usable.">
          <ReadGate read={src} what="source health" unavailableHint="The source-health route is not on this backend.">
            {(s) => <ul className="st-list">{s.providers.map((p) => (
              <li key={p.provider} className="st-row"><div className="grow"><div className="t">{p.provider}</div><div className="s">{p.reasons.length ? p.reasons.join("; ") : "no problems reported"} · data {ageText(p.dataAgeSeconds)}</div></div><Chip tone={SRC_TONE[p.status]}>{p.status.toLowerCase()}</Chip></li>))}</ul>}
          </ReadGate>
        </Card>
        <Card title="Market regime" right={<SampleBadge />} sub="What kind of market this is.">
          <div className="st-note"><strong style={{ color: "var(--ink)" }}>{SAMPLE_REGIME.label}</strong><br />{SAMPLE_REGIME.note}</div>
          <h2 style={{ marginTop: 18 }}>Economic calendar <SampleBadge /></h2><p className="st-sub">No calendar route exists yet, so these rows only show the layout.</p>
          <ul className="st-list">{SAMPLE_EVENTS.map(([e, t]) => <li key={e} className="st-row"><div className="grow"><div className="t">{e}</div><div className="s">{t}</div></div></li>)}</ul>
        </Card>
      </div>

      <div className="st-grid st-two">
        <Card title="Telegram commentary" sub="Themes and tone from channel messages. Structured fields only; text is never shown. Capped at caution.">
          <ReadGate read={news} what="channel commentary" unavailableHint="The channel-news route is not on this backend yet.">
            {(v) => (
              <>
                {statusNote(v) ? <div className="st-gap" role="status" style={{ marginBottom: 12 }}><strong>{v.status === "missing" ? "No news file yet" : v.status === "stale" ? "News file is old" : "News file unreadable"}</strong>{statusNote(v)}</div> : null}
                {v.status === "ok" || v.status === "stale" ? (
                  <>
                    <p className="st-why"><b>{v.summary.line}</b> {v.summary.recommendation === "CAUTION" ? <Chip tone="warn">caution</Chip> : null}</p>
                    {v.clusters.length === 0 ? <div className="st-empty"><h3>No commentary clusters</h3><p>The file was read and holds none. That is only meaningful because its status is {v.status}.</p></div> :
                      orderClusters(v.clusters).slice(0, 8).map((c) => <HBar key={c.clusterId} label={clusterTitle(c)} value={`${polarityWord(c.polarity)}${c.mixed ? " · mixed" : ""}`} share={polarityWidth(c.polarity)} foot={`${c.items} items from ${c.channels} channel${c.channels === 1 ? "" : "s"}`} />)}
                  </>
                ) : null}
              </>
            )}
          </ReadGate>
        </Card>
        <Card title="Marketaux" sub="External news provider.">
          <div className="st-note"><Chip tone="mute">not activated</Chip> No request has been made and none is made from this page. News from Marketaux will appear here only after it is activated and approved.</div>
        </Card>
      </div>
    </>
  );
}
