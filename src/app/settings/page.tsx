"use client";

import React from "react";
import { ConfigView } from "@/components/trading/ConfigView";
import { PageHeader } from "@/components/trading/ui";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="How the system is configured right now: safety switches, paper trading, the research agents and the risk limits." />
      <ConfigView />
    </div>
  );
}
