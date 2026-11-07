"use client";

import React from "react";
import { ConfigView } from "@/components/trading/ConfigView";
import { PageHeader, card } from "@/components/trading/ui";
import { SourceHealthWidget } from "@/components/trading/Widgets";
import { BrokerPlaceholder, ChannelsViewOnly } from "@/components/trading/Panels";
import { cn } from "@/lib/utils";

const GROUPS: Array<{ label: string; items: Array<[string, string]> }> = [
  { label: "Safety", items: [["safety", "Safety posture"], ["readiness", "Paper readiness"]] },
  { label: "Trading", items: [["paper", "Paper trading"], ["engine", "Research engine"], ["risk", "Risk limits"]] },
  { label: "Data", items: [["data", "Sources and channels"]] },
  { label: "Connections", items: [["broker", "Broker"]] },
];

/** Grouped settings: an in-page index on the left (large screens), sections on the right. Everything is read-only. */
export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle="How the system is configured right now. Everything here is read-only: settings change on the server, never from this page." />
      <div className="grid items-start gap-4 xl:grid-cols-[190px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className={cn(card, "hidden p-3 xl:sticky xl:top-16 xl:block")}>
          {GROUPS.map((g) => (
            <div key={g.label} className="mb-3 last:mb-0">
              <p className="px-2 pb-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">{g.label}</p>
              <ul>{g.items.map(([id, name]) => <li key={id}><a href={`#${id}`} className="block rounded px-2 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal-500">{name}</a></li>)}</ul>
            </div>))}
        </nav>
        <div className="min-w-0 space-y-4">
          <ConfigView />
          <div id="data" className="grid scroll-mt-20 gap-4 lg:grid-cols-2"><SourceHealthWidget /><ChannelsViewOnly /></div>
          <div id="broker" className="scroll-mt-20"><BrokerPlaceholder /></div>
        </div>
      </div>
    </div>
  );
}
