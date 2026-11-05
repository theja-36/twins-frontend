"use client";

import React from "react";
import { useLoaded } from "@/components/trading/hooks";
import { Chip, Empty, PageHeader, Skeleton, SourceBadge, Stat, card } from "@/components/trading/ui";
import { ago, duration } from "@/services/trading";
import { getIntakeStatus } from "@/services/system";
import { cn } from "@/lib/utils";

const STATUS_KIND: Record<string, string> = { COMPLETED: "WIN", PENDING: "PENDING", PROCESSING: "OPEN", FAILED: "LOSS", DEAD_LETTER: "REJECTED" };

export default function IntakePage() {
  const { loaded, loading } = useLoaded(() => getIntakeStatus(30), 15_000);
  const s = loaded?.data;
  const c = (k: string) => s?.counts[k] ?? 0;
  const inFlight = c("PENDING") + c("PROCESSING") + c("FAILED"), dead = c("DEAD_LETTER");
  return (
    <div className="space-y-6">
      <PageHeader title="Telegram intake" subtitle="Messages the capture client received from the approved channels, and what became of each. Message text is never shown or stored here." right={<SourceBadge loading={loading} />} />
      {!s ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Skeleton h={110} /><Skeleton h={110} /><Skeleton h={110} /><Skeleton h={110} /></div> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat title="Received (all time)" value={s.total} sub={s.lastReceivedAt ? `last ${ago(s.lastReceivedAt)}` : "nothing yet"} />
            <Stat title="Processed" value={c("COMPLETED")} tone="up" sub={s.lastCompletedAt ? `last ${ago(s.lastCompletedAt)}` : undefined} />
            <Stat title="In flight" value={inFlight} sub={inFlight ? (s.oldestOpenSeconds !== null ? `oldest waiting ${duration(s.oldestOpenSeconds)}` : "waiting") : "nothing waiting"} accent={inFlight > 0} />
            <Stat title="Dead-lettered" value={dead} tone={dead > 0 ? "down" : "flat"} sub={dead > 0 ? "needs an operator replay" : "none"} />
          </div>
          <section className={cn(card, "overflow-hidden")}>
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold text-ink">Recent messages</h2><p className="mt-0.5 text-xs text-slate-500">Newest first. The channel is masked.</p></div>
            {s.recent.length === 0 ? <div className="p-5"><Empty title="No messages yet" hint="They appear here once the capture client delivers one." /></div> : (
              <ul className="divide-y divide-slate-50">{s.recent.map((r) => (
                <li key={r.id + (r.receivedAt ?? "")} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3"><Chip kind={STATUS_KIND[r.status] ?? "CLOSED"}>{r.status.replaceAll("_", " ")}</Chip><div className="min-w-0"><p className="font-mono text-xs text-ink">{r.id} <span className="text-slate-400">· {r.type} · channel {r.channel}</span></p><p className="text-xs text-slate-400">received {ago(r.receivedAt)}{r.completedAt ? ` · done ${ago(r.completedAt)}` : ""}</p></div></div>
                  <span className="text-xs text-slate-500">{r.attempts} attempt{r.attempts === 1 ? "" : "s"}</span>
                </li>))}</ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
