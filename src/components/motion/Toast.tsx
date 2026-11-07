"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type Tone = "info" | "success" | "warn";
interface ToastItem { id: number; tone: Tone; text: string }
const Ctx = React.createContext<{ toast: (text: string, tone?: Tone) => void }>({ toast: () => undefined });
export const useToast = (): { toast: (text: string, tone?: Tone) => void } => React.useContext(Ctx);

/** Toasts live in an aria-live region, stack bottom-right and close on their own after 4 s (or by the X). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const next = React.useRef(1);
  const dismiss = React.useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const toast = React.useCallback((text: string, tone: Tone = "info") => {
    const id = next.current++;
    setItems((l) => [...l.slice(-3), { id, tone, text: text.slice(0, 200) }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);
  const Icon = { info: Info, success: CheckCircle2, warn: TriangleAlert };
  const color = { info: "text-royal-500", success: "text-emerald-500", warn: "text-amber-500" };
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((t) => { const I = Icon[t.tone]; return (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-3 text-sm text-ink shadow-dropdown">
              <I className={`mt-0.5 h-4 w-4 shrink-0 ${color[t.tone]}`} aria-hidden />
              <p className="min-w-0 flex-1">{t.text}</p>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="rounded p-0.5 text-slate-400 hover:text-ink"><X className="h-4 w-4" /></button>
            </motion.div>); })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
