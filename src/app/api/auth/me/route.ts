import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { CSRF_COOKIE, SESSION_COOKIE, backendBase, isCsrfToken, isSessionToken } from "@/lib/session/server";

/** Who is signed in (asks the backend, so expiry and revocation are real), and issues the CSRF double-submit cookie. 401 clears a dead session cookie. */
export const dynamic = "force-dynamic";
const no = { "cache-control": "no-store", vary: "Cookie" };
export async function GET(req: NextRequest) {
  const out = (body: unknown, status: number): NextResponse => {
    const r = NextResponse.json(body, { status, headers: no });
    if (!isCsrfToken(req.cookies.get(CSRF_COOKIE)?.value)) r.cookies.set(CSRF_COOKIE, randomBytes(32).toString("base64url"), { httpOnly: false, sameSite: "strict", path: "/", secure: req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https" });
    return r;
  };
  const base = backendBase(), token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!base) return out({ state: "unavailable", reason: "backend_not_configured" }, 200);
  if (!isSessionToken(token)) return out({ state: "anonymous" }, 200);
  try {
    const res = await fetch(`${base}/auth/me`, { headers: { authorization: `Bearer ${token}`, accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (res.status === 401) { const r = out({ state: "anonymous", ended: true }, 200); r.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 }); return r; }
    if (!res.ok) return out({ state: "unavailable", reason: "backend_error" }, 200);
    const j = (await res.json()) as { user?: unknown };
    return out({ state: "authenticated", user: j.user }, 200);
  } catch { return out({ state: "unavailable", reason: "backend_unreachable" }, 200); }
}
