"use client";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, PageHeader, ProvenanceBadge, Tabs, TabPanel } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { DataTable } from "@/ds/table";
import React from "react";
import { dateTime, price } from "@/lib/fmt";

const ST: Record<string, "ok" | "warn" | "bad" | "info" | "mute"> = { FILLED: "ok", PARTIALLY_FILLED: "warn", ACCEPTED: "info", SUBMITTED: "info", PROPOSED: "mute", REJECTED: "bad", CANCELLED: "mute", EXPIRED: "mute" };
export default function OrdersPage() {
  const [tab, setTab] = React.useState<"orders" | "fills">("orders");
  return (
    <>
      <PageHeader title="Orders & Fills" description="Paper orders and their fills. Accepted is not filled, and filled is not a closed position." badges={<ProvenanceBadge kind="PAPER" />} />
      <Banner tone="info" title="Simulated">Orders are paper orders. None was sent to a broker.</Banner>
      <div className="mt-4 space-y-3"><Tabs label="Orders or fills" value={tab} onChange={setTab} tabs={[{ value: "orders", label: "Orders" }, { value: "fills", label: "Fills" }]} />
        <TabPanel id="orders" active={tab === "orders"}><Card label="Orders"><CardHeader title="Orders" /><CardBody><Data def={EP.orders} what="orders">{(os) => <DataTable label="Orders" rows={os} rowKey={(o) => o.id} filterText={(o) => `${o.instrument} ${o.status}`} cols={[
          { key: "i", header: "Instrument", render: (o) => o.instrument }, { key: "p", header: "Purpose", hideBelow: "sm", render: (o) => `${o.purpose}${o.exitReason ? ` (${o.exitReason.toLowerCase()})` : ""}` }, { key: "sd", header: "Side", render: (o) => o.side },
          { key: "q", header: "Filled / qty", align: "right", render: (o) => `${o.filledQuantity} / ${o.quantity}` }, { key: "a", header: "Avg fill", align: "right", hideBelow: "sm", render: (o) => price(o.avgFillPrice) },
          { key: "s", header: "Status", render: (o) => <span title={o.stateReason ?? undefined}><Badge tone={ST[o.status] ?? "mute"}>{o.status.replaceAll("_", " ")}</Badge></span> }, { key: "t", header: "Created", align: "right", hideBelow: "md", render: (o) => dateTime(o.createdAt) }]} />}</Data></CardBody></Card></TabPanel>
        <TabPanel id="fills" active={tab === "fills"}><Card label="Fills"><CardHeader title="Fills" subtitle="Each fill records the price source and how old that price was" /><CardBody><Data def={EP.fills} what="fills">{(fs) => <DataTable label="Fills" rows={fs} rowKey={(f) => f.id} cols={[
          { key: "i", header: "Instrument", render: (f) => f.instrument }, { key: "q", header: "Qty", align: "right", render: (f) => f.quantity }, { key: "p", header: "Price", align: "right", render: (f) => price(f.price) }, { key: "c", header: "Costs", align: "right", hideBelow: "sm", render: (f) => price(f.costs) },
          { key: "s", header: "Price source", hideBelow: "sm", render: (f) => <ProvenanceBadge kind={f.priceSource === "FIXTURE" ? "FIXTURE" : "LIVE"} /> }, { key: "t", header: "Filled", align: "right", render: (f) => dateTime(f.filledAt) }]} />}</Data></CardBody></Card></TabPanel></div>
    </>
  );
}
