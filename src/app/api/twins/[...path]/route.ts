import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side, READ-ONLY proxy to the Twins backend API.
 *  - The backend bearer token lives only in server env (TWINS_API_KEY) and is never sent to the browser.
 *  - Only GET, and only an explicit allow-list of read endpoints, is forwarded. There is no way to create, change,
 *    approve or cancel anything through this proxy.
 *  - Not configured (no TWINS_API_URL / TWINS_API_KEY) => 503 { error: "backend_not_configured" }, and the UI shows mock data.
 */
export const dynamic = "force-dynamic";

const ALLOWED: RegExp[] = [
  /^health$/,
  /^health\/status$/,
  /^risk\/decisions$/,
  /^risk\/approvals$/,
  /^paper\/(status|summary|positions|outcomes|outcomes\/stats)$/,
  /^agents\/status$/,
  /^notifications$/,
  /^system\/config$/,
  /^paper\/trades\/[0-9a-f-]{36}\/events$/i,
];
const PASS_PARAMS = ["limit", "status", "state"];

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const joined = path.join("/");
  if (!ALLOWED.some((r) => r.test(joined))) return NextResponse.json({ error: "not_allowed" }, { status: 404 });
  const base = process.env.TWINS_API_URL;
  const key = process.env.TWINS_API_KEY;
  if (!base || !key) return NextResponse.json({ error: "backend_not_configured" }, { status: 503 });

  const url = new URL(`${base.replace(/\/+$/, "")}/${joined}`);
  for (const p of PASS_PARAMS) {
    const v = req.nextUrl.searchParams.get(p);
    if (v !== null && /^[A-Za-z0-9_]{1,40}$/.test(v)) url.searchParams.set(p, v);
  }
  try {
    const res = await fetch(url, { headers: { authorization: `Bearer ${key}`, accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    const body = await res.text();
    return new NextResponse(body, { status: res.status, headers: { "content-type": res.headers.get("content-type") ?? "application/json", "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "backend_unreachable" }, { status: 502 });
  }
}
