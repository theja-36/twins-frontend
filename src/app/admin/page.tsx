"use client";
import React from "react";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, Metric, MetricGrid, PageHeader, Tabs, TabPanel } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { DataTable } from "@/ds/table";
import { dateTime } from "@/lib/fmt";

export default function AdminPage() {
  const [tab, setTab] = React.useState<"warnings" | "audit" | "jobs" | "users" | "flags">("warnings");
  return (
    <>
      <PageHeader title="Administration & Audit" description="Users and roles, the tamper-evident audit log, background jobs and feature flags. Read-only." />
      <Data def={EP.admin} what="administration">{(a) => (
        <div className="space-y-4">
          <Tabs label="Administration" value={tab} onChange={setTab} tabs={[{ value: "warnings", label: `Security (${a.securityWarnings.length})` }, { value: "audit", label: "Audit log" }, { value: "jobs", label: "Jobs" }, { value: "users", label: "Users & roles" }, { value: "flags", label: "Flags" }]} />
          <TabPanel id="warnings" active={tab === "warnings"}><div className="space-y-3">{a.securityWarnings.map((w) => <Banner key={w.id} tone={w.severity === "INFO" ? "info" : w.severity === "CRITICAL" ? "bad" : "warn"} title={w.severity}>{w.text}</Banner>)}</div></TabPanel>
          <TabPanel id="audit" active={tab === "audit"}><Card label="Audit"><CardBody><DataTable label="Audit log" dense rows={a.audit} rowKey={(r) => r.id} cols={[{ key: "t", header: "When", render: (r) => dateTime(r.at) }, { key: "a", header: "Actor", render: (r) => r.actor }, { key: "e", header: "Event", render: (r) => r.event }, { key: "c", header: "Chain", render: (r) => (r.chainOk === null ? <Badge tone="warn">unverified</Badge> : r.chainOk ? <Badge tone="ok">intact</Badge> : <Badge tone="bad">BROKEN</Badge>) }]} /></CardBody></Card></TabPanel>
          <TabPanel id="jobs" active={tab === "jobs"}><Card label="Jobs"><CardBody><DataTable label="Jobs" dense rows={a.jobs} rowKey={(j) => j.job} cols={[{ key: "j", header: "Job", render: (j) => j.job }, { key: "s", header: "Status", render: (j) => <Badge tone={j.status === "FAILED" ? "bad" : j.status === "DISABLED" ? "mute" : j.status === "RUNNING" ? "info" : "ok"}>{j.status}</Badge> }, { key: "l", header: "Last run", hideBelow: "sm", render: (j) => dateTime(j.lastRunAt) }, { key: "n", header: "Note", hideBelow: "md", render: (j) => j.note }]} /></CardBody></Card></TabPanel>
          <TabPanel id="users" active={tab === "users"}><div className="space-y-3"><MetricGrid cols={3}><Metric label="Users" value={String(a.users.length)} /><Metric label="Roles" value={String(a.roles.length)} /><Metric label="Active sessions" value="n/a" sub="sessions not built" tone="warn" /></MetricGrid><Card label="Users"><CardBody><DataTable label="Users" dense rows={a.users} rowKey={(u) => u.id} cols={[{ key: "u", header: "User", render: (u) => u.label }, { key: "r", header: "Role", render: (u) => u.role }, { key: "a", header: "Accounts", align: "right", render: (u) => String(u.accounts) }]} /></CardBody></Card></div></TabPanel>
          <TabPanel id="flags" active={tab === "flags"}><Card label="Flags"><CardBody><DataTable label="Flags" dense rows={a.flags} rowKey={(f) => f.name} cols={[{ key: "n", header: "Flag", render: (f) => <span className="num">{f.name}</span> }, { key: "v", header: "Value", render: (f) => f.value }, { key: "d", header: "Default", hideBelow: "sm", render: (f) => f.default }, { key: "no", header: "Note", hideBelow: "md", render: (f) => f.note }]} /></CardBody></Card></TabPanel>
        </div>)}</Data>
    </>
  );
}
