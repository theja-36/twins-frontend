"use client";
import { PageHead } from "@/studio/kit";
import { MarketView } from "@/studio/market";

export default function MarketPage() {
  return (<><PageHead title="Market" sub="Index prices, source health and commentary. Regime and calendar are samples until their routes exist." /><MarketView /></>);
}
