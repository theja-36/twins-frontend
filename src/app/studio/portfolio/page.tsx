"use client";
import { PageHead } from "@/studio/kit";
import { PortfolioView } from "@/studio/portfolio";

export default function PortfolioPage() {
  return (<><PageHead title="Portfolio" sub="Paper positions, exposure, closed trades and outcome attribution. Simulated only." /><PortfolioView /></>);
}
