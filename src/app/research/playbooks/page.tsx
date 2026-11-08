"use client";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, Disclosure, PageHeader, Timeline } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { dateTime } from "@/lib/fmt";

const ST = { ACTIVE: "ok", EVALUATING: "info", PROPOSED: "mute", REJECTED: "bad", ROLLED_BACK: "warn" } as const;
export default function PlaybooksPage() {
  return (
    <>
      <PageHeader title="Strategy Playbooks" description="Versioned rule sets per channel or setup, with their evaluation and history. Rolled-back and rejected versions stay visible." />
      <Banner tone="info" title="Read-only">Creating or activating a playbook version is not offered here: no authorised write contract exists.</Banner>
      <div className="mt-4"><Data def={EP.playbooks} what="playbooks">{(pbs) => <div className="space-y-4">{pbs.map((p) => (
        <Card key={p.id} label={p.name}><CardHeader title={p.name} subtitle={`${p.kind === "INDEPENDENT" ? "Independent" : "Telegram channel"} · ${p.subject}`} /><CardBody className="space-y-3">
          {p.versions.map((v) => <Disclosure key={v.version} defaultOpen={v.state === "ACTIVE"} title={<span className="flex items-center gap-2">Version {v.version} <Badge tone={ST[v.state]}>{v.state.replace("_", " ")}</Badge></span>}>
            <ul className="list-disc space-y-1 pl-5 text-sm text-fg-muted">{v.rules.map((r) => <li key={r}>{r}</li>)}</ul>
            <p className="num mt-2 text-xs text-fg-faint">created {dateTime(v.createdAt)}{v.activatedAt ? ` · activated ${dateTime(v.activatedAt)}` : ""}{v.evaluation ? ` · sample ${v.evaluation.sample}${v.evaluation.outOfSample ? " (out-of-sample)" : " (in-sample only)"}${v.evaluation.driftFlag ? " · drift flagged" : ""}` : ""}</p></Disclosure>)}
          <Timeline label="Playbook history" items={p.history.map((h) => ({ at: h.at, title: `${h.from ?? "—"} → ${h.to}`, detail: `${h.actor}${h.reason ? ` · ${h.reason}` : ""}` }))} />
        </CardBody></Card>))}</div>}</Data></div>
    </>
  );
}
