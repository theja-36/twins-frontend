import { NextRequest, NextResponse } from "next/server";
import { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE, backendBase, csrfOk, isSessionToken, sameOrigin } from "@/lib/session/server";

/** Revokes the session at the backend (POST /auth/logout) and clears the cookie. The cookie is cleared even if the backend cannot be reached, so the browser never keeps a session the user ended. */
export const dynamic = "force-dynamic";
const no = { "cache-control": "no-store" };
export async function POST(req: NextRequest) {
  if (!sameOrigin(req.headers.get("origin"), req.headers.get("host"), req.headers.get("sec-fetch-site"))) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: no });
  if (!csrfOk(req.cookies.get(CSRF_COOKIE)?.value, req.headers.get(CSRF_HEADER))) return NextResponse.json({ error: "csrf" }, { status: 403, headers: no });
  const token = req.cookies.get(SESSION_COOKIE)?.value, base = backendBase();
  let revoked = false;
  if (isSessionToken(token) && base) { try { const r = await fetch(`${base}/auth/logout`, { method: "POST", headers: { authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8000) }); revoked = r.ok || r.status === 401; } catch { revoked = false; } }
  const out = NextResponse.json({ signedOut: true, revokedAtBackend: revoked }, { headers: no });
  out.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  return out;
}
