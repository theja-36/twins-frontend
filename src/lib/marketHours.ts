/**
 * NSE/BSE cash and F&O session in India Standard Time (UTC+5:30, no daylight saving).
 * Weekday schedule only: exchange HOLIDAYS are not known to the frontend, so a holiday shows as
 * "scheduled open" and the page says so. Pure and deterministic: the caller passes the instant.
 */
export type SessionState = "weekend" | "closed" | "pre_open" | "open";
export interface SessionInfo {
  state: SessionState;
  label: string;
  /** Seconds until the next state change (open/close/pre-open), or null if unknown. */
  secondsToChange: number;
  nextLabel: string;
}

const IST_OFFSET_MIN = 330;
const PRE_OPEN = 9 * 60, OPEN = 9 * 60 + 15, CLOSE = 15 * 60 + 30;

/** Minutes since midnight IST, day of week (0 = Sunday) and whole seconds into the minute. */
function istParts(now: Date): { dow: number; minutes: number; seconds: number } {
  const shifted = new Date(now.getTime() + IST_OFFSET_MIN * 60_000);
  return { dow: shifted.getUTCDay(), minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(), seconds: shifted.getUTCSeconds() };
}

const isWeekday = (dow: number): boolean => dow >= 1 && dow <= 5;

export function sessionAt(now: Date): SessionInfo {
  const { dow, minutes, seconds } = istParts(now);
  const into = minutes * 60 + seconds;
  if (isWeekday(dow)) {
    if (minutes < PRE_OPEN) return { state: "closed", label: "Closed (before pre-open)", secondsToChange: PRE_OPEN * 60 - into, nextLabel: "pre-open 09:00" };
    if (minutes < OPEN) return { state: "pre_open", label: "Pre-open", secondsToChange: OPEN * 60 - into, nextLabel: "market opens 09:15" };
    if (minutes < CLOSE) return { state: "open", label: "Open", secondsToChange: CLOSE * 60 - into, nextLabel: "market closes 15:30" };
  }
  // After close, or a weekend: count to the next weekday 09:00.
  let days = 1;
  let d = (dow + 1) % 7;
  while (!isWeekday(d)) { d = (d + 1) % 7; days += 1; }
  const secondsToChange = days * 86_400 - into + PRE_OPEN * 60;
  const weekend = !isWeekday(dow);
  return { state: weekend ? "weekend" : "closed", label: weekend ? "Closed (weekend)" : "Closed (after 15:30)", secondsToChange, nextLabel: "pre-open 09:00" };
}

export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / 86_400), h = Math.floor((s % 86_400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
}
