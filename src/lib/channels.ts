import type { IntakeStatus } from "@/types/trading";

/**
 * Channel view built ONLY from what the backend already returns (intake/status, where the channel is masked). Nothing here is sample data: with no messages there are no channels. The selection is a
 * per-browser VIEW filter; it cannot change which channels TWINS captures (that is a host setting).
 */
export type IntakeRecent = IntakeStatus["recent"][number];
export interface ChannelSummary { channel: string; total: number; byStatus: Record<string, number>; lastReceivedAt: string | null }

export function summarizeChannels(recent: readonly IntakeRecent[]): ChannelSummary[] {
  const map = new Map<string, ChannelSummary>();
  for (const r of recent) {
    const key = r.channel || "unknown";
    const s = map.get(key) ?? { channel: key, total: 0, byStatus: {}, lastReceivedAt: null };
    s.total += 1;
    s.byStatus[r.status] = (s.byStatus[r.status] ?? 0) + 1;
    if (r.receivedAt && (s.lastReceivedAt === null || r.receivedAt > s.lastReceivedAt)) s.lastReceivedAt = r.receivedAt;
    map.set(key, s);
  }
  return [...map.values()].sort((a, b) => (b.lastReceivedAt ?? "").localeCompare(a.lastReceivedAt ?? "") || a.channel.localeCompare(b.channel));
}

/** Items to show for a selection. `null` means "nothing chosen yet": every channel is shown. */
export function filterFeed(recent: readonly IntakeRecent[], selected: ReadonlySet<string> | null): IntakeRecent[] {
  if (selected === null) return [...recent];
  return recent.filter((r) => selected.has(r.channel || "unknown"));
}

const KEY = "twins.channels.selected";
/** Reads the remembered selection; any storage problem (private window, blocked storage, bad JSON) means "no selection". */
export function loadSelection(): Set<string> | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) return null;
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) && v.every((x) => typeof x === "string") ? new Set(v as string[]) : null;
  } catch { return null; }
}
export function saveSelection(sel: ReadonlySet<string> | null): void {
  try { if (sel === null) window.localStorage.removeItem(KEY); else window.localStorage.setItem(KEY, JSON.stringify([...sel])); } catch { /* a convenience only */ }
}
