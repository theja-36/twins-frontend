"use client";
import React from "react";
import { EP, epIntel } from "@/api/registry";
import { useEndpoint } from "@/api/query";
import { Data, DataView } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, Disclosure, PageHeader, Timeline } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { dateTime } from "@/lib/fmt";

const ST = { ACTIVE: "ok", EVALUATING: "info", DRAFT: "mute", RETIRED: "mute", ROLLED_BACK: "warn" } as const;
function Detail({ id }: { id: string }) {
  const q = useEndpoint(epIntel.playbook(id));
  return <DataView q={q} what="playbook versions" rows={2}>{(d) => <div className="space-y-3">
    {d.versions.map((v) => <Disclosure key={v.version} defaultOpen={v.state === "ACTIVE"} title={<span className="flex items-center gap-2">Version {v.version} <Badge tone={ST[v.state]}>{v.state.replace("_", " ")}</Badge></span>}>
      <p className="text-sm text-fg-muted">Sample {v.sampleSize}{v.limitations ? ` · ${v.limitations}` : ""}{v.influencesLive === false ? " · does not influence live decisions" : ""}</p>
      <p className="num mt-2 text-xs text-fg-faint">created {dateTime(v.createdAt)}{v.activatedAt ? ` · activated ${dateTime(v.activatedAt)}` : ""}</p>
      <Timeline label={`Version ${v.version} history`} items={v.events.map((h) => ({ at: h.at, title: `${h.fromState ?? "—"} → ${h.toState}`, detail: `${h.actor}${h.reason ? ` · ${h.reason}` : ""}` }))} /></Disclosure>)}
    {d.drift.length > 0 && <p className="text-sm"><Badge tone="warn">drift</Badge> {d.drift.length} drift event(s) recorded.</p>}
    <p className="text-xs text-fg-faint">{d.note}</p></div>}</DataView>;
}
export default function PlaybooksPage() {
  return (
    <>
      <PageHeader title="Strategy Playbooks" description="Versioned rule sets per channel or setup, with their evaluation and history. Rolled-back and retired versions stay visible." />
      <Banner tone="info" title="Read-only">Creating or activating a playbook version is not offered here: no authorised write contract exists.</Banner>
      <div className="mt-4"><Data def={EP.intelPlaybooks} what="playbooks">{(d) => <div className="space-y-4">{d.playbooks.map((p) => (
        <Card key={p.id} label={p.name}><CardHeader title={p.name} subtitle={`${p.sourceKind === "INDEPENDENT" ? "Independent" : "Telegram channel"} · ${p.versions} version(s)${p.activeVersion ? ` · active v${p.activeVersion}` : " · none active"}`} /><CardBody><Detail id={p.id} /></CardBody></Card>))}</div>}</Data></div>
    </>
  );
}
