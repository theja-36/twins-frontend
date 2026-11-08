import React from "react";
import type { StopQuality, StudioSignal, Tone } from "./fixtures";

export function Chip({ tone = "mute", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`st-chip ${tone}`}>{children}</span>;
}
export const STATUS: Record<StudioSignal["status"], { label: string; tone: Tone }> = {
  APPROVED_FOR_REVIEW: { label: "Ready for review", tone: "ok" },
  INSUFFICIENT_EVIDENCE: { label: "Held back", tone: "warn" },
  REJECTED: { label: "Rejected", tone: "bad" },
  EXPIRED: { label: "Expired", tone: "mute" },
};
export const STOP: Record<StopQuality, { label: string; tone: Tone }> = {
  VALID: { label: "Stop: valid", tone: "ok" },
  BASIS_UNSPECIFIED: { label: "Stop: basis not stated", tone: "warn" },
  MISSING: { label: "Stop: missing", tone: "bad" },
  INVALID: { label: "Stop: invalid", tone: "bad" },
};
export const FRESH: Record<StudioSignal["freshness"]["state"], { label: string; tone: Tone }> = {
  fresh: { label: "Data fresh", tone: "ok" }, stale: { label: "Data stale", tone: "warn" }, unavailable: { label: "No data", tone: "mute" },
};
export const title = (s: StudioSignal): string => `${s.underlying} ${s.strike} ${s.optionType}`;
export const ageText = (m: number): string => (m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ${m % 60} min ago`);

/** Stop, entry and targets on one line, to scale. Purely a drawing of the stated levels. */
export function LevelLadder({ s }: { s: StudioSignal }) {
  const vals = [s.stop, s.entry.price, ...s.targets].filter((v): v is number => v !== null);
  const lo = Math.min(...vals), hi = Math.max(...vals), span = Math.max(1, hi - lo);
  const pos = (v: number): string => `${6 + ((v - lo) / span) * 88}%`;
  return (
    <div className="st-ladder" role="img" aria-label={`Levels to scale: ${s.stop !== null ? `stop ${s.stop}, ` : "no stop, "}entry ${s.entry.price}, targets ${s.targets.join(", ")}`}>
      {s.stop !== null ? <i className="s" style={{ left: pos(s.stop) }} /> : null}
      <i className="e" style={{ left: pos(s.entry.price) }} />
      {s.targets.map((t) => <i key={t} className="t" style={{ left: pos(t) }} />)}
    </div>
  );
}
