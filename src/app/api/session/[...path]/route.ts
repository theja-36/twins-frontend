import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_PASS_PARAMS, backendBase, isAllowedSessionRead, isSessionToken, safeParam } from "@/lib/session/server";

/**
 * Read-only relay of the Stage 03 intelligence reads under the USER's own session token (from the HttpOnly cookie). The shared service key is never used here, and only GET on an allow-listed path exists.
 * A 401 from the backend (expired or revoked session) clears the cookie so the page falls back to "sign in".
 */
export const dynamic = "force-dynamic";
const no = { "cache-control": "no-store", vary: "Cookie" };
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const joined = (await ctx.params).path.join("/");
  if (!isAllowedSessionRead(joined)) return NextResponse.json({ error: "not_allowed" }, { status: 404, headers: no });
  const token = req.cookies.get(SESSION_COOKIE)?.value, base = backendBase();
  if (!base) return NextResponse.json({ error: "backend_not_configured" }, { status: 503, headers: no });
  if (!isSessionToken(token)) return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers: no });
  const url = new URL(`${base}/${joined}`);
  for (const p of SESSION_PASS_PARAMS) { const v = req.nextUrl.searchParams.get(p); if (safeParam(v)) url.searchParams.set(p, v); }
  try {
    const res = await fetch(url, { headers: { authorization: `Bearer ${token}`, accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    const out = new NextResponse(await res.text(), { status: res.status, headers: { "content-type": res.headers.get("content-type") ?? "application/json", ...no } });
    if (res.status === 401) out.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
    return out;
  } catch { return NextResponse.json({ error: "backend_unreachable" }, { status: 502, headers: no }); }
}
