"use client";

import React, { useMemo, useState } from "react";
import { useLoaded } from "@/components/trading/hooks";
import { DataBanner, Empty, PageHeader, Skeleton, SourceBadge, card } from "@/components/trading/ui";
import { ago } from "@/services/trading";
import { getNotifications } from "@/services/system";
import { cn } from "@/lib/utils";

const SEV = [["all", "All"], ["critical", "Critical"], ["warning", "Warnings"], ["info", "Info"]] as const;
const DOT: Record<string, string> = { critical: "bg-rose-500", warning: "bg-amber-500", info: "bg-royal-500" };
const KIND: Record<string, string> = { safety_control: "Safety control", circuit_breaker: "Circuit breaker", approval: "Approval", paper_trade: "Paper trade", paper_switch: "Paper switch", intake: "Intake" };

export default function NotificationsPage() {
  const { loaded, loading, refresh } = useLoaded(() => getNotifications(200), 20_000);
  const [sev, setSev] = useState<(typeof SEV)[number][0]>("all");
  const [kind, setKind] = useState("all");
  const all = loaded?.data ?? [];
  const kinds = useMemo(() => ["all", ...Array.from(new Set(all.map((n) => n.kind)))], [all]);
  const rows = all.filter((n) => (sev === "all" || n.severity === sev) && (kind === "all" || n.kind === kind));
  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Notable things the system recorded: safety switches, breakers, approvals, simulated trades and paper-switch changes." right={<SourceBadge source={loaded?.source} note={loaded?.note} loading={loading} />} />
      <DataBanner source={loaded?.source} note={loaded?.note} onRetry={refresh} />
      <p className="text-xs text-slate-500">This is the system&apos;s own audit trail. Telegram alert deliveries are not stored in the database, so they are not listed here.</p>
      <div className="flex flex-wrap gap-2">
        {SEV.map(([k, l]) => <button key={k} onClick={() => setSev(k)} className={cn("rounded-full border px-3.5 py-1.5 text-xs font-medium transition", sev === k ? "border-royal-600 bg-royal-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>{l}</button>)}
        <span className="mx-1 hidden h-7 w-px bg-slate-200 sm:block" />
        {kinds.map((k) => <button key={k} onClick={() => setKind(k)} className={cn("rounded-full border px-3.5 py-1.5 text-xs font-medium transition", kind === k ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>{k === "all" ? "Everything" : KIND[k] ?? k}</button>)}
      </div>
      {!loaded ? <Skeleton h={260} /> : rows.length === 0 ? <Empty title="No notifications match" hint={all.length === 0 ? "Nothing has been recorded yet." : "Try a different filter."} /> : (
        <ul className={cn(card, "divide-y divide-slate-50 overflow-hidden")}>
          {rows.map((n) => (
            <li key={n.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
              <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", DOT[n.severity])} aria-label={n.severity} />
              <div className="min-w-0 flex-1"><p className="text-sm font-medium text-ink">{n.title}</p><p className="mt-0.5 text-xs text-slate-500">{KIND[n.kind] ?? n.kind}{n.detail ? ` · ${n.detail}` : ""}</p></div>
              <time className="shrink-0 text-xs text-slate-400" dateTime={n.at} title={new Date(n.at).toLocaleString("en-IN")}>{ago(n.at)}</time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
