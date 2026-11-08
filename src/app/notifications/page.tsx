"use client";
import React from "react";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, PageHeader } from "@/ds/primitives";
import { Select } from "@/ds/controls";
import { Banner } from "@/ds/states";
import { dateTime } from "@/lib/fmt";

export default function NotificationsPage() {
  const [sev, setSev] = React.useState<"all" | "critical" | "warning" | "info">("all");
  return (
    <>
      <PageHeader title="Notifications" description="System events the platform has recorded. This is an in-app log; delivery to email, push or Telegram is not part of this release." actions={<Select label="Severity" value={sev} onChange={setSev} options={[{ value: "all", label: "All" }, { value: "critical", label: "Critical" }, { value: "warning", label: "Warnings" }, { value: "info", label: "Info" }]} />} />
      <Banner tone="info" title="Log only">No delivery channel is connected, so nothing here has been sent to you elsewhere.</Banner>
      <div className="mt-4"><Card label="Notifications"><CardHeader title="Events" /><CardBody>
        <Data def={EP.notifications} what="notifications" empty={<p className="text-sm text-fg-muted">No notifications.</p>}>{(ns) => { const rows = ns.filter((n) => sev === "all" || n.severity === sev); return rows.length === 0 ? <p className="text-sm text-fg-muted">None at this severity.</p> : <ul className="divide-y divide-line">{rows.map((n) => <li key={n.id} className="flex flex-wrap items-start gap-2 py-2.5 text-sm"><Badge tone={n.severity === "critical" ? "bad" : n.severity === "warning" ? "warn" : "info"}>{n.severity}</Badge><div className="min-w-0 flex-1"><p className="font-medium">{n.title}</p>{n.detail && <p className="text-fg-muted">{n.detail}</p>}</div><span className="num text-xs text-fg-faint">{dateTime(n.at)}</span></li>)}</ul>; }}</Data>
      </CardBody></Card></div>
    </>
  );
}
