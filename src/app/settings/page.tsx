"use client";

import React from "react";
import { ConfigView } from "@/components/trading/ConfigView";
import { PageHeader } from "@/components/trading/ui";
import { SourceHealthWidget } from "@/components/trading/Widgets";
import { BrokerPlaceholder, ChannelsViewOnly } from "@/components/trading/Panels";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="How the system is configured right now: safety flags, providers, channels and broker connections. Everything here is read-only." />
      <ConfigView />
      <div className="grid gap-4 lg:grid-cols-2"><SourceHealthWidget /><div className="space-y-4"><ChannelsViewOnly /><BrokerPlaceholder /></div></div>
    </div>
  );
}
