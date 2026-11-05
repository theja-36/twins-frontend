import { useSyncExternalStore } from "react";

/**
 * The shared "can we reach the backend" state. Every data call reports here; the app shows ONE banner and every empty-because-unavailable panel reads it, so no page can look healthy while the
 * backend is down, and there is no sample data to fall back on.
 */
export type BackendErrorKind = "not_configured" | "unauthorized" | "unreachable" | "bad_answer";
export interface BackendState { error: BackendErrorKind | null; failing: string[]; since: number | null; lastOkAt: number | null }
// Errors are tracked PER ENDPOINT: a success of one call never hides a failure of another.
const errors = new Map<string, BackendErrorKind>();
let lastOkAt: number | null = null, since: number | null = null;
let state: BackendState = { error: null, failing: [], since: null, lastOkAt: null };
const subs = new Set<() => void>();
const KIND_ORDER: BackendErrorKind[] = ["not_configured", "unauthorized", "unreachable", "bad_answer"];
function recompute(): void {
  const kinds = [...errors.values()];
  const error = KIND_ORDER.find((k) => kinds.includes(k)) ?? null;
  const failing = [...errors.keys()].sort();
  if (error === null) since = null; else if (since === null) since = Date.now();
  const next: BackendState = { error, failing, since, lastOkAt };
  if (next.error !== state.error || next.failing.join() !== state.failing.join() || next.lastOkAt !== state.lastOkAt) { state = next; subs.forEach((f) => f()); }
}
export const reportOk = (key: string): void => { errors.delete(key); lastOkAt = Date.now(); recompute(); };
export const reportError = (kind: BackendErrorKind, key: string): void => { errors.set(key, kind); recompute(); };
export const getBackendState = (): BackendState => state;
const subscribe = (f: () => void): (() => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const useBackendState = (): BackendState => useSyncExternalStore(subscribe, getBackendState, getBackendState);

export class BackendError extends Error { constructor(readonly kind: BackendErrorKind) { super(kind); this.name = "BackendError"; } }
export const RETRY_EVENT = "twins-retry";
export const requestRetry = (): void => { if (typeof window !== "undefined") window.dispatchEvent(new Event(RETRY_EVENT)); };

export const ERROR_TEXT: Record<BackendErrorKind, { title: string; body: string }> = {
  not_configured: { title: "No backend is connected to this server", body: "Start the SSH tunnel to the staging API and set TWINS_API_URL and TWINS_API_KEY for the frontend server (see the README: staging listens on the VPS loopback port 4110), then reload. Nothing is shown until real data is available." },
  unauthorized: { title: "The backend refused this server's API token", body: "TWINS_API_KEY on the frontend server does not match the backend. Fix the server setting; nothing is shown until real data is available." },
  unreachable: { title: "The backend cannot be reached", body: "Check that the SSH tunnel is up (ssh -L 4400:127.0.0.1:4110 hostinger-vps) and that the API is running. The page retries by itself." },
  bad_answer: { title: "The backend returned something this page does not understand", body: "The frontend and backend versions may not match. The page retries by itself." },
};
