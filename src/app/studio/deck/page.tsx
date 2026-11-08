"use client";
import { DecisionsView } from "@/studio/decisions";
import { PageHead } from "@/studio/kit";

export default function DeckPage() {
  return (<><PageHead title="Decisions" sub="Go through decisions one at a time. Read-only: swiping only moves between cards." /><DecisionsView /></>);
}
