"use client";
import React from "react";
import { CSRF_COOKIE, CSRF_HEADER } from "../lib/session/shared";

/**
 * Client view of the web session. The session token lives only in an HttpOnly cookie managed by the server routes under /api/auth; this module knows only WHO is signed in (asked from the backend) and never sees a token.
 * Anything cached for one user is discarded whenever the signed-in user changes, so one user's data is never shown to the next.
 */
export type SessionUser = { id?: string; email?: string; displayName?: string | null; roles?: string[] } & Record<string, unknown>;
export type SessionState = { status: "unknown" } | { status: "anonymous"; ended: boolean } | { status: "authenticated"; user: SessionUser } | { status: "unavailable"; reason: string };

let state: SessionState = { status: "unknown" };
const subs = new Set<() => void>();
let onUserChange: (() => void) | null = null;
export const setUserChangeHandler = (f: () => void): void => { onUserChange = f; };
const userKey = (s: SessionState): string => (s.status === "authenticated" ? String(s.user.id ?? s.user.email ?? "user") : s.status);
function set(next: SessionState): void { const changed = userKey(state) !== userKey(next); state = next; if (changed) onUserChange?.(); subs.forEach((f) => f()); }
export const getSession = (): SessionState => state;
export const subscribeSession = (f: () => void): (() => void) => { subs.add(f); return () => { subs.delete(f); }; };
/** A read answered 401: the session ended (expired or revoked) behind our back. */
export const sessionEnded = (): void => { if (state.status === "authenticated") set({ status: "anonymous", ended: true }); };

const csrf = (): string => { try { return document.cookie.split("; ").find((c) => c.startsWith(`${CSRF_COOKIE}=`))?.split("=")[1] ?? ""; } catch { return ""; } };
export async function refreshSession(): Promise<SessionState> {
  try {
    const r = await fetch("/api/auth/me", { cache: "no-store" }), j = (await r.json()) as { state?: string; user?: SessionUser; ended?: boolean; reason?: string };
    set(j.state === "authenticated" && j.user ? { status: "authenticated", user: j.user } : j.state === "anonymous" ? { status: "anonymous", ended: j.ended === true } : { status: "unavailable", reason: j.reason ?? "unavailable" });
  } catch { set({ status: "unavailable", reason: "unreachable" }); }
  return state;
}
export type LoginResult = { ok: true } | { ok: false; reason: "invalid_credentials" | "rate_limited" | "unavailable" | "csrf" };
export async function login(email: string, password: string): Promise<LoginResult> {
  if (!csrf()) await refreshSession(); // issues the CSRF cookie
  try {
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json", [CSRF_HEADER]: csrf() }, body: JSON.stringify({ email, password }), cache: "no-store" });
    if (r.ok) { await refreshSession(); return { ok: true }; }
    return { ok: false, reason: r.status === 401 ? "invalid_credentials" : r.status === 429 ? "rate_limited" : r.status === 403 ? "csrf" : "unavailable" };
  } catch { return { ok: false, reason: "unavailable" }; }
}
export async function logout(): Promise<void> {
  try { await fetch("/api/auth/logout", { method: "POST", headers: { [CSRF_HEADER]: csrf() }, cache: "no-store" }); } catch { /* the cookie is cleared server side whenever the call arrives; below we also forget locally */ }
  set({ status: "anonymous", ended: false });
}
export function useSession(): SessionState {
  const s = React.useSyncExternalStore(subscribeSession, getSession, () => ({ status: "unknown" }) as SessionState);
  React.useEffect(() => { if (getSession().status === "unknown") void refreshSession(); }, []);
  return s;
}
