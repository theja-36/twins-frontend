"use client";

import React from "react";
import Link from "next/link";
import { CalendarClock, Landmark, Newspaper, PlugZap } from "lucide-react";
import { useLoaded } from "./hooks";
import { Empty, Skeleton, card } from "./ui";
import { EquityAreaChart, ShareBars } from "./charts";
import { useOptional } from "./useOptional";
import { Pill, SampleBadge } from "@/components/motion/Controls";
import { CountUp } from "@/components/motion/Motion";
import { getOutcomes, getOutcomeStats, getPositions } from "@/services/trading";
import { currentDrawdownR, equityCurve, exposureBySymbol } from "@/lib/portfolio";
import type { TelegramChannel } from "@/types/trading";
import { cn } from "@/lib/utils";

/** Portfolio charts and outcome-attribution summary (real paper data; empty when paper trading is off). */
export function PortfolioPanels() {
  const out = useLoaded(getOutcomes, 30_000), pos = useLoaded(getPositions, 15_000), stats = useLoaded(getOutcomeStats, 30_000);
  const curve = React.useMemo(() => equityCurve(out.loaded?.data ?? []), [out.loaded]);
  const exp = exposureBySymbol(pos.loaded?.data ?? []);
  const st = stats.loaded?.data;
  const reasons = st ? Object.entries(st.byCloseReason).map(([name, g]) => ({ name: name.replaceAll("_", " ").toLowerCase(), value: Math.round(g.totalR * 100) / 100, tone: g.totalR > 0 ? ("up" as const) : g.totalR < 0 ? ("down" as const) : ("flat" as const) })) : [];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={cn(card, "p-5")} aria-label="Equity curve">
        <h2 className="mb-2 text-base font-semibold text-ink">Equity curve <span className="text-xs font-normal text-slate-400">paper, cumulative R</span></h2>
        {!out.loaded ? <Skeleton h={200} /> : curve.length === 0 ? <Empty title="No closed trades" hint="The curve starts with the first simulated trade that closes." /> : <EquityAreaChart curve={curve} metric="r" height={200} />}
        {curve.length ? <p className="mt-1 text-xs text-slate-500">Current drawdown <span className="font-mono">{currentDrawdownR(curve)} R</span> from the peak.</p> : null}
      </section>
      <section className={cn(card, "p-5")} aria-label="Exposure by symbol">
        <h2 className="mb-2 text-base font-semibold text-ink">Exposure by symbol <span className="text-xs font-normal text-slate-400">open and pending, ₹</span></h2>
        {!pos.loaded ? <Skeleton h={200} /> : exp.length === 0 ? <Empty title="Nothing exposed" hint="No open or pending paper positions." /> : <ShareBars rows={exp.map((e) => ({ name: e.symbol, value: e.notional }))} label={`Exposure by symbol: ${exp.map((e) => `${e.symbol} ${e.share}%`).join(", ")}`} />}
        <p className="mt-1 text-xs text-slate-500">Sector breakdown needs a sector tag per instrument, which the instrument reference does not carry yet.</p>
      </section>
      <section className={cn(card, "p-5 lg:col-span-2")} aria-label="Outcome attribution">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold text-ink">Outcome attribution</h2>{st ? <Pill tone={st.sampleIsMeaningful ? "ok" : "warn"}>{st.sampleIsMeaningful ? "sample is meaningful" : `too thin to read (need ${st.minSampleForMeaning})`}</Pill> : null}</div>
        {!st ? <Skeleton h={120} /> : st.n === 0 ? <Empty title="No outcomes yet" hint="Attribution by close reason, source trust and research assessment appears once paper trades close." /> : (
          <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
            <dl className="grid grid-cols-2 gap-3 text-sm"><Fact k="Trades" v={st.n} /><Fact k="Win rate" v={st.winRate === null ? null : st.winRate * 100} suffix="%" decimals={0} /><Fact k="Expectancy" v={st.expectancyR} suffix=" R" decimals={2} /><Fact k="Profit factor" v={st.profitFactor} decimals={2} /><Fact k="Max drawdown" v={st.maxDrawdownR} suffix=" R" decimals={2} /><Fact k="Avg hold" v={st.avgHoldingSeconds === null ? null : st.avgHoldingSeconds / 60} suffix=" min" decimals={0} /></dl>
            {reasons.length ? <div><p className="mb-1 text-xs text-slate-500">Total R by close reason</p><ShareBars rows={reasons} height={Math.max(120, reasons.length * 36)} label="Total R by close reason" /></div> : null}
          </div>
        )}
      </section>
    </div>
  );
}
function Fact({ k, v, suffix = "", decimals = 0 }: { k: string; v: number | null; suffix?: string; decimals?: number }) {
  return <div><dt className="text-[11px] font-mono uppercase tracking-wider text-slate-500">{k}</dt><dd className="mt-0.5 text-lg font-semibold text-ink"><CountUp value={v} decimals={decimals} suffix={suffix} className="font-mono tabular-nums" /></dd></div>;
}

/** Sample economic calendar. SAMPLE: the calendar file exists on the server but no read route returns its events yet. */
export function CalendarPanel() {
  const rows: Array<[string, string, "bad" | "warn" | "mute"]> = [["Tomorrow 18:00", "US CPI release", "bad"], ["Wed 19:30", "US Fed policy decision", "bad"], ["Thu 10:00", "India CPI inflation", "warn"], ["Fri 17:30", "US jobs report", "warn"]];
  return (
    <section className={cn(card, "p-5")} aria-label="Economic calendar (sample)">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-base font-semibold text-ink"><CalendarClock className="h-4 w-4 text-royal-500" aria-hidden />Economic calendar</h2><SampleBadge note="no events route yet" /></div>
      <ul className="mt-3 divide-y divide-slate-50">{rows.map(([when, what, tone]) => <li key={what} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span><span className="block text-ink">{what}</span><span className="block text-xs text-slate-500">{when}</span></span><Pill tone={tone}>{tone === "bad" ? "high impact" : "medium"}</Pill></li>)}</ul>
      <p className="mt-2 text-xs text-slate-500">Layout preview with invented events. High-impact events within 4 hours halve the sizing shadow's size.</p>
    </section>
  );
}

/** Sample news feed. SAMPLE: Marketaux is not activated and the Telegram commentary parser is not wired. */
export function NewsPanel() {
  const rows: Array<[string, string, string, "bad" | "ok" | "mute"]> = [["RELIANCE", "Marketaux", "negative", "bad"], ["Rates", "Telegram commentary", "neutral", "mute"], ["HDFCBANK", "Marketaux", "positive", "ok"]];
  return (
    <section className={cn(card, "p-5")} aria-label="News feed (sample)">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-base font-semibold text-ink"><Newspaper className="h-4 w-4 text-royal-500" aria-hidden />News</h2><SampleBadge note="Marketaux and channel commentary not connected" /></div>
      <ul className="mt-3 divide-y divide-slate-50">{rows.map(([topic, src, tone, t]) => <li key={topic} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span><span className="block font-mono text-[13px] text-ink">{topic}</span><span className="block text-xs text-slate-500">{src}</span></span><Pill tone={t}>{tone}</Pill></li>)}</ul>
      <p className="mt-2 text-xs text-slate-500">Structured items only: symbol, theme and tone. Headlines and channel sentences are never shown or passed on.</p>
    </section>
  );
}

/** Settings: channel management is view-only; ingestion is a host setting. */
export function ChannelsViewOnly() {
  const res = useOptional<{ channels: TelegramChannel[] }>("telegram/channels");
  return (
    <section className={cn(card, "p-5")} aria-label="Channel management (view only)">
      <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-ink">Channels</h2><Link href="/channels" className="text-xs font-medium text-royal-600 hover:underline">Open Channels</Link></div>
      {res.state === "loading" ? <Skeleton h={80} /> : res.state === "absent" ? <p className="mt-2 text-sm text-slate-500">The channel list needs the newer backend.</p> : res.data.channels.length === 0 ? <p className="mt-2 text-sm text-slate-500">No channel has been captured yet.</p> : (
        <ul className="mt-3 divide-y divide-slate-50">{res.data.channels.map((c) => <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="font-mono text-[13px] text-ink">{c.channel}{c.name ? <span className="ml-2 font-sans text-xs text-slate-500">{c.name}</span> : null}</span><Pill tone={c.captureAllowed === true ? "ok" : c.captureAllowed === false ? "warn" : "mute"}>{c.captureAllowed === true ? "capture allowed" : c.captureAllowed === false ? "capture not allowed" : "capture status unknown"}</Pill></li>)}</ul>
      )}
      <p className="mt-3 text-xs text-slate-500">View only. Which channels are captured is changed on the host, not from this page.</p>
    </section>
  );
}

/** Settings: broker connections are Phase 5 and not connected. */
export function BrokerPlaceholder() {
  const rows: Array<[string, string]> = [["Zerodha Kite Connect", "Data only today (read-only). Orders are not enabled."], ["Groww", "Terms check pending. Not connected."], ["Dhan", "Skipped. Not connected."]];
  return (
    <section className={cn(card, "p-5")} aria-label="Broker connections (not connected)">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-base font-semibold text-ink"><Landmark className="h-4 w-4 text-royal-500" aria-hidden />Broker connections</h2><Pill tone="mute"><PlugZap className="h-3 w-3" aria-hidden />Phase 5 · not built</Pill></div>
      <ul className="mt-3 divide-y divide-slate-50">{rows.map(([n, d]) => <li key={n} className="py-2.5 text-sm"><span className="font-medium text-ink">{n}</span><span className="block text-xs text-slate-500">{d}</span></li>)}</ul>
      <p className="mt-2 text-xs text-slate-500">No order can be placed anywhere in TWINS. Stage 6 is off.</p>
    </section>
  );
}
