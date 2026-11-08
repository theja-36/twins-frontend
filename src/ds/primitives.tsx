"use client";
import React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONE_BG, TONE_SYMBOL, TONE_TEXT, type Tone } from "./tone";

export function Card({ children, className, as: As = "section", label }: { children: React.ReactNode; className?: string; as?: "section" | "div" | "article"; label?: string }) {
  return <As aria-label={label} className={cn("min-w-0 rounded-lg border border-line bg-surface", className)}>{children}</As>;
}
export function CardHeader({ title, subtitle, right, className }: { title: React.ReactNode; subtitle?: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3", className)}><div className="min-w-0"><h2 className="text-sm font-semibold text-fg">{title}</h2>{subtitle ? <p className="mt-0.5 text-xs text-fg-muted">{subtitle}</p> : null}</div>{right ? <div className="flex flex-wrap items-center gap-2">{right}</div> : null}</div>;
}
export const CardBody = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={cn("p-4", className)}>{children}</div>;

export function PageHeader({ title, description, actions, badges }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; badges?: React.ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>{badges}</div>{description ? <p className="mt-1 max-w-3xl text-sm text-fg-muted">{description}</p> : null}</div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** A labelled figure. `value` is already formatted text (money arrives from the backend as decimal strings and is only formatted here, never computed). */
export function Metric({ label, value, hint, tone = "mute", sub, emphasis = false }: { label: string; value: React.ReactNode; hint?: string; tone?: Tone; sub?: React.ReactNode; emphasis?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-surface p-3" title={hint}>
      <div className="label truncate">{label}</div>
      <div className={cn("num mt-1 truncate font-semibold", emphasis ? "text-2xl" : "text-lg", tone === "mute" ? "text-fg" : TONE_TEXT[tone])}>{value}</div>
      {sub ? <div className="mt-0.5 truncate text-xs text-fg-muted">{sub}</div> : null}
    </div>
  );
}
export const MetricGrid = ({ children, cols = 4 }: { children: React.ReactNode; cols?: 2 | 3 | 4 | 5 | 6 }) => <div className={cn("grid grid-cols-2 gap-3", { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4", 5: "sm:grid-cols-3 lg:grid-cols-5", 6: "sm:grid-cols-3 lg:grid-cols-6" }[cols])}>{children}</div>;

/** The one badge: a tone, a symbol AND text. Everything below (decision, workflow, risk, provenance) is built on it so no state is conveyed by colour alone. */
export function Badge({ tone = "mute", children, title, className }: { tone?: Tone; children: React.ReactNode; title?: string; className?: string }) {
  return <span title={title} className={cn("inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-2xs font-semibold", TONE_BG[tone], TONE_TEXT[tone], className)}><span aria-hidden className="text-[8px]">{TONE_SYMBOL[tone]}</span><span className="truncate">{children}</span></span>;
}
/** DECISION OUTCOME (what the engine concluded). Never confused with the workflow state below. */
export const DECISION_TONE: Record<string, Tone> = { QUALIFIED: "ok", WAIT: "warn", REJECT: "bad", EVALUATION_ONLY: "info", NO_TRADE: "mute" };
export const DecisionBadge = ({ outcome }: { outcome: string }) => <Badge tone={DECISION_TONE[outcome] ?? "mute"} title="Decision outcome: what the engine concluded. It is not an approval.">{outcome.replace("_", " ")}</Badge>;
/** WORKFLOW STATE (where the decision is in its lifecycle). PENDING/APPROVED/... say nothing about the outcome. */
export const WORKFLOW_TONE: Record<string, Tone> = { PENDING: "info", APPROVED: "ok", REJECTED: "bad", EXPIRED: "mute", SUPERSEDED: "mute", CANCELLED: "mute" };
export const WorkflowBadge = ({ state }: { state: string }) => <Badge tone={WORKFLOW_TONE[state] ?? "mute"} title="Workflow state: where the decision is in its lifecycle. APPROVED is a human act and is not an execution.">{state}</Badge>;
export const RISK_TONE: Record<string, Tone> = { PASS: "ok", RESTRICTED: "warn", BLOCKED: "bad" };
export const RiskBadge = ({ verdict }: { verdict: string }) => <Badge tone={RISK_TONE[verdict] ?? "mute"} title="Risk verdict: PASS, RESTRICTED (reduced size) or BLOCKED. No score overrides it.">{`RISK ${verdict}`}</Badge>;
/** Where a figure comes from. DEMO and FIXTURE data must never look like live data. */
export type Provenance = "LIVE" | "DEMO" | "FIXTURE" | "NOT_VALIDATED_FIXTURE" | "PAPER" | "SAMPLE" | "UNAVAILABLE";
const PROV: Record<Provenance, { tone: Tone; text: string; title: string }> = {
  LIVE: { tone: "ok", text: "LIVE READ", title: "Read from the backend just now. (Paper trading data is still simulated: see the PAPER badge.)" },
  DEMO: { tone: "warn", text: "DEMO", title: "Development fixture. Invented values, not real trading information." },
  FIXTURE: { tone: "warn", text: "FIXTURE", title: "Built on fixture data. Not market data." },
  NOT_VALIDATED_FIXTURE: { tone: "warn", text: "NOT VALIDATED · FIXTURE", title: "Rests on fixture-backed outcomes: not validated performance." },
  PAPER: { tone: "info", text: "PAPER", title: "Simulated paper trading. Not live trading, not real money." },
  SAMPLE: { tone: "warn", text: "SAMPLE", title: "Sample content: this feed is not connected." },
  UNAVAILABLE: { tone: "mute", text: "UNAVAILABLE", title: "No backend route provides this yet." },
};
export const ProvenanceBadge = ({ kind }: { kind: Provenance }) => <Badge tone={PROV[kind].tone} title={PROV[kind].title}>{PROV[kind].text}</Badge>;

export function Tabs<T extends string>({ value, onChange, tabs, label }: { value: T; onChange: (v: T) => void; tabs: ReadonlyArray<{ value: T; label: string; count?: number }>; label: string }) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: React.KeyboardEvent, i: number): void => {
    const n = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i - 1 + tabs.length) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
    if (n >= 0) { e.preventDefault(); onChange((tabs[n] as { value: T }).value); refs.current[n]?.focus(); }
  };
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t, i) => (
        <button key={t.value} ref={(el) => { refs.current[i] = el; }} role="tab" type="button" id={`tab-${t.value}`} aria-selected={value === t.value} aria-controls={`panel-${t.value}`} tabIndex={value === t.value ? 0 : -1} onClick={() => onChange(t.value)} onKeyDown={(e) => onKey(e, i)}
          className={cn("-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium", value === t.value ? "border-accent text-fg" : "border-transparent text-fg-muted hover:text-fg")}>{t.label}{t.count !== undefined ? <span className="num ml-1.5 text-xs text-fg-faint">{t.count}</span> : null}</button>
      ))}
    </div>
  );
}
export const TabPanel = ({ id, active, children }: { id: string; active: boolean; children: React.ReactNode }) => (active ? <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} className="pt-4">{children}</div> : null);

export function Disclosure({ title, children, defaultOpen = false, right }: { title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; right?: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen), id = React.useId();
  return (
    <div className="rounded-lg border border-line bg-surface">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium"><span className="min-w-0">{title}</span><span className="flex items-center gap-2">{right}<ChevronDown className={cn("h-4 w-4 text-fg-muted transition-transform", open && "rotate-180")} aria-hidden /></span></button>
      {open ? <div id={id} className="border-t border-line p-3 text-sm">{children}</div> : null}
    </div>
  );
}
export function KeyValue({ rows, cols = 1 }: { rows: ReadonlyArray<[string, React.ReactNode]>; cols?: 1 | 2 }) {
  return <dl className={cn("grid gap-x-6 gap-y-2 text-sm", cols === 2 && "sm:grid-cols-2")}>{rows.map(([k, v]) => <div key={k} className="flex min-w-0 items-baseline justify-between gap-3 border-b border-line/60 pb-1.5 last:border-0"><dt className="shrink-0 text-fg-muted">{k}</dt><dd className="num min-w-0 truncate text-right text-fg">{v}</dd></div>)}</dl>;
}
export interface TimelineItem { at: string | null; title: React.ReactNode; detail?: React.ReactNode; tone?: Tone }
export function Timeline({ items, label }: { items: readonly TimelineItem[]; label: string }) {
  return (
    <ol aria-label={label} className="relative space-y-3 border-l border-line pl-4">
      {items.map((it, i) => <li key={i} className="relative"><span aria-hidden className={cn("absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border-2 border-bg", it.tone ? ({ ok: "bg-pos", warn: "bg-warn", bad: "bg-neg", info: "bg-info", mute: "bg-fg-faint", accent: "bg-accent" }[it.tone]) : "bg-fg-faint")} /><div className="text-sm text-fg">{it.title}</div>{it.detail ? <div className="text-xs text-fg-muted">{it.detail}</div> : null}{it.at ? <time className="num text-2xs text-fg-faint" dateTime={it.at}>{new Date(it.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })} IST</time> : null}</li>)}
    </ol>
  );
}
export interface EvidenceItem { id: string; kind: string; source: string; at: string | null; stance: "SUPPORTS" | "CONTRADICTS" | "NEUTRAL" | "MISSING"; summary: string; freshness?: "FRESH" | "STALE" | "UNKNOWN"; reliability?: string; provenance?: Provenance; ref?: string; href?: string }
const STANCE: Record<EvidenceItem["stance"], Tone> = { SUPPORTS: "ok", CONTRADICTS: "bad", NEUTRAL: "mute", MISSING: "warn" };
/** Evidence is shown with its stance (as text), source, time, freshness and reference so a reader can trace a conclusion back to what it rests on. */
export function EvidencePanel({ items, empty = "No evidence recorded." }: { items: readonly EvidenceItem[]; empty?: string }) {
  if (!items.length) return <p className="text-sm text-fg-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line rounded-lg border border-line">
      {items.map((e) => (
        <li key={e.id} className="space-y-1 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2"><Badge tone={STANCE[e.stance]}>{e.stance}</Badge><span className="text-xs font-medium text-fg">{e.kind}</span><span className="text-xs text-fg-faint">{e.source}</span>{e.freshness === "STALE" ? <Badge tone="warn">STALE</Badge> : null}{e.provenance ? <ProvenanceBadge kind={e.provenance} /> : null}</div>
          <p className="text-sm text-fg-muted">{e.summary}</p>
          <div className="num flex flex-wrap gap-x-3 text-2xs text-fg-faint">{e.at ? <span>{new Date(e.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })} IST</span> : <span>time not recorded</span>}{e.reliability ? <span>reliability: {e.reliability}</span> : null}{e.ref ? (e.href ? <Link href={e.href} className="text-accent underline">{e.ref}</Link> : <span>{e.ref}</span>) : null}</div>
        </li>
      ))}
    </ul>
  );
}
export function RiskLimitBar({ label, used, limit, unit = "", hint }: { label: string; used: number; limit: number; unit?: string; hint?: string }) {
  const frac = limit > 0 ? Math.min(1, used / limit) : 0, tone: Tone = frac >= 1 ? "bad" : frac >= 0.8 ? "warn" : "ok";
  return (
    <div title={hint}><div className="flex items-baseline justify-between text-xs"><span className="text-fg-muted">{label}</span><span className="num text-fg">{used}{unit} / {limit}{unit} <span className={TONE_TEXT[tone]}>({Math.round(frac * 100)}%{frac >= 1 ? " · LIMIT REACHED" : frac >= 0.8 ? " · NEAR LIMIT" : ""})</span></span></div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used} aria-label={label}><div className={cn("h-full", { ok: "bg-pos", warn: "bg-warn", bad: "bg-neg", info: "bg-info", mute: "bg-fg-faint", accent: "bg-accent" }[tone])} style={{ width: `${frac * 100}%` }} /></div></div>
  );
}
