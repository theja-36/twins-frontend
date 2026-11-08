"use client";
import Link from "next/link";
import type { TelegramClaim } from "@/types/trading";
import { Badge } from "@/ds/primitives";
import { DataTable } from "@/ds/table";
import { claimTitle } from "@/lib/claims";
import { entryText } from "@/lib/channels";
import { ageText } from "@/lib/view";

export function ClaimTable({ rows, label }: { rows: readonly TelegramClaim[]; label: string }) {
  return (
    <DataTable label={label} rows={rows} rowKey={(c) => c.id} filterText={(c) => `${claimTitle(c.claim)} ${c.channel} ${c.resultKind ?? ""}`} cols={[
      { key: "i", header: "Instrument", render: (c) => <Link href={`/telegram/signals/${c.id}`} className="font-medium hover:underline">{claimTitle(c.claim)}</Link>, sort: (c) => claimTitle(c.claim) },
      { key: "a", header: "Action", render: (c) => c.claim?.action ?? "—" },
      { key: "e", header: "Entry", align: "right", hideBelow: "sm", render: (c) => entryText(c.claim?.entry) },
      { key: "s", header: "Stop", align: "right", hideBelow: "sm", render: (c) => (c.claim?.stopLoss == null ? <Badge tone="warn">none</Badge> : String(c.claim.stopLoss)) },
      { key: "k", header: "Parsed as", render: (c) => <Badge tone={c.resultKind === "claim" ? "ok" : c.resultKind === "ambiguous" ? "warn" : "mute"}>{c.resultKind ?? "n/a"}</Badge> },
      { key: "o", header: "Assessment", hideBelow: "md", render: (c) => (c.assessmentOutcome ? <Badge tone={c.assessmentOutcome === "REJECT" ? "bad" : "warn"} title="A claim assessment is not a trading decision">{c.assessmentOutcome.replaceAll("_", " ").toLowerCase()}</Badge> : "—") },
      { key: "t", header: "Age", align: "right", render: (c) => (c.ageSeconds == null ? "—" : ageText(c.ageSeconds)), sort: (c) => c.ageSeconds }]} />
  );
}
