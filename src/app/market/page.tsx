"use client";
import React from "react";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, Metric, MetricGrid, PageHeader } from "@/ds/primitives";
import { DataTable } from "@/ds/table";
import { Banner, PartialBanner } from "@/ds/states";
import { SRC_TONE, ageText } from "@/lib/view";
import { polarityTone, polarityWord, clusterTitle, orderClusters, statusNote } from "@/lib/news";
import { sessionAt, formatCountdown } from "@/lib/marketHours";
import { price, pct } from "@/lib/fmt";

export default function MarketPage() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => { setNow(new Date()); }, []);
  const ses = now ? sessionAt(now) : null;
  return (
    <>
      <PageHeader title="Market Overview" description="Index levels, data-source health and Telegram-channel commentary. Panels that depend on a source that is missing say so instead of showing placeholders." />
      <div className="space-y-4">
        <Card label="Session"><CardHeader title="Trading session" subtitle="Computed from the NSE calendar rule in IST" /><CardBody>{ses && <div className="flex flex-wrap items-baseline gap-3"><span className="text-lg font-semibold">{ses.label}</span><span className="num text-sm text-fg-muted">{ses.nextLabel} in {formatCountdown(ses.secondsToChange)}</span></div>}<p className="mt-2 text-xs text-fg-faint">Exchange holidays come from the holiday-calendar source below; if it is missing, this is a weekday/time rule only.</p></CardBody></Card>
        <Card label="Indices"><CardHeader title="Indices" subtitle="From the latest exported snapshot" /><CardBody>
          <Data def={EP.marketSnapshot} what="market snapshot" rows={3}>{(s) => s.indices.length === 0
            ? <Banner tone="warn" title="No index levels">The snapshot has no index prices{s.visible ? "" : " (the snapshot is not visible)"}. Nothing is estimated in their place.</Banner>
            : <MetricGrid cols={4}>{s.indices.map((i) => <Metric key={i.symbol} label={`${i.symbol} · ${i.market}`} value={price(String(i.level))} tone={i.changePct1d == null ? "mute" : i.changePct1d >= 0 ? "ok" : "bad"} sub={<>{i.changePct1d == null ? "change unavailable" : `${i.changePct1d >= 0 ? "▲" : "▼"} ${pct(i.changePct1d, 2)}`} · {ageText(i.ageSeconds)} old</>} />)}</MetricGrid>}</Data>
        </CardBody></Card>
        <Card label="Sources"><CardHeader title="Data-source health" subtitle="A missing or stale source lowers what the platform can claim" /><CardBody>
          <Data def={EP.marketSources} what="source health" rows={4}>{(h) => <div className="space-y-3"><div className="flex flex-wrap items-center gap-2 text-sm">Overall <Badge tone={SRC_TONE[h.overall]}>{h.overall}</Badge></div>
            <DataTable label="Providers" rows={h.providers} rowKey={(p) => p.provider} dense cols={[{ key: "p", header: "Source", render: (p) => p.provider }, { key: "s", header: "Status", render: (p) => <Badge tone={SRC_TONE[p.status]}>{p.status}</Badge> }, { key: "a", header: "Data age", align: "right", render: (p) => ageText(p.dataAgeSeconds), sort: (p) => p.dataAgeSeconds }, { key: "r", header: "Reasons", hideBelow: "sm", render: (p) => (p.reasons.length ? p.reasons.join("; ") : "—") }]} />
            {h.providers.some((p) => p.provider === "economic-calendar" && !p.usable) && <PartialBanner missing="The economic calendar is not available, so event risk is unknown. The platform does not substitute a static calendar." />}</div>}</Data>
        </CardBody></Card>
        <Card label="Channel commentary"><CardHeader title="Telegram channel commentary" subtitle="Structured fields only, capped at CAUTION: advisory context, never a market data source" /><CardBody>
          <Data def={EP.channelNews} what="channel commentary" rows={3}>{(n) => <div className="space-y-3">{statusNote(n) && <Banner tone="warn" title="Commentary not current">{statusNote(n)}</Banner>}<p className="text-sm">{n.summary.line}</p>
            {n.clusters.length === 0 ? <p className="text-sm text-fg-muted">No clusters.</p> : <ul className="divide-y divide-line">{orderClusters(n.clusters).map((c) => <li key={c.clusterId} className="flex items-center justify-between py-2 text-sm"><span>{clusterTitle(c)} <span className="text-fg-faint">· {c.items} items · {c.channels} channels</span></span><Badge tone={polarityTone(c.polarity)}>{c.mixed ? "mixed" : polarityWord(c.polarity)}</Badge></li>)}</ul>}</div>}</Data>
        </CardBody></Card>
      </div>
    </>
  );
}
