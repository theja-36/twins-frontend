"use client";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, Disclosure, PageHeader } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { dateTime } from "@/lib/fmt";

export default function AgentsPage() {
  return (
    <>
      <PageHeader title="Agent Intelligence" description="The twelve specialist agents and the Market Context agent: what each is responsible for, whether it is running, and what it has said. Counts describe verdicts, not accuracy." />
      <div className="space-y-4">
        <Data def={EP.agentCards} what="agents">{(agents) => (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{agents.map((a) => (
            <Card key={a.agentId} label={a.name}><CardHeader title={a.name} subtitle={`v${a.version}${a.lastRunAt ? ` · last run ${dateTime(a.lastRunAt)}` : ""}`} right={<Badge tone={a.availability === "AVAILABLE" ? "ok" : a.availability === "DEGRADED" ? "warn" : "bad"}>{a.availability}</Badge>} /><CardBody className="space-y-2 text-sm">
              <p className="text-fg-muted">{a.responsibility}</p>
              <div className="flex flex-wrap gap-1.5">{a.required && <Badge tone="info">required</Badge>}{a.canBlock && <Badge tone="warn" title="Can stop a case on its own">can block</Badge>}{a.advisoryOnly && <Badge tone="mute" title="Informs; cannot block alone">advisory</Badge>}</div>
              <p className="text-xs text-fg-muted">{a.availabilityNote}</p>
              <p className="num text-xs text-fg-faint">verdicts: {Object.entries(a.verdicts).map(([k, v]) => `${k.toLowerCase()} ${v}`).join(" · ")}</p>
              <Disclosure title="Version history"><ul className="text-xs text-fg-muted">{a.versions.map((v) => <li key={v.version}>v{v.version} · {dateTime(v.from)} · {v.note}</li>)}</ul></Disclosure>
            </CardBody></Card>))}</div>)}</Data>
        <Card label="Engine"><CardHeader title="Agent engine (live configuration)" subtitle="Served by the backend today" /><CardBody>
          <Data def={EP.agentsStatus} what="agent engine" rows={2}>{(s) => <div className="space-y-2 text-sm"><div className="flex flex-wrap gap-2"><Badge tone={s.engine.enabled ? "warn" : "ok"}>{s.engine.enabled ? "enforcing" : s.engine.shadow ? "shadow mode" : "off"}</Badge><Badge tone={s.engine.configValid ? "ok" : "bad"}>{s.engine.configValid ? "config valid" : "config INVALID"}</Badge></div><p className="text-fg-muted">{s.agents.length} agents registered · {s.persistedRuns} persisted runs. This is the legacy engine summary; the specialist cards above come from the Stage 04 contract.</p></div>}</Data>
        </CardBody></Card>
        <Banner tone="info" title="Association, not accuracy">Outcome association for each agent is on the Learning &amp; Performance screen and is labelled as association with a reliability status.</Banner>
      </div>
    </>
  );
}
