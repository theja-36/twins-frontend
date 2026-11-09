import { NextRequest, NextResponse } from "next/server";
import { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE, backendBase, csrfOk, sameOrigin, sessionCookieOptions } from "@/lib/session/server";

/** Relays a login to the backend's existing POST /auth/login. The backend token goes into an HttpOnly cookie and is NEVER returned to the page. */
export const dynamic = "force-dynamic";
const no = { "cache-control": "no-store" };
export async function POST(req: NextRequest) {
  if (!sameOrigin(req.headers.get("origin"), req.headers.get("host"), req.headers.get("sec-fetch-site"))) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: no });
  if (!csrfOk(req.cookies.get(CSRF_COOKIE)?.value, req.headers.get(CSRF_HEADER))) return NextResponse.json({ error: "csrf" }, { status: 403, headers: no });
  const base = backendBase(); if (!base) return NextResponse.json({ error: "backend_not_configured" }, { status: 503, headers: no });
  let body: unknown; try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_input" }, { status: 400, headers: no }); }
  const b = body as Record<string, unknown>;
  if (typeof b !== "object" || b === null || Object.keys(b).some((k) => k !== "email" && k !== "password") || typeof b["email"] !== "string" || typeof b["password"] !== "string") return NextResponse.json({ error: "invalid_input" }, { status: 400, headers: no });
  try {
    const res = await fetch(`${base}/auth/login`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ email: b["email"], password: b["password"] }), cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return NextResponse.json({ error: res.status === 429 ? "rate_limited" : res.status === 401 ? "invalid_credentials" : "login_failed" }, { status: res.status === 429 ? 429 : res.status === 401 ? 401 : 502, headers: no });
    const j = (await res.json()) as { token?: unknown; expiresAt?: unknown; user?: unknown };
    const exp = typeof j.expiresAt === "string" ? new Date(j.expiresAt) : null;
    if (typeof j.token !== "string" || !exp || !Number.isFinite(exp.getTime())) return NextResponse.json({ error: "login_failed" }, { status: 502, headers: no });
    const out = NextResponse.json({ user: j.user, expiresAt: exp.toISOString() }, { headers: no });
    out.cookies.set(SESSION_COOKIE, j.token, sessionCookieOptions(exp, req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https"));
    return out;
  } catch { return NextResponse.json({ error: "backend_unreachable" }, { status: 502, headers: no }); }
}
