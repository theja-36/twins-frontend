/** Pure helpers for the cockpit shell and Dashboard (unit tested). */
export type FlagTone = "ok" | "warn" | "bad" | "off";
export interface SafetyFlag { key: string; label: string; value: string; tone: FlagTone }

/** India Standard Time as HH:MM:SS (UTC+5:30, no daylight saving). */
export function istClock(now: Date): string {
  const t = new Date(now.getTime() + 330 * 60_000);
  const p = (n: number): string => String(n).padStart(2, "0");
  return `${p(t.getUTCHours())}:${p(t.getUTCMinutes())}:${p(t.getUTCSeconds())}`;
}

/**
 * The posture flags. `kill` and `intake` are undefined when the backend could not read them: that is shown as "unreadable" in a warning tone, never as a safe-looking default.
 * Live trading is not a runtime input here: the API reports it only as locked.
 */
export function safetyFlags(i: { paperEffective: boolean; engineEnabled: boolean; engineShadow: boolean; kill: boolean | undefined; intake: boolean | undefined }): SafetyFlag[] {
  return [
    { key: "live", label: "LIVE", value: "locked", tone: "ok" },
    { key: "kill", label: "KILL", value: i.kill === undefined ? "unreadable" : i.kill ? "ACTIVE" : "clear", tone: i.kill === undefined ? "warn" : i.kill ? "bad" : "ok" },
    { key: "engine", label: "ENGINE", value: i.engineEnabled ? "enforcing" : i.engineShadow ? "shadow" : "off", tone: i.engineEnabled ? "warn" : "ok" },
    { key: "paper", label: "PAPER", value: i.paperEffective ? "running" : "off", tone: i.paperEffective ? "warn" : "off" },
    { key: "intake", label: "INTAKE", value: i.intake === undefined ? "unreadable" : i.intake ? "on" : "off", tone: i.intake === undefined ? "warn" : i.intake ? "ok" : "warn" },
  ];
}

/** Points for a sparkline: scaled into a w x h box, last value highlighted by the caller. Empty or single-point input gives no path. */
export function sparkPath(values: readonly number[], w: number, h: number, pad = 2): string {
  const v = values.filter((n) => Number.isFinite(n));
  if (v.length < 2) return "";
  const min = Math.min(...v), max = Math.max(...v), span = max - min || 1;
  return v.map((n, i) => `${i === 0 ? "M" : "L"}${(pad + (i / (v.length - 1)) * (w - 2 * pad)).toFixed(1)},${(h - pad - ((n - min) / span) * (h - 2 * pad)).toFixed(1)}`).join(" ");
}

/** Hero figures from what the API really exposes. There is no capital figure in the API, so no "portfolio value" is invented: the hero is paper P&L. */
export function heroFigures(curvePnl: readonly number[], dayPnl: number | null): { total: number | null; day: number | null; spark: number[] } {
  const total = curvePnl.length ? (curvePnl[curvePnl.length - 1] as number) : null;
  return { total, day: dayPnl, spark: curvePnl.slice(-60) };
}
