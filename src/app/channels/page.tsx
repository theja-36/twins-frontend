"use client";

import React from "react";
import { useLoaded } from "@/components/trading/hooks";
import { Chip, Empty, PageHeader, SafetyNote, Skeleton, SourceBadge, card } from "@/components/trading/ui";
import { ago } from "@/services/trading";
import { getIntakeStatus } from "@/services/system";
import { filterFeed, loadSelection, saveSelection, summarizeChannels } from "@/lib/channels";
import { cn } from "@/lib/utils";

const STATUS_KIND: Record<string, string> = { COMPLETED: "WIN", PENDING: "PENDING", PROCESSING: "OPEN", FAILED: "LOSS", DEAD_LETTER: "REJECTED" };
const fetchRecent = () => getIntakeStatus(100);

export default function ChannelsPage() {
  const { loaded, loading } = useLoaded(fetchRecent, 20_000);
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

  return (
    <div className="space-y-6">
      <PageHeader title="Channels" subtitle="The Telegram channels TWINS has captured from, and their recent messages. Message text is never shown. Choosing channels here only filters this page." right={<SourceBadge loading={loading} />} />
      <SafetyNote>Which channels TWINS captures is a host setting. This page cannot change it, and nothing here can place or approve anything.</SafetyNote>
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
                  <span className="min-w-0 flex-1"><span className="block font-mono text-[13px] text-ink">{c.channel}</span><span className="block text-xs text-slate-500">{c.total} message{c.total === 1 ? "" : "s"}{c.lastReceivedAt ? ` · last ${ago(c.lastReceivedAt)}` : ""}</span></span>
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
    </div>
  );
}
