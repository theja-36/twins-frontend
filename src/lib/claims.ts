import type { TelegramClaim } from "@/types/trading";

/** Pure helpers for the Claims page (unit tested). */
export type Quality = { level: "good" | "caution" | "poor" | "none"; label: string; detail: string; pctOfStrike: number | null };

/** How trustworthy the stop-loss of a parsed claim is, in plain words. A stop that is missing is never "caution": it is "none" (the mandatory-stop rule blocks sizing). */
export function stopQuality(c: TelegramClaim["claim"]): Quality {
  if (!c) return { level: "none", label: "No claim", detail: "The message did not parse into a full claim.", pctOfStrike: null };
  if (c.stopLoss === null) return { level: "none", label: "No stop", detail: "No stop-loss was found. Nothing can be sized without one.", pctOfStrike: null };
  const pct = c.strike !== null && c.strike > 0 ? Math.round((c.stopLoss / c.strike) * 1e4) / 100 : null;
  if (c.levelBasisConflict) return { level: "poor", label: "Basis conflict", detail: "The message names both a premium and an underlying basis, so the stop is ambiguous.", pctOfStrike: pct };
  if (c.levelBasis === "premium" && !c.levelBasisInferred) return { level: "good", label: "Premium (stated)", detail: "The message says the stop is a premium level.", pctOfStrike: pct };
  if (c.levelBasis === "underlying") return { level: "good", label: "Underlying (stated)", detail: "The message says the stop is an underlying level.", pctOfStrike: pct };
  if (c.levelBasis === "premium" && c.levelBasisInferred) return { level: "caution", label: "Premium (assumed)", detail: `The message did not say. The channel's default (premium) was applied because the stop is ${pct ?? "?"}% of the strike.`, pctOfStrike: pct };
  return { level: "poor", label: "Basis unclear", detail: "The message does not say whether the stop is a premium or an underlying level, so it cannot be used.", pctOfStrike: pct };
}

export interface ClaimFilter { underlying: string | "ALL"; side: "ALL" | "buy" | "sell" | "none"; outcome: "ALL" | "INSUFFICIENT_EVIDENCE" | "REJECT"; stop: "ALL" | "with" | "without"; sinceHours: number | null; channel: string | "ALL" }
export const NO_FILTER: ClaimFilter = { underlying: "ALL", side: "ALL", outcome: "ALL", stop: "ALL", sinceHours: null, channel: "ALL" };

export function filterClaims(rows: readonly TelegramClaim[], f: ClaimFilter): TelegramClaim[] {
  return rows.filter((r) => {
    const c = r.claim;
    if (f.channel !== "ALL" && r.channel !== f.channel) return false;
    if (f.underlying !== "ALL" && c?.underlying !== f.underlying) return false;
    if (f.side !== "ALL" && (f.side === "none" ? c?.action != null : c?.action !== f.side)) return false;
    if (f.outcome !== "ALL" && r.assessmentOutcome !== f.outcome) return false;
    if (f.stop === "with" && c?.stopLoss == null) return false;
    if (f.stop === "without" && c?.stopLoss != null) return false;
    if (f.sinceHours !== null && (r.ageSeconds === null || r.ageSeconds > f.sinceHours * 3600)) return false;
    return true;
  });
}

export function claimTitle(c: TelegramClaim["claim"]): string { return c ? `${c.underlying ?? "?"} ${c.strike ?? "?"} ${c.optionType ?? "?"}` : "Not a complete claim"; }

/** Counts of stop quality for the summary strip. */
export function qualityCounts(rows: readonly TelegramClaim[]): Record<Quality["level"], number> {
  const out = { good: 0, caution: 0, poor: 0, none: 0 } as Record<Quality["level"], number>;
  for (const r of rows) out[stopQuality(r.claim).level] += 1;
  return out;
}
