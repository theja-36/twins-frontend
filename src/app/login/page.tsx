"use client";
import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Banner } from "@/ds/states";
import { Card, CardBody } from "@/ds/primitives";
import { login, useSession } from "@/api/session";

const FAIL: Record<string, string> = {
  invalid_credentials: "The email or password is not correct.",
  rate_limited: "Too many attempts. Wait a few minutes and try again.",
  csrf: "The request was refused. Reload the page and try again.",
  unavailable: "The sign-in service could not be reached. Nothing was submitted to any other place.",
};
/** A relative, same-site path only: a `next` value can never send the user to another origin. */
const safeNext = (v: string | null): string => (v && /^\/(?!\/)[A-Za-z0-9/_?=&.-]*$/.test(v) ? v : "/");

function Inner() {
  const router = useRouter(), q = useSearchParams(), session = useSession();
  const [email, setEmail] = React.useState(""), [password, setPassword] = React.useState(""), [busy, setBusy] = React.useState(false), [fail, setFail] = React.useState<string | null>(null);
  React.useEffect(() => { if (session.status === "authenticated") router.replace(safeNext(q.get("next"))); }, [session.status, router, q]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setFail(null);
    const r = await login(email, password); setBusy(false); setPassword("");
    if (!r.ok) setFail(r.reason);
  }
  const ended = session.status === "anonymous" && session.ended;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4 py-10">
      <div><h1 className="text-2xl font-semibold tracking-tight">TWINS</h1><p className="text-sm text-fg-muted">Private trading-intelligence platform · paper trading only</p></div>
      {ended && <Banner tone="warn" title="Your session ended" live>It expired or was revoked. Sign in again to continue.</Banner>}
      {session.status === "unavailable" && <Banner tone="bad" title="Sign-in is unavailable" live>{session.reason === "backend_not_configured" ? "This web app is not connected to a backend." : "The backend could not be reached."}</Banner>}
      {fail && <Banner tone="bad" title="Could not sign in" live>{FAIL[fail]}</Banner>}
      <Card><CardBody>
        <form onSubmit={submit} className="space-y-3" noValidate>
          <label className="block text-sm"><span className="label">Email</span><input required type="email" name="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-sm" /></label>
          <label className="block text-sm"><span className="label">Password</span><input required type="password" name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-sm" /></label>
          <button type="submit" disabled={busy || email.length === 0 || password.length === 0} className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-bg disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
          <p className="text-xs text-fg-muted">Your password is sent only to this site&rsquo;s server, which relays it to the TWINS backend. It is never stored in the browser, and the session is kept in a cookie the page cannot read.</p>
        </form>
      </CardBody></Card>
      <a href="/" className="text-sm text-accent underline">Continue to the read-only dashboard</a>
    </main>
  );
}
export default function LoginPage() { return <Suspense><Inner /></Suspense>; }
