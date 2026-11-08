"use client";
import React from "react";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, PageHeader, ProvenanceBadge } from "@/ds/primitives";
import { Banner } from "@/ds/states";
import { DataTable } from "@/ds/table";
import { price, dateTime } from "@/lib/fmt";

const STALE_AFTER_S = 120;
type Health = { tone: "ok" | "warn" | "bad"; text: string };
export default function MonitoringPage() {
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 15_000); return () => clearInterval(t); }, []);
  return (
    <>
      <PageHeader title="Trade Monitoring" description="Is each open position being watched with a current price? A missing or stale price is a warning, never a green tick." badges={<ProvenanceBadge kind="PAPER" />} />
      <Banner tone="warn" title="Price freshness matters">A stop or target cannot be checked without a recent price. Positions with no price, or one older than {STALE_AFTER_S}s, are flagged.</Banner>
      <div className="mt-4"><Card label="Monitoring"><CardHeader title="Open positions" /><CardBody>
        <Data def={EP.positionsV2} what="monitoring">{(ps) => { const open = ps.filter((p) => p.status === "OPEN"); const health = (p: (typeof open)[number]): Health => { if (!p.lastPrice) return { tone: "bad", text: "NO PRICE: stop not being checked" }; if (now === null) return { tone: "warn", text: "checking…" }; const age = (now - Date.parse(p.lastPrice.asOf)) / 1000; return age > STALE_AFTER_S ? { tone: "warn", text: `STALE price (${Math.round(age)}s old)` } : { tone: "ok", text: `price ${Math.round(age)}s old` }; };
          return <DataTable label="Monitoring" rows={open} rowKey={(p) => p.id} empty="No open positions." cols={[{ key: "i", header: "Instrument", render: (p) => p.instrument }, { key: "lp", header: "Last price", align: "right", render: (p) => (p.lastPrice ? price(p.lastPrice.price) : "—") }, { key: "sl", header: "Stop", align: "right", render: (p) => price(p.stopLoss) }, { key: "t", header: "Next target", align: "right", hideBelow: "sm", render: (p) => price(p.targets[0]) }, { key: "h", header: "Monitoring", render: (p) => { const h = health(p); return <Badge tone={h.tone}>{h.text}</Badge>; } }, { key: "src", header: "Source", hideBelow: "md", render: (p) => (p.lastPrice ? <span className="text-xs text-fg-muted">{p.lastPrice.source.toLowerCase()} · {dateTime(p.lastPrice.asOf)}</span> : "—") }]} />; }}</Data>
      </CardBody></Card></div>
    </>
  );
}
