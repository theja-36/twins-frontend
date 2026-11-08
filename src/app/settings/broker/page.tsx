"use client";
import { EP } from "@/api/registry";
import { Data } from "@/ds/Data";
import { Badge, Card, CardBody, CardHeader, KeyValue, PageHeader } from "@/ds/primitives";
import { Banner, DisabledByDesign } from "@/ds/states";

export default function BrokerPage() {
  return (
    <>
      <PageHeader title="Broker Settings" description="Broker connection status. Credentials are never entered, stored or displayed in this app." />
      <div className="space-y-4">
        <DisabledByDesign title="Connecting a broker is not available">No broker integration exists in this release (Stage 10). There is no field for an API key, token or password anywhere in this app, and the status below never contains one.</DisabledByDesign>
        <Data def={EP.broker} what="broker status">{(b) => (
          <Card label="Broker"><CardHeader title="Connection" right={<Badge tone={b.connection === "CONNECTED" ? "warn" : "mute"}>{b.connection.replaceAll("_", " ")}</Badge>} /><CardBody className="space-y-3">
            <KeyValue cols={2} rows={[["Broker", b.broker ?? "none"], ["Configured", b.configured ? "yes" : "no"], ["Order execution", <Badge key="e" tone="ok">not allowed</Badge>], ["Scopes", b.scopes.join(", ") || "none"], ["Last health check", b.health.lastCheckedAt ?? "never"]]} />
            <p className="text-sm text-fg-muted">{b.health.note}</p>
            {b.accountMapping.length === 0 && <Banner tone="info" title="No account mapping">No TWINS account is mapped to a broker account.</Banner>}
          </CardBody></Card>)}</Data>
      </div>
    </>
  );
}
