"use client";
import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Focus-trapping dialog shell shared by Modal, Drawer and ConfirmDialog: Escape closes, focus returns to the opener, background scroll is locked. */
function useDialog(open: boolean, onClose: () => void) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null, body = document.body.style.overflow; document.body.style.overflow = "hidden";
    const first = ref.current?.querySelector<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"); first?.focus();
    const key = (e: KeyboardEvent): void => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "Tab" && ref.current) {
        const f = [...ref.current.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex='-1'])")]; if (!f.length) return;
        const a = f[0] as HTMLElement, z = f[f.length - 1] as HTMLElement;
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = body; prev?.focus(); };
  }, [open, onClose]);
  return ref;
}
export function Drawer({ open, onClose, title, children, width = "max-w-xl" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: string }) {
  const ref = useDialog(open, onClose), reduce = useReducedMotion(), id = React.useId();
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70]">
          <motion.div className="absolute inset-0 bg-black/60" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
          <motion.div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} className={cn("absolute inset-y-0 right-0 flex w-full flex-col border-l border-line bg-surface shadow-2xl", width)}
            initial={reduce ? false : { x: 32, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 32, opacity: 0 }} transition={{ duration: 0.16 }}>
            <div className="flex items-center justify-between border-b border-line px-4 py-3"><h2 id={id} className="text-sm font-semibold">{title}</h2><button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-fg-muted hover:bg-surface-3 hover:text-fg"><X className="h-4 w-4" /></button></div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useDialog(open, onClose), id = React.useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} className="relative w-full max-w-md rounded-lg border border-line bg-surface p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between"><h2 id={id} className="text-sm font-semibold">{title}</h2><button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-fg-muted hover:bg-surface-3"><X className="h-4 w-4" /></button></div>
        {children}
      </div>
    </div>
  );
}
/** A confirmation step for an action the backend itself would still have to authorise. The confirm button is disabled (with the reason shown) when the action is not available. */
export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel, tone = "accent", disabledReason }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: React.ReactNode; confirmLabel: string; tone?: "accent" | "bad"; disabledReason?: string }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4 text-sm text-fg-muted">{body}
        {disabledReason ? <p role="note" className="rounded border border-warn/30 bg-warn/10 px-2 py-1.5 text-warn">{disabledReason}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border border-line px-3 py-1.5 text-fg hover:bg-surface-3">Cancel</button>
          <button type="button" disabled={Boolean(disabledReason)} onClick={() => { onConfirm(); onClose(); }} className={cn("rounded px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40", tone === "bad" ? "bg-neg text-bg" : "bg-accent text-bg")}>{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
