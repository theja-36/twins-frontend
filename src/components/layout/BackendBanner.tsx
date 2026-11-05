"use client";
import React from "react";
import { ERROR_TEXT, requestRetry, useBackendState } from "@/services/backendState";

/** The ONE place that says the backend is unavailable. Shown above every page while a data call is failing. */
export function BackendBanner() {
  const st = useBackendState();
  if (st.error === null) return null;
  const t = ERROR_TEXT[st.error];
  return (
    <div role="alert" className="border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <span><b>{t.title}.</b> {t.body}{st.failing.length ? ` (affected: ${st.failing.join(", ")}.)` : ""}{st.lastOkAt ? ` Anything still on screen is from ${new Date(st.lastOkAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} and may be stale.` : ""}</span>
        <button onClick={requestRetry} className="rounded-lg border border-rose-300 px-2.5 py-1 font-semibold hover:bg-white/60">Retry now</button>
      </div>
    </div>
  );
}
