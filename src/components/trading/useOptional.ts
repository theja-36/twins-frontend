"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackendError, RETRY_EVENT, reportError, reportOk } from "@/services/backendState";

/**
 * Loads an endpoint that an OLDER backend may not have yet. A 404 means "this backend does not offer it" and is a normal state (`absent`), not a backend error, so it never raises the global banner.
 * Every other failure is reported like the other calls (per endpoint); the last good value is kept.
 */
export type Optional<T> = { state: "loading" } | { state: "absent" } | { state: "ready"; data: T };
export function useOptional<T>(path: string, everyMs = 20_000): Optional<T> {
  const [v, setV] = useState<Optional<T>>({ state: "loading" });
  const key = path.split("?")[0] ?? path;
  const pathRef = useRef(path); pathRef.current = path;
  const run = useCallback(async () => {
    try {
      const res = await fetch(`/api/twins/${pathRef.current}`, { cache: "no-store" });
      if (res.status === 404) { reportOk(key); setV({ state: "absent" }); return; }
      if (res.status === 503) { reportError("not_configured", key); throw new BackendError("not_configured"); }
      if (res.status === 401) { reportError("unauthorized", key); throw new BackendError("unauthorized"); }
      if (!res.ok) { reportError(res.status >= 500 ? "unreachable" : "bad_answer", key); throw new BackendError("bad_answer"); }
      reportOk(key); setV({ state: "ready", data: (await res.json()) as T });
    } catch (e) { if (!(e instanceof BackendError)) reportError("unreachable", key); }
  }, [key]);
  useEffect(() => {
    void run();
    const t = setInterval(() => void run(), everyMs);
    const retry = () => void run();
    window.addEventListener(RETRY_EVENT, retry);
    return () => { clearInterval(t); window.removeEventListener(RETRY_EVENT, retry); };
  }, [run, everyMs]);
  return v;
}
