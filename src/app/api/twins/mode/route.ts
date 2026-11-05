import { NextResponse } from "next/server";

/** Tells the browser whether this server is wired to a backend (it never reveals the address or the token). */
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json({ configured: Boolean(process.env.TWINS_API_URL && process.env.TWINS_API_KEY) }, { headers: { "cache-control": "no-store" } });
}
