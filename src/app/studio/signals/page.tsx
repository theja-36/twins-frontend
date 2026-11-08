"use client";
import { SignalsView } from "@/studio/claims";
import { PageHead } from "@/studio/kit";

export default function SignalsPage() {
  return (<><PageHead title="Signals" sub="What the parser read from each Telegram message: contract, levels, stop quality and blockers. Message text is never shown." /><SignalsView /></>);
}
