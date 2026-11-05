"use client";

import React from "react";
import { useLoaded } from "@/components/trading/hooks";
import { Chip, Dot, Empty, PageHeader, Pnl, Skeleton, SourceBadge, card } from "@/components/trading/ui";
import { duration, px, signed } from "@/services/trading";
import { getMarketSnapshot } from "@/services/system";
import { cn } from "@/lib/utils";

const kb = (b: number): string => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : b >= 1000 ? `${Math.round(b / 1000)} kB` : `${b} B`);
const FRESH_LIMIT = 120;

export default function MarketPage() {
  const { loaded, loading } = useLoaded(getMarketSnapshot, 15_000);
  const m = loaded?.data;
  return (
    <div className="space-y-6">
      <PageHeader title="Market data" subtitle="What the Kite feed last published, and the data files the research agents can read. Nothing here is a trading signal." right={<SourceBadge loading={loading} />} />
      {!m ? <Skeleton h={220} /> : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">Index prices</h2>
            {!m.visible ? <Empty title="The snapshot folder is not visible" hint="The API cannot see /var/lib/twins-snapshots. Check the read-only mount." /> : m.indices.length === 0 ? <Empty title="No index prices yet" hint="They appear after the Kite feed has run (it needs a fresh Kite login on a trading day)." /> : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{m.indices.map((i) => {
                const stale = i.ageSeconds === null || i.ageSeconds > FRESH_LIMIT;
                return (
                  <div key={`${i.market}:${i.symbol}`} className={cn(card, "p-5")}>
                    <div className="flex items-start justify-between"><div><p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">{i.market}</p><h3 className="text-lg font-semibold text-ink">{i.symbol}</h3></div><Chip kind={stale ? "PENDING" : "OPEN"}>{stale ? "stale" : "fresh"}</Chip></div>
                    <p className="mt-3 font-mono text-3xl font-semibold tracking-tight text-ink">{px(i.level)}</p>
                    <p className="mt-1 text-sm"><Pnl value={i.changePct1d}>{i.changePct1d === null ? "—" : `${signed(i.changePct1d)}%`}</Pnl><span className="text-slate-400"> vs previous close {px(i.previousClose)}</span></p>
                    <p className="mt-3 text-xs text-slate-400">price is {i.ageSeconds === null ? "of unknown age" : duration(i.ageSeconds)} old</p>
                  </div>);
              })}</div>
            )}
          </section>

          <section className={cn(card, "overflow-hidden")}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4"><div><h2 className="text-base font-semibold text-ink">Snapshot generation</h2><p className="mt-0.5 text-xs text-slate-500">Published by the feed as one all-or-nothing set. {m.quoteCount} quotes, {m.optionQuoteCount} option quotes.</p></div>
              <span className="inline-flex items-center gap-2 text-sm"><Dot tone={m.generation?.status === "complete" ? "ok" : m.visible ? "warn" : "off"} /><b className="text-ink">{m.generation ? m.generation.status : "none"}</b>{m.generation?.id && <span className="font-mono text-xs text-slate-400">{m.generation.id}</span>}</span></div>
            <table className="w-full text-sm"><thead><tr className="text-left text-[11px] font-mono uppercase tracking-wider text-slate-500"><th className="px-5 py-3">File</th><th className="px-5 py-3">Present</th><th className="px-5 py-3 text-right">Size</th><th className="px-5 py-3 text-right">Age</th></tr></thead>
              <tbody>{m.files.map((f) => (<tr key={f.kind} className="border-t border-slate-50"><td className="px-5 py-3 font-mono text-[13px] text-ink">{f.kind}</td><td className="px-5 py-3"><Dot tone={f.present ? "ok" : "off"} /> <span className="text-slate-500">{f.present ? "yes" : "missing"}</span></td><td className="px-5 py-3 text-right font-mono text-slate-500">{f.present ? kb(f.bytes) : "—"}</td><td className="px-5 py-3 text-right font-mono text-slate-500">{f.ageSeconds === null ? "—" : duration(f.ageSeconds)}</td></tr>))}</tbody></table>
          </section>

          <section className={cn(card, "overflow-hidden")}>
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold text-ink">Provider data files</h2><p className="mt-0.5 text-xs text-slate-500">News, sentiment, macro, calendar and market data for the research agents. Written by the provider exporter, which is off until the host allow-list is installed.</p></div>
            <ul className="divide-y divide-slate-50">{m.providers.map((p) => (
              <li key={p.name} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex items-center gap-3"><Dot tone={p.present ? "ok" : "off"} /><div><p className="font-mono text-[13px] text-ink">{p.name}</p><p className="text-xs text-slate-400">{p.present ? `${p.format ?? "?"} · ${p.source ?? "?"}` : "not exported yet"}</p></div></div>
                <div className="text-right text-xs text-slate-500">{p.present ? <><p>{p.count ?? 0} item{p.count === 1 ? "" : "s"}</p><p className="text-slate-400">{p.ageSeconds === null ? "" : `${duration(p.ageSeconds)} old`}</p></> : <span className="text-slate-400">—</span>}</div>
              </li>))}</ul>
          </section>
        </>
      )}
    </div>
  );
}
