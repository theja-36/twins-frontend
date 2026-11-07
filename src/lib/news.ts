import type { ChannelNewsClusterView, ChannelNewsView } from "@/types/trading";

/** Polarity (-1..1) as a plain word and a tone. Channel commentary is low-reliability by design: it is context, never a signal. */
export function polarityWord(p: number): "negative" | "slightly negative" | "neutral" | "slightly positive" | "positive" {
  if (p <= -0.5) return "negative";
  if (p < -0.15) return "slightly negative";
  if (p <= 0.15) return "neutral";
  if (p < 0.5) return "slightly positive";
  return "positive";
}
export const polarityTone = (p: number): "bad" | "warn" | "mute" | "ok" => (p <= -0.5 ? "bad" : p < -0.15 ? "warn" : p >= 0.5 || p > 0.15 ? "ok" : "mute");

export const themeLabel = (t: string | null): string => (t ? t.replaceAll("_", " ") : "no theme");
export const clusterTitle = (c: Pick<ChannelNewsClusterView, "symbol" | "theme">): string => `${c.symbol ?? "Market"} · ${themeLabel(c.theme)}`;

/** Width (0-100) of the centred polarity bar's filled half. */
export const polarityWidth = (p: number): number => Math.round(Math.min(1, Math.abs(p)) * 100);

/** Clusters worth showing first: mixed, then the most negative, then the most items. Never mutates the input. */
export function orderClusters(cs: readonly ChannelNewsClusterView[]): ChannelNewsClusterView[] {
  return [...cs].sort((a, b) => Number(b.mixed) - Number(a.mixed) || a.polarity - b.polarity || b.items - a.items || (a.clusterId < b.clusterId ? -1 : 1));
}

/** Plain explanation of a non-ok status. Never presented as "no news". */
export function statusNote(v: Pick<ChannelNewsView, "status">): string | null {
  switch (v.status) {
    case "ok": return null;
    case "stale": return "The channel-news file is older than expected, so these items may be out of date.";
    case "missing": return "No channel-news file exists yet. This is not the same as no news.";
    case "invalid": return "The channel-news file could not be read. Nothing is shown from it.";
  }
}
