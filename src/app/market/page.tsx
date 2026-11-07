"use client";

import React from "react";
import { useLoaded } from "@/components/trading/hooks";
import { Chip, Dot, Empty, PageHeader, Pnl, Skeleton, SourceBadge, card } from "@/components/trading/ui";
import { duration, px, signed } from "@/services/trading";
import { getMarketSnapshot, getSourceHealth } from "@/services/system";
import type { SourceStatus } from "@/types/trading";
import { CalendarPanel, NewsPanel } from "@/components/trading/Panels";
import { MarketHoursWidget, RegimeWidget } from "@/components/trading/Widgets";
import { cn } from "@/lib/utils";

const kb = (b: number): string => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : b >= 1000 ? `${Math.round(b / 1000)} kB` : `${b} B`);
const FRESH_LIMIT = 120;
const HEALTH_TONE: Record<SourceStatus, "ok" | "warn" | "bad" | "off"> = { OK: "ok", DEGRADED: "warn", STALE: "warn", FAILING: "bad", MISSING: "off", INVALID: "bad" };
const REASON_TEXT: Record<string, string> = {
  file_missing: "no data file yet", file_unreadable: "file could not be read", data_stale: "data is older than its limit", export_stale: "exporter has not rewritten it recently",
  last_pass_failed: "last exporter pass failed", repeated_failures: "failed on several passes in a row", last_pass_skipped: "exporter skipped it on purpose (for example stale inputs)", no_pass_logged: "no exporter pass on record", unrecognized: "unrecognised reason code",
};
const reasonText = (r: string): string => REASON_TEXT[r] ?? r.replaceAll("_", " ");

export default function MarketPage() {
  const { loaded, loading } = useLoaded(getMarketSnapshot, 15_000);
  const m = loaded?.data;
  const { loaded: health } = useLoaded(getSourceHealth, 30_000);
  const h = health?.data;
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
            <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-sm"><thead><tr className="text-left text-[11px] font-mono uppercase tracking-wider text-slate-500"><th className="px-5 py-3">File</th><th className="px-5 py-3">Present</th><th className="px-5 py-3 text-right">Size</th><th className="px-5 py-3 text-right">Age</th></tr></thead>
              <tbody>{m.files.map((f) => (<tr key={f.kind} className="border-t border-slate-50"><td className="px-5 py-3 font-mono text-[13px] text-ink">{f.kind}</td><td className="px-5 py-3"><Dot tone={f.present ? "ok" : "off"} /> <span className="text-slate-500">{f.present ? "yes" : "missing"}</span></td><td className="px-5 py-3 text-right font-mono text-slate-500">{f.present ? kb(f.bytes) : "—"}</td><td className="px-5 py-3 text-right font-mono text-slate-500">{f.ageSeconds === null ? "—" : duration(f.ageSeconds)}</td></tr>))}</tbody></table></div>
          </section>

          <section className={cn(card, "overflow-hidden")}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
              <div><h2 className="text-base font-semibold text-ink">Source health</h2><p className="mt-0.5 text-xs text-slate-500">Whether each data source is current enough for the agents to use. Evidence only: it never approves or blocks a trade by itself.</p></div>
              {h ? <span className="inline-flex items-center gap-2 text-sm"><Dot tone={HEALTH_TONE[h.overall]} /><b className="text-ink">Overall: {h.overall.toLowerCase()}</b></span> : null}
            </div>
            {!h ? <div className="p-5"><Skeleton h={120} /></div> : (
              <ul className="divide-y divide-slate-50">{h.providers.map((p) => (
                <li key={p.provider} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5">
                  <div className="flex items-start gap-3"><span className="mt-1"><Dot tone={HEALTH_TONE[p.status]} /></span><div><p className="font-mono text-[13px] text-ink">{p.provider}</p><p className="text-xs text-slate-400">{p.reasons.length ? p.reasons.map(reasonText).join("; ") : "current"}</p></div></div>
                  <div className="text-right text-xs text-slate-500"><p><b className="text-ink">{p.status.toLowerCase()}</b>{p.usable ? "" : " · not used by agents"}</p><p className="text-slate-400">{p.dataAgeSeconds === null ? "data age unknown" : `data ${duration(p.dataAgeSeconds)} old`}{p.consecutiveFailures ? ` · ${p.consecutiveFailures} failed pass${p.consecutiveFailures === 1 ? "" : "es"} in a row` : ""}</p></div>
                </li>))}</ul>
            )}
            {h && !h.passLogAvailable ? <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">Exporter pass history is not available to the API, so failures are inferred from file age only.</p> : null}
          </section>

          <section className={cn(card, "overflow-hidden")}>
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold text-ink">Provider data files</h2><p className="mt-0.5 text-xs text-slate-500">News, sentiment, macro, calendar and market data for the research agents. Written by the provider exporter, which is off until the host allow-list is installed.</p></div>
            <ul className="divide-y divide-slate-50">{m.providers.map((p) => (
              <li key={p.name} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex items-center gap-3"><Dot tone={p.present ? "ok" : "off"} /><div><p className="font-mono text-[13px] text-ink">{p.name}</p><p className="text-xs text-slate-400">{p.present ? `${p.format ?? "?"} · ${p.source ?? "?"}` : "not exported yet"}</p></div></div>
                <div className="text-right text-xs text-slate-500">{p.present ? <><p>{p.count ?? 0} item{p.count === 1 ? "" : "s"}</p><p className="text-slate-400">{p.ageSeconds === null ? "" : `${duration(p.ageSeconds)} old`}</p></> : <span className="text-slate-400">—</span>}</div>
              </li>))}</ul>
          </section>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4"><MarketHoursWidget /><RegimeWidget /><CalendarPanel /><NewsPanel /></div>
        </>
      )}
    </div>
  );
}
