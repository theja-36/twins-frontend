"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Banner } from "@/ds/states";
import { Card, CardBody } from "@/ds/primitives";

const NOTICE: Record<string, { tone: "warn" | "bad" | "info"; title: string; body: string }> = {
  expired: { tone: "warn", title: "Your session expired", body: "Sign in again to continue. (Display state: sessions do not exist yet.)" },
  denied: { tone: "bad", title: "Access denied", body: "This account does not have permission for that screen. (Display state.)" },
  error: { tone: "bad", title: "Sign-in is unavailable", body: "The sign-in service could not be reached. (Display state.)" },
};
function Inner() {
  const p = useSearchParams().get("state") ?? "", n = NOTICE[p];
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4 py-10">
      <div><h1 className="text-2xl font-semibold tracking-tight">TWINS</h1><p className="text-sm text-fg-muted">Private trading-intelligence platform · paper trading only</p></div>
      {n && <Banner tone={n.tone} title={n.title} live>{n.body}</Banner>}
      <Banner tone="warn" title="Sign-in is not available yet">User accounts and sessions are a known open gap (Stage 01). Until they exist this form is intentionally inactive: the app does not accept a password, and it does not treat its shared server token as anyone&rsquo;s identity. Screens that need an owner show an access-required state instead of data.</Banner>
      <Card><CardBody>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-3" aria-describedby="login-note">
          <label className="block text-sm"><span className="label">Email</span><input disabled type="email" autoComplete="username" className="mt-1 w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-sm opacity-60" /></label>
          <label className="block text-sm"><span className="label">Password</span><input disabled type="password" autoComplete="current-password" className="mt-1 w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-sm opacity-60" /></label>
          <button type="submit" disabled aria-disabled className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-bg opacity-40">Sign in</button>
          <p id="login-note" className="text-xs text-fg-muted">Disabled: no authentication backend exists to send this to.</p>
        </form>
      </CardBody></Card>
      <a href="/" className="text-sm text-accent underline">Continue to the read-only dashboard</a>
    </main>
  );
}
export default function LoginPage() { return <Suspense><Inner /></Suspense>; }
