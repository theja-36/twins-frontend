"use client";

import React from "react";
import { useLoaded } from "@/components/trading/hooks";
import { Chip, Empty, PageHeader, SafetyNote, Skeleton, SourceBadge, card } from "@/components/trading/ui";
import { ago } from "@/services/trading";
import { getIntakeStatus } from "@/services/system";
import { useOptional } from "@/components/trading/useOptional";
import { blockerText, entryText, expiryText, filterFeed, loadSelection, saveSelection, summarizeChannels } from "@/lib/channels";
import type { TelegramChannel, TelegramClaim } from "@/types/trading";
import { Pill, Tip, Toggle } from "@/components/motion/Controls";
import { PulseDot, Stagger, StaggerItem } from "@/components/motion/Motion";
import { cn } from "@/lib/utils";

const STATUS_KIND: Record<string, string> = { COMPLETED: "WIN", PENDING: "PENDING", PROCESSING: "OPEN", FAILED: "LOSS", DEAD_LETTER: "REJECTED" };
const fetchRecent = () => getIntakeStatus(100);

export default function ChannelsPage() {
  const { loaded, loading } = useLoaded(fetchRecent, 20_000);
  const chans = useOptional<{ channels: TelegramChannel[] }>("telegram/channels"), claimsRes = useOptional<{ claims: TelegramClaim[] }>("telegram/claims?limit=50");
  const detail = new Map((chans.state === "ready" ? chans.data.channels : []).map((c) => [c.channel, c]));
  const recent = loaded?.data.recent ?? [];
  const channels = React.useMemo(() => summarizeChannels(recent), [recent]);
  const [selected, setSelected] = React.useState<Set<string> | null>(null);
  React.useEffect(() => { setSelected(loadSelection()); }, []);
  const isOn = (c: string): boolean => selected === null || selected.has(c);
  const toggle = (c: string): void => {
    const next = new Set(selected ?? channels.map((x) => x.channel));
    if (next.has(c)) next.delete(c); else next.add(c);
    setSelected(next); saveSelection(next);
  };
  const reset = (): void => { setSelected(null); saveSelection(null); };
  const feed = filterFeed(recent, selected);
  const [showReports, setShowReports] = React.useState(false);
  const health = (iso: string | null): "ok" | "warn" | "off" => { if (!iso) return "off"; const h = (Date.now() - Date.parse(iso)) / 3_600_000; return h < 24 ? "ok" : h < 72 ? "warn" : "off"; };

  return (
    <div className="space-y-6">
      <PageHeader title="Channels" subtitle="The Telegram channels TWINS has captured from, and their recent messages. Message text is never shown. Choosing channels here only filters this page." right={<SourceBadge loading={loading} />} />
      <SafetyNote>Which channels TWINS captures is a host setting. This page cannot change it, and nothing here can place or approve anything.</SafetyNote>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2"><Toggle checked={showReports} onChange={setShowReports} label="Show result reports" disabledReason="Result reports are dropped at intake (parser v3), so none are stored to show." /></div>
      {!loaded ? <Skeleton h={220} /> : channels.length === 0 ? (
        <Empty title="No channels yet" hint="A channel appears here after the capture client has delivered a message from it." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <section className={cn(card, "overflow-hidden")}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold text-ink">Channels <span className="text-xs font-normal text-slate-400">{channels.length} in the last {recent.length} messages</span></h2>{selected !== null ? <button type="button" onClick={reset} className="text-xs font-medium text-royal-600 hover:underline">Show all</button> : null}</div>
            <ul className="divide-y divide-slate-50">{channels.map((c) => (
              <li key={c.channel}>
                <label className="flex cursor-pointer items-start gap-3 px-5 py-3.5">
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-royal-600" checked={isOn(c.channel)} onChange={() => toggle(c.channel)} />
                  <span className="mt-1.5"><PulseDot tone={health(c.lastReceivedAt)} live={health(c.lastReceivedAt) === "ok"} label={`last message ${c.lastReceivedAt ? ago(c.lastReceivedAt) : "never"}`} /></span><span className="min-w-0 flex-1"><span className="block font-mono text-[13px] text-ink">{c.channel}{detail.get(c.channel)?.name ? <span className="ml-2 font-sans text-xs text-slate-500">{detail.get(c.channel)?.name}</span> : null}</span><span className="block text-xs text-slate-500">{c.total} recent · {detail.get(c.channel) ? `${detail.get(c.channel)?.messages} stored · ${detail.get(c.channel)?.claims.claim} claims` : "totals need the newer backend"}{c.lastReceivedAt ? ` · last ${ago(c.lastReceivedAt)}` : ""}</span><span className="mt-1 block"><Tip text="No scorecard exists for this channel yet, so its trust tier is unknown."><Pill tone="mute">trust: unknown</Pill></Tip></span>{detail.get(c.channel)?.captureAllowed === false ? <span className="block text-xs text-amber-700">capture is not allowed for this channel</span> : null}</span>
                </label>
              </li>))}</ul>
          </section>
          <section className={cn(card, "overflow-hidden")}>
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold text-ink">Recent messages <span className="text-xs font-normal text-slate-400">{feed.length} shown</span></h2><p className="mt-0.5 text-xs text-slate-500">Newest first. What became of each message, not its content.</p></div>
            {feed.length === 0 ? <div className="p-5"><Empty title="No channel selected" hint="Tick at least one channel, or choose Show all." /></div> : (
              <ul className="divide-y divide-slate-50">{feed.map((r) => (
                <li key={r.id + (r.receivedAt ?? "")} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3"><Chip kind={STATUS_KIND[r.status] ?? "CLOSED"}>{r.status.replaceAll("_", " ")}</Chip><div className="min-w-0"><p className="font-mono text-xs text-ink">{r.channel}</p><p className="text-xs text-slate-400">{r.type.replaceAll("_", " ")}</p></div></div>
                  <span className="text-xs text-slate-500">{r.receivedAt ? ago(r.receivedAt) : "—"}</span>
                </li>))}</ul>
            )}
          </section>
        </div>
      )}
      <ClaimsPanel res={claimsRes} isOn={isOn} />
    </div>
  );
}

function ClaimsPanel({ res, isOn }: { res: ReturnType<typeof useOptional<{ claims: TelegramClaim[] }>>; isOn: (c: string) => boolean }) {
  if (res.state === "loading") return <Skeleton h={120} />;
  if (res.state === "absent") return <Empty title="Parsed claims are not available yet" hint="This backend does not offer the claims view. It appears here after the backend is updated." />;
  const rows = res.data.claims.filter((c) => isOn(c.channel));
  return (
    <section className={cn(card, "overflow-hidden")}>
      <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold text-ink">Parsed claims <span className="text-xs font-normal text-slate-400">{rows.length} shown</span></h2><p className="mt-0.5 text-xs text-slate-500">What the parser read from each message: contract, levels and what blocks it. The message text is never shown. A stop marked "premium (assumed)" took its basis from the channel's default.</p></div>
      {rows.length === 0 ? <div className="p-5"><Empty title="No claims for the selected channels" hint="Choose more channels, or wait for a message that names a contract." /></div> : (
        <ul className="divide-y divide-slate-50">{rows.map((r) => {
          const c = r.claim;
          return (
            <li key={r.id} className="space-y-1.5 px-5 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-ink">{c ? `${c.underlying ?? "?"} ${c.strike ?? "?"} ${c.optionType ?? "?"}` : "Not a complete claim"}<span className="ml-2 text-xs font-normal text-slate-500">{c ? expiryText(c.expiry) : r.resultKind ?? ""}</span></span>
                <span className="text-xs text-slate-500">{r.channel} · {r.ageSeconds === null ? "—" : ago(r.receivedAt)}</span>
              </div>
              {c ? (
                <p className="font-mono text-xs text-slate-700">{c.action ?? "no action"} · entry {entryText(c.entry)} · stop {c.stopLoss ?? "none"}{c.stopLoss !== null ? ` (${c.levelBasis === "premium" ? (c.levelBasisInferred ? "premium (assumed)" : "premium") : c.levelBasis ?? "basis unclear"})` : ""} · targets {c.targets.length ? c.targets.join(" / ") : "none"}</p>
              ) : null}
              {r.blockers.length > 0 ? <div className="flex flex-wrap gap-1.5">{r.blockers.slice(0, 6).map((b) => <Chip key={b.code} kind="CANCELLED">{blockerText(b.code)}</Chip>)}</div> : null}
            </li>);
        })}</ul>
      )}
    </section>
  );
}
