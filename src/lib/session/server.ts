/**
 * Server-side session helpers (no Next imports, so they are unit-testable).
 * The web app adds NO authentication of its own: it relays to the backend's existing account API (POST /auth/login, POST /auth/logout, GET /auth/me) and keeps the opaque backend session token in an
 * HttpOnly cookie, so page scripts can never read it. Every state-changing call needs the same origin AND a matching CSRF token (double submit); reads go only through an allow-listed GET relay.
 */
import { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE } from "./shared";
export { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE };

/** Backend session tokens look like `tws_` + url-safe characters; anything else is never forwarded. */
export const isSessionToken = (v: string | undefined | null): v is string => typeof v === "string" && /^tws_[A-Za-z0-9_-]{16,200}$/.test(v);
export const isCsrfToken = (v: string | undefined | null): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{32,128}$/.test(v);

/** Same origin: the Origin header (when present) must equal the request's own origin; a request with no Origin must at least not be flagged cross-site by the browser. */
export function sameOrigin(origin: string | null, host: string | null, fetchSite: string | null): boolean {
  if (origin !== null) { try { return new URL(origin).host === host; } catch { return false; } }
  return fetchSite === null || fetchSite === "same-origin" || fetchSite === "none";
}
/** Double submit: the header must equal the cookie, both well-formed. Compared in constant time. */
export function csrfOk(cookie: string | undefined | null, header: string | null): boolean {
  if (!isCsrfToken(cookie) || !isCsrfToken(header) || cookie.length !== header.length) return false;
  let d = 0; for (let i = 0; i < cookie.length; i++) d |= cookie.charCodeAt(i) ^ header.charCodeAt(i);
  return d === 0;
}
export function sessionCookieOptions(expiresAt: Date, secure: boolean, now: Date = new Date()): { httpOnly: true; sameSite: "strict"; secure: boolean; path: string; maxAge: number } {
  return { httpOnly: true, sameSite: "strict", secure, path: "/", maxAge: Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000)) };
}

/** The ONLY backend paths a session may read through the relay: the Stage 03 intelligence reads, by shape. Everything else is 404; nothing but GET exists. */
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
export const SESSION_READ_ALLOW: RegExp[] = [
  /^intelligence\/(channels|claims|candidates|pipeline|playbooks|archive\/channels)$/,
  new RegExp(`^intelligence/channels/${UUID}(/performance)?$`, "i"),
  new RegExp(`^intelligence/claims/${UUID}(/historical-matches)?$`, "i"),
  new RegExp(`^intelligence/playbooks/${UUID}$`, "i"),
];
export const SESSION_PASS_PARAMS = ["limit", "offset", "channelId", "kind", "state"] as const;
export const isAllowedSessionRead = (path: string): boolean => SESSION_READ_ALLOW.some((r) => r.test(path));
export const safeParam = (v: string | null): v is string => v !== null && /^[A-Za-z0-9_-]{1,40}$/.test(v);

export const backendBase = (env: Record<string, string | undefined> = process.env): string | null => { const b = env["TWINS_API_URL"]; return b ? b.replace(/\/+$/, "") : null; };
