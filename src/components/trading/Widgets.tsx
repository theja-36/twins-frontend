"use client";

import React from "react";
import Link from "next/link";
import { Activity, ArrowRight, Radar, Send, ShieldCheck, Table2, TrendingUp, ClipboardCheck } from "lucide-react";
import { useLoaded } from "./hooks";
import { Dot, Empty, Skeleton, card } from "./ui";
import { Pill, SampleBadge, Tip } from "@/components/motion/Controls";
import { PulseDot } from "@/components/motion/Motion";
import { getSourceHealth } from "@/services/system";
import { cn } from "@/lib/utils";
import { formatCountdown, sessionAt } from "@/lib/marketHours";
import type { SourceStatus } from "@/types/trading";

const TONE: Record<SourceStatus, "ok" | "warn" | "bad" | "off"> = { OK: "ok", DEGRADED: "warn", STALE: "warn", FAILING: "bad", MISSING: "off", INVALID: "bad" };

/** Compact source-health widget (real data from /market/sources). */
export function SourceHealthWidget({ compact = false }: { compact?: boolean }) {
  const { loaded } = useLoaded(getSourceHealth, 30_000);
  const h = loaded?.data;
  return (
    <section className={cn(card, "overflow-hidden")} aria-label="Source health">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold text-ink">Source health</h2>{h ? <span className="inline-flex items-center gap-2 text-xs text-slate-500"><PulseDot tone={TONE[h.overall]} live={h.overall === "OK"} label={`overall ${h.overall.toLowerCase()}`} />{h.overall.toLowerCase()}</span> : null}</div>
      {!h ? <div className="p-5"><Skeleton h={120} /></div> : (
        <ul className="divide-y divide-slate-50">{h.providers.slice(0, compact ? 7 : 20).map((p) => (
          <li key={p.provider} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
            <span className="flex items-center gap-2.5"><Dot tone={TONE[p.status]} /><span className="font-mono text-[13px] text-ink">{p.provider}</span></span>
            <Tip text={p.reasons.length ? p.reasons.join(", ").replaceAll("_", " ") : "current"}><span className="text-xs text-slate-500">{p.status.toLowerCase()}</span></Tip>
          </li>))}</ul>
      )}
    </section>
  );
}

/** Market regime widget. SAMPLE: the regime detector is built but not connected to any data feed or endpoint. */
export function RegimeWidget() {
  const rows: Array<[string, string, "ok" | "warn" | "info"]> = [["NIFTY", "Range-bound", "info"], ["BANKNIFTY", "Trending up", "ok"], ["SENSEX", "Range-bound", "info"]];
  return (
    <section className={cn(card, "p-5")} aria-label="Market regime (sample)">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold text-ink">Market regime</h2><SampleBadge note="regime detector not connected to a feed" /></div>
      <ul className="mt-3 space-y-2">{rows.map(([n, r, t]) => <li key={n} className="flex items-center justify-between text-sm"><span className="font-mono text-[13px] text-ink">{n}</span><Pill tone={t}>{r}</Pill></li>)}</ul>
      <p className="mt-3 text-xs text-slate-500">Shows how the detector's output will look: trending, range-bound or volatile, with the volatility ratio the sizing shadow needs. Values above are invented.</p>
    </section>
  );
}

const ACTIONS: Array<{ href: string; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }> = [
  { href: "/channels", label: "Channels", hint: "What each Telegram channel sent", icon: Send },
  { href: "/claims", label: "Claims", hint: "Parsed contracts, levels and stops", icon: Table2 },
  { href: "/decisions", label: "Decisions", hint: "Cards and approval status", icon: ClipboardCheck },
  { href: "/market", label: "Market", hint: "Indices, sources, calendar, news", icon: TrendingUp },
  { href: "/positions", label: "Portfolio", hint: "Paper positions and outcomes", icon: Radar },
  { href: "/settings", label: "Settings", hint: "Safety flags and providers", icon: ShieldCheck },
];
export function QuickActions() {
  return (
    <section className={cn(card, "p-5")} aria-label="Quick actions">
      <h2 className="text-base font-semibold text-ink">Quick actions</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">{ACTIONS.map((a) => (
        <li key={a.href}><Link href={a.href} className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-royal-300 hover:bg-royal-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal-500">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-royal-50 text-royal-600"><a.icon className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink">{a.label}</span><span className="block truncate text-xs text-slate-500">{a.hint}</span></span>
          <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-royal-500" aria-hidden />
        </Link></li>))}</ul>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Activity className="h-3.5 w-3.5" aria-hidden />Approving a trade happens in the Telegram approval bot, never here.</p>
    </section>
  );
}
export { Empty };

const SESSION_TONE = { open: "ok", pre_open: "warn", closed: "off", weekend: "off" } as const;

/** Exchange session clock (IST). Weekday schedule only: holidays are not applied, and the widget says so. */
export function MarketHoursWidget() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const s = now ? sessionAt(now) : null;
  return (
    <section className={cn(card, "p-5")} aria-label="Market hours">
      <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-ink">Market hours</h2><span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">IST</span></div>
      {!s ? <div className="mt-4"><Skeleton h={64} /></div> : (
        <>
          <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-ink"><PulseDot tone={SESSION_TONE[s.state]} live={s.state === "open"} label={s.label} />{s.label}</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-ink" aria-live="off">{formatCountdown(s.secondsToChange)}</p>
          <p className="mt-1 text-xs text-slate-500">until {s.nextLabel}</p>
        </>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">Cash and F&amp;O session, Monday to Friday 09:15 to 15:30. Exchange holidays are not applied here, so a holiday still shows as scheduled.</p>
    </section>
  );
}
