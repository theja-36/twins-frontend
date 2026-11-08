"use client";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, PageHeader } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { safetyFlags } from "@/lib/cockpit";

export default function LivePage() {
  return (
    <>
      <PageHeader title="Live Execution Controls" description="Live execution is OFF and there is no switch to turn it on here. This screen shows why." badges={<Badge tone="ok">LIVE: DISABLED</Badge>} />
      <div className="space-y-4">
        <Banner tone="info" title="Nothing on this page can enable live trading">Live modes are refused by the backend gate and by a database constraint. Enabling them is a separate, reviewed release step (Stage 12), not a UI setting.</Banner>
        <Data def={EP.executionControls} what="execution controls">{(c) => (<>
          <Card label="Modes"><CardHeader title="Execution modes" /><CardBody><ul className="divide-y divide-line">{c.modes.map((m) => <li key={m.mode} className="flex flex-wrap items-start justify-between gap-2 py-2.5 text-sm"><div><p className="font-medium">{m.mode.replaceAll("_", " ")}</p><p className="text-fg-muted">{m.reason}</p></div><Badge tone={m.enabled ? "warn" : "mute"}>{m.enabled ? "enabled" : "disabled"}</Badge></li>)}</ul></CardBody></Card>
          <Card label="Gates"><CardHeader title="Readiness gates (informational)" subtitle="A pass here would not enable anything" /><CardBody><ul className="space-y-1.5 text-sm">{c.readinessGates.map((g) => <li key={g.id} className="flex flex-wrap items-start gap-2"><Badge tone={g.status === "PASS" ? "ok" : g.status === "FAIL" ? "bad" : "mute"}>{g.status.replace("_", " ")}</Badge><span><b className="font-medium">{g.title}</b> <span className="text-fg-muted">{g.detail}</span></span></li>)}</ul></CardBody></Card>
          <p className="text-sm text-fg-muted">Broker connected: <b>no</b>. Kill switch: <b>{c.killSwitch.active === null ? "unreadable" : c.killSwitch.active ? "ACTIVE" : "clear"}</b>.</p>
        </>)}</Data>
        <Card label="Runtime"><CardHeader title="Runtime safety flags (served today)" /><CardBody>
          <Data def={EP.systemConfig} what="runtime flags" rows={2}>{(s) => <div className="flex flex-wrap gap-2">{safetyFlags({ paperEffective: s.paperTrading.effective, engineEnabled: !!s.agentEngine.enabled, engineShadow: !!s.agentEngine.shadow, kill: s.runtimeControls?.killSwitchActive, intake: s.runtimeControls?.intakeEnabled }).map((f) => <Badge key={f.key} tone={f.tone === "off" ? "mute" : f.tone}>{f.label}: {f.value}</Badge>)}</div>}</Data>
        </CardBody></Card>
      </div>
    </>
  );
}
