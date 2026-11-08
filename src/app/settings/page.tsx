"use client";
import Link from "next/link";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, KeyValue, PageHeader } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { Toggle } from "@/ds/controls";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="User Settings" description="Your preferences and the platform configuration you are running under. Safety controls are shown, not offered as switches." />
      <div className="space-y-4">
        <Card label="Account"><CardHeader title="Account" /><CardBody><Banner tone="warn" title="No user session">User accounts are not built yet (Stage 01), so there are no per-user preferences to save. The theme toggle in the top bar is stored only in this browser.</Banner></CardBody></Card>
        <Card label="Safety"><CardHeader title="Safety controls" subtitle="Read-only mirrors of backend state" /><CardBody className="space-y-3">
          <Toggle label="Live trading" checked={false} onChange={() => undefined} disabledReason="Live trading cannot be enabled from the app. It is refused by the backend gate and a database constraint." />
          <Data def={EP.systemConfig} what="configuration" rows={3}>{(c) => <KeyValue cols={2} rows={[["Environment", c.environment.appEnv ?? "unknown"], ["Trading mode", c.environment.tradingMode ?? "unknown"], ["Live guard", c.environment.liveTradingGuardPasses ? <Badge key="g" tone="warn">passes</Badge> : <Badge key="g" tone="ok">refuses live</Badge>], ["Broker orders", "none"], ["Paper trading", c.paperTrading.effective ? "running" : "off"], ["Kill switch", c.runtimeControls?.killSwitchActive === undefined ? "unreadable" : c.runtimeControls.killSwitchActive ? "ACTIVE" : "clear"]]} />}</Data>
        </CardBody></Card>
        <p className="text-sm"><Link href="/settings/broker" className="text-accent underline">Broker settings</Link> · <Link href="/admin" className="text-accent underline">Administration &amp; audit</Link></p>
      </div>
    </>
  );
}
