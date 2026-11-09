"use client";
import React from "react";
import { getSession, refreshSession, sessionEnded, setUserChangeHandler, subscribeSession } from "./session";

/**
 * The single data-access boundary of the app. Every screen reads through `useEndpoint`, which turns a typed endpoint definition into ONE of eight explicit states. Nothing here invents data:
 *  - LEGACY_READ endpoints are fetched through the GET-only allow-listed proxy (`/api/twins/*`, the API token never reaches the browser);
 *  - CONTRACT_ONLY endpoints have a typed contract but no web route yet: live mode reports `unavailable` (with the backend dependency), demo mode shows a clearly labelled fixture;
 *  - NEEDS_SESSION endpoints need a signed-in user: live mode reads them through the /api/session relay under the user's own HttpOnly-cookie session (never the shared service token) and reports `denied` when nobody is signed in or the session ended.
 */
export type Availability = "LEGACY_READ" | "CONTRACT_ONLY" | "NEEDS_SESSION";
export interface EndpointDef<T> { id: string; path: string; availability: Availability; permission?: string; dependency?: string; validate: (raw: unknown) => T | null; isEmpty?: (d: T) => boolean; /** An answer that arrived but names parts of itself as NOT available (never a fixture, never invented): state "partial", with the reason shown. */ partialReason?: (d: T) => string | null; refreshMs?: number }
export type QueryState = "loading" | "ready" | "empty" | "stale" | "error" | "denied" | "unavailable" | "partial";
export type ApiErrorKind = "not_configured" | "unreachable" | "unauthorized" | "forbidden" | "not_found" | "bad_answer" | "rate_limited";
export interface ApiError { kind: ApiErrorKind; message: string; retryable: boolean }
export interface QueryResult<T> { state: QueryState; data: T | null; error: ApiError | null; fetchedAt: number | null; provenance: "LIVE" | "DEMO"; refetch: () => void; def: EndpointDef<T> }

// NOTE: dot access is required: Next inlines only `process.env.NAME`.
export const DEMO = process.env.NEXT_PUBLIC_TWINS_DEMO === "1";
const MESSAGES: Record<ApiErrorKind, string> = { not_configured: "The web app is not connected to a backend (no server address or credentials are configured).", unreachable: "The backend could not be reached.", unauthorized: "The backend refused the server's credentials.", forbidden: "You do not have permission to read this.", not_found: "The backend has no such resource.", bad_answer: "The backend answered in a shape this app does not recognise.", rate_limited: "The backend asked the app to slow down." };
export const apiError = (kind: ApiErrorKind): ApiError => ({ kind, message: MESSAGES[kind], retryable: kind === "unreachable" || kind === "rate_limited" || kind === "bad_answer" });
export function errorFromStatus(status: number): ApiError { return apiError(status === 503 ? "not_configured" : status === 401 ? "unauthorized" : status === 403 ? "forbidden" : status === 404 ? "not_found" : status === 429 ? "rate_limited" : status >= 500 ? "unreachable" : "bad_answer"); }

async function fetchLegacy(path: string, signal: AbortSignal, prefix = "/api/twins/"): Promise<{ ok: true; raw: unknown } | { ok: false; error: ApiError }> {
  let res: Response;
  try { res = await fetch(`${prefix}${path}`, { cache: "no-store", signal }); } catch { return { ok: false, error: apiError("unreachable") }; }
  if (!res.ok) return { ok: false, error: errorFromStatus(res.status) };
  try { return { ok: true, raw: await res.json() }; } catch { return { ok: false, error: apiError("bad_answer") }; }
}
async function loadFixture(id: string, path: string): Promise<unknown | undefined> {
  if (process.env.NEXT_PUBLIC_TWINS_DEMO === "1") { // the literal test lets the bundler drop the fixtures chunk from normal builds
    const [legacy, contracts] = await Promise.all([import("./fixtures/legacy"), import("./fixtures/contracts")]);
    return contracts.contractFixture(id) ?? legacy.routeFixture(path, "populated");
  }
  return undefined;
}
interface Entry { data: unknown; at: number }
const cache = new Map<string, Entry>(), subs = new Set<() => void>();
export const invalidate = (prefix = ""): void => { for (const k of [...cache.keys()]) if (k.startsWith(prefix)) cache.delete(k); subs.forEach((f) => f()); };
// One user's session-scoped answers are never shown to the next user (or to nobody): they are dropped whenever the signed-in user changes.
setUserChangeHandler(() => invalidate("NEEDS_SESSION:"));

export function useEndpoint<T>(def: EndpointDef<T>): QueryResult<T> {
  const key = `${def.availability}:${def.path}`;
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  const [status, setStatus] = React.useState<{ loading: boolean; error: ApiError | null; denied: boolean; unavailable: boolean }>({ loading: true, error: null, denied: false, unavailable: false });
  const defRef = React.useRef(def); defRef.current = def;
  const run = React.useCallback(async (signal: AbortSignal, attempt = 0): Promise<void> => {
    const d = defRef.current;
    if (d.availability === "NEEDS_SESSION" && !DEMO) {
      let sess = getSession(); if (sess.status === "unknown") sess = await refreshSession();
      if (signal.aborted) return;
      if (sess.status === "anonymous") { setStatus({ loading: false, error: null, denied: true, unavailable: false }); return; }
      if (sess.status === "unavailable") { setStatus({ loading: false, error: apiError(sess.reason === "backend_not_configured" ? "not_configured" : "unreachable"), denied: false, unavailable: false }); return; }
      const r = await fetchLegacy(d.path, signal, "/api/session/");
      if (signal.aborted) return;
      if (!r.ok) { if (r.error.kind === "unauthorized") { sessionEnded(); setStatus({ loading: false, error: null, denied: true, unavailable: false }); return; } setStatus({ loading: false, error: r.error, denied: false, unavailable: false }); return; }
      const data = d.validate(r.raw);
      if (data === null) { setStatus({ loading: false, error: apiError("bad_answer"), denied: false, unavailable: false }); return; }
      cache.set(key, { data, at: Date.now() }); setStatus({ loading: false, error: null, denied: false, unavailable: false }); bump(); return;
    }
    if (d.availability === "CONTRACT_ONLY" && !DEMO) { setStatus({ loading: false, error: null, denied: false, unavailable: true }); return; }
    let raw: unknown, error: ApiError | null = null;
    if (DEMO) { raw = await loadFixture(d.id, d.path); if (raw === undefined) error = apiError("not_found"); }
    else { const r = await fetchLegacy(d.path, signal); if (r.ok) raw = r.raw; else error = r.error; }
    if (signal.aborted) return;
    if (error?.retryable && attempt < 2) { await new Promise((res) => setTimeout(res, 1500 * (attempt + 1))); if (!signal.aborted) await run(signal, attempt + 1); return; }
    if (error) { setStatus({ loading: false, error, denied: false, unavailable: false }); return; }
    const data = d.validate(raw);
    if (data === null) { setStatus({ loading: false, error: apiError("bad_answer"), denied: false, unavailable: false }); return; }
    cache.set(key, { data, at: Date.now() }); setStatus({ loading: false, error: null, denied: false, unavailable: false }); bump();
  }, [key]);
  const [nonce, setNonce] = React.useState(0);
  const sessionKey = React.useSyncExternalStore(subscribeSession, () => { const x = getSession(); return def.availability === "NEEDS_SESSION" ? x.status : "-"; }, () => "-");
  React.useEffect(() => {
    const ac = new AbortController(); const onChange = (): void => bump(); subs.add(onChange);
    setStatus((s) => ({ ...s, loading: !cache.has(key) }));
    void run(ac.signal);
    const t = !DEMO && def.refreshMs && def.availability === "LEGACY_READ" ? setInterval(() => void run(ac.signal), def.refreshMs) : null;
    return () => { ac.abort(); subs.delete(onChange); if (t) clearInterval(t); };
  }, [key, run, nonce, def.refreshMs, def.availability, sessionKey]);
  const entry = cache.get(key), data = (entry?.data ?? null) as T | null;
  let state: QueryState;
  if (status.denied) state = "denied"; else if (status.unavailable) state = "unavailable";
  else if (status.error) state = data !== null ? "stale" : "error";
  else if (data === null) state = "loading";
  else state = def.isEmpty?.(data) ? "empty" : def.partialReason?.(data) ? "partial" : "ready";
  return { state, data, error: status.error, fetchedAt: entry?.at ?? null, provenance: DEMO ? "DEMO" : "LIVE", refetch: () => setNonce((n) => n + 1), def };
}
