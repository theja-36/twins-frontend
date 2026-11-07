"use client";

import React from "react";
import { Filter } from "lucide-react";
import { useOptional } from "@/components/trading/useOptional";
import { Empty, PageHeader, SafetyNote, Skeleton, SourceBadge, card } from "@/components/trading/ui";
import { Stagger, StaggerItem } from "@/components/motion/Motion";
import { Drawer, Modal } from "@/components/motion/Overlay";
import { Pill, Tip } from "@/components/motion/Controls";
import { ago } from "@/services/trading";
import { blockerText, entryText, expiryText } from "@/lib/channels";
import { claimTitle, filterClaims, NO_FILTER, qualityCounts, stopQuality, type ClaimFilter, type Quality } from "@/lib/claims";
import type { TelegramClaim } from "@/types/trading";
import { cn } from "@/lib/utils";

const QTONE: Record<Quality["level"], "ok" | "warn" | "bad" | "mute"> = { good: "ok", caution: "warn", poor: "bad", none: "mute" };

export default function ClaimsPage() {
  const res = useOptional<{ claims: TelegramClaim[] }>("telegram/claims?limit=100");
  const [f, setF] = React.useState<ClaimFilter>(NO_FILTER);
  const [open, setOpen] = React.useState<TelegramClaim | null>(null);
  const [help, setHelp] = React.useState(false);
  const rows = res.state === "ready" ? res.data.claims : [];
  const shown = filterClaims(rows, f);
  const channels = [...new Set(rows.map((r) => r.channel))].sort();
  const q = qualityCounts(shown);
  const set = <K extends keyof ClaimFilter>(k: K, v: ClaimFilter[K]): void => setF((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <PageHeader title="Claims" subtitle="What the parser read from each Telegram message: the contract, the levels, how reliable the stop is, and what blocks it. Message text is never shown." right={<SourceBadge />} />
      <SafetyNote>Claims are unverified readings of messages. None can become a trade without the contract data, a usable stop and a human approval in Telegram.</SafetyNote>
      <button type="button" onClick={() => setHelp(true)} className="text-xs font-medium text-royal-600 underline-offset-2 hover:underline">How is stop quality graded?</button>
      <Modal open={help} onClose={() => setHelp(false)} title="How stop quality is graded">
        <ul className="space-y-2">
          <li><b className="text-ink">Clear (good):</b> the message states the stop and says whether it is a premium or an underlying level.</li>
          <li><b className="text-ink">Assumed (caution):</b> the message was silent on the basis; the channel's configured default (premium) was applied because the stop is a small fraction of the strike. It is an assumption, never a stated fact.</li>
          <li><b className="text-ink">Unclear (poor):</b> the basis is missing or the message names both a premium and an underlying basis, so the stop cannot be used.</li>
          <li><b className="text-ink">None:</b> no stop was found, or the message is not a claim.</li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">Grades describe the reading of a message. They are not advice and never approve anything.</p>
        <button type="button" onClick={() => setHelp(false)} className="mt-4 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Close</button>
      </Modal>
      {res.state === "loading" ? <Skeleton h={260} /> : res.state === "absent" ? <Empty title="The claims view is not available on this backend yet" hint="It appears after the backend is updated with the read-only Telegram routes." /> : (<>
        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([["good", "Stop clear"], ["caution", "Stop assumed"], ["poor", "Stop unclear"], ["none", "No stop / no claim"]] as const).map(([k, l]) => (
            <StaggerItem key={k}><div className={cn(card, "p-4")}><p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">{l}</p><p className="mt-1 font-mono text-2xl font-semibold text-ink">{q[k]}</p></div></StaggerItem>))}
        </Stagger>

        <section className={cn(card, "p-4")} aria-label="Filters">
          <div className="flex flex-wrap items-end gap-3 text-sm">
            <Filter className="mb-2 h-4 w-4 text-slate-400" aria-hidden />
            <Sel label="Underlying" value={f.underlying} onChange={(v) => set("underlying", v)} options={[["ALL", "All"], ["NIFTY", "NIFTY"], ["BANKNIFTY", "BANKNIFTY"], ["SENSEX", "SENSEX"]]} />
            <Sel label="Side" value={f.side} onChange={(v) => set("side", v as ClaimFilter["side"])} options={[["ALL", "All"], ["buy", "Buy"], ["sell", "Sell"], ["none", "No action"]]} />
            <Sel label="Status" value={f.outcome} onChange={(v) => set("outcome", v as ClaimFilter["outcome"])} options={[["ALL", "All"], ["INSUFFICIENT_EVIDENCE", "Insufficient evidence"], ["REJECT", "Rejected"]]} />
            <Sel label="Stop" value={f.stop} onChange={(v) => set("stop", v as ClaimFilter["stop"])} options={[["ALL", "All"], ["with", "Has a stop"], ["without", "No stop"]]} />
            <Sel label="Age" value={String(f.sinceHours ?? "")} onChange={(v) => set("sinceHours", v === "" ? null : Number(v))} options={[["", "Any time"], ["24", "Last 24 h"], ["168", "Last 7 days"]]} />
            <Sel label="Channel" value={f.channel} onChange={(v) => set("channel", v)} options={[["ALL", "All"], ...channels.map((c) => [c, c] as [string, string])]} />
            <button type="button" onClick={() => setF(NO_FILTER)} className="mb-0.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Reset</button>
            <span className="mb-1.5 ml-auto text-xs text-slate-500">{shown.length} of {rows.length}</span>
          </div>
        </section>

        <section className={cn(card, "overflow-hidden")}>
          {shown.length === 0 ? <div className="p-5"><Empty title="No claims match" hint={rows.length === 0 ? "No message has named a contract yet." : "Relax a filter or press Reset."} /></div> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm">
              <thead><tr className="text-left text-[11px] font-mono uppercase tracking-wider text-slate-500"><th className="px-5 py-3">Contract</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Entry</th><th className="px-3 py-3">Stop</th><th className="px-3 py-3">Targets</th><th className="px-3 py-3">Expiry</th><th className="px-3 py-3">Age</th></tr></thead>
              <tbody>{shown.map((r) => { const c = r.claim, sq = stopQuality(c); return (
                <tr key={r.id} tabIndex={0} onClick={() => setOpen(r)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(r); } }} aria-label={`Open details for ${claimTitle(c)}`}
                  className="cursor-pointer border-t border-slate-50 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-royal-500">
                  <td className="px-5 py-3 font-medium text-ink">{claimTitle(c)}<span className="ml-2 font-mono text-[11px] text-slate-400">{r.channel}</span></td>
                  <td className="px-3 py-3">{c?.action ?? <span className="text-slate-400">none</span>}</td>
                  <td className="px-3 py-3 font-mono text-xs">{entryText(c?.entry)}</td>
                  <td className="px-3 py-3"><Tip text={sq.detail}><span className="inline-flex items-center gap-2"><span className="font-mono text-xs">{c?.stopLoss ?? "—"}</span><Pill tone={QTONE[sq.level]}>{sq.label}</Pill></span></Tip></td>
                  <td className="px-3 py-3 font-mono text-xs">{c?.targets.length ? c.targets.join(" / ") : "—"}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{c ? expiryText(c.expiry) : "—"}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{ago(r.receivedAt)}</td></tr>); })}</tbody></table></div>
          )}
        </section>
      </>)}
      <Drawer open={open !== null} onClose={() => setOpen(null)} title={open ? claimTitle(open.claim) : "Claim"}>{open ? <Detail r={open} /> : null}</Drawer>
    </div>
  );
}

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  const id = React.useId();
  return (<div className="flex flex-col gap-1"><label htmlFor={id} className="text-[11px] font-mono uppercase tracking-wider text-slate-500">{label}</label>
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal-500">{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>);
}

function Detail({ r }: { r: TelegramClaim }) {
  const c = r.claim, sq = stopQuality(c);
  const rows: Array<[string, React.ReactNode]> = c ? [
    ["Action", c.action ?? "not stated"], ["Underlying", c.underlying ?? "—"], ["Strike and type", `${c.strike ?? "?"} ${c.optionType ?? "?"}`], ["Expiry", expiryText(c.expiry)], ["Entry", entryText(c.entry)],
    ["Stop", c.stopLoss ?? "none"], ["Targets", c.targets.length ? c.targets.join(" / ") : "none"],
  ] : [];
  return (
    <div className="space-y-5 text-sm">
      <p className="text-xs text-slate-500">{r.channel} · {ago(r.receivedAt)} · parser {r.parserVersion}</p>
      {c ? <dl className="divide-y divide-slate-100">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-slate-500">{k}</dt><dd className="text-right font-mono text-ink">{v}</dd></div>)}</dl> : <p className="text-slate-600">This message did not parse into a complete claim ({r.resultKind ?? "unknown"}).</p>}
      <div className="rounded-xl border border-slate-100 p-4"><div className="flex items-center justify-between"><h3 className="font-semibold text-ink">Stop-loss quality</h3><Pill tone={QTONE[sq.level]}>{sq.label}</Pill></div>
        <p className="mt-2 text-slate-600">{sq.detail}</p>{sq.pctOfStrike !== null ? <p className="mt-1 font-mono text-xs text-slate-500">stop is {sq.pctOfStrike}% of the strike</p> : null}</div>
      <div><h3 className="font-semibold text-ink">What blocks it</h3>{r.blockers.length === 0 ? <p className="mt-1 text-slate-500">Nothing recorded.</p> : <ul className="mt-2 flex flex-wrap gap-1.5">{r.blockers.map((b) => <li key={b.code}><Pill tone={b.severity === "reject" || b.severity === "error" ? "bad" : "warn"}>{blockerText(b.code)}</Pill></li>)}</ul>}</div>
      <p className="text-xs text-slate-500">Status: {r.assessmentOutcome?.replaceAll("_", " ").toLowerCase() ?? "not assessed"}. This is a reading of a message, not an instruction.</p>
    </div>
  );
}
