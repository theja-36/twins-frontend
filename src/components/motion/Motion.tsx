"use client";

import React from "react";
import { animate, motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import { formatCount } from "./format";

/** Motion primitives. Every one of them respects `prefers-reduced-motion`: with it set, content simply appears. */

export function PageTransition({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const reduce = useReducedMotion();
  return (
    <motion.div key={path} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } } };
const item: Variants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } } };

/** Children fade up one after another. Wrap each child in <StaggerItem>. */
export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} variants={container} initial={reduce ? "show" : "hidden"} animate="show">{children}</motion.div>;
}
export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <motion.div className={className} variants={item}>{children}</motion.div>;
}

/** A card that lifts slightly on hover (and on keyboard focus within). */
export function HoverLift({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} whileHover={reduce ? undefined : { y: -2 }} transition={{ type: "spring", stiffness: 380, damping: 26 }}>{children}</motion.div>;
}

/** Counts up to `value` once it scrolls into view. Reduced motion or a non-finite value renders the final text at once. */
export function CountUp({ value, decimals = 0, prefix = "", suffix = "", className }: { value: number | null | undefined; decimals?: number; prefix?: string; suffix?: string; className?: string }) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const finite = typeof value === "number" && Number.isFinite(value);
  const [text, setText] = React.useState(finite ? formatCount(reduce ? value : 0, decimals, prefix, suffix) : "—");
  React.useEffect(() => {
    if (!finite) { setText("—"); return; }
    if (reduce || !inView) { setText(formatCount(value, decimals, prefix, suffix)); return; }
    const c = animate(0, value, { duration: 0.9, ease: "easeOut", onUpdate: (v) => setText(formatCount(v, decimals, prefix, suffix)) });
    return () => c.stop();
  }, [value, finite, reduce, inView, decimals, prefix, suffix]);
  return <span ref={ref} className={className} aria-label={finite ? formatCount(value, decimals, prefix, suffix) : "not available"}>{text}</span>;
}

/** Status dot with a soft pulse ring while the state is live. */
export function PulseDot({ tone, live = true, label }: { tone: "ok" | "warn" | "bad" | "off"; live?: boolean; label?: string }) {
  const color = tone === "ok" ? "text-emerald-500" : tone === "warn" ? "text-amber-500" : tone === "bad" ? "text-rose-500" : "text-slate-400";
  return <span role="img" aria-label={label ?? tone} className={`inline-block h-2 w-2 rounded-full bg-current ${color} ${live && tone !== "off" ? "motion-safe:animate-pulse-ring" : ""}`} />;
}

/** Draws a line/area in from the left (chart draw-in). */
export function DrawIn({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? false : { clipPath: "inset(0 100% 0 0)" }} animate={{ clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 0.9, ease: "easeOut" }}>{children}</motion.div>;
}

/** Tiny line chart (no axes). Draws in once; static under reduced motion. `path` comes from `sparkPath`. */
export function Sparkline({ path, tone = "up", width = 160, height = 40, label }: { path: string; tone?: "up" | "down" | "flat"; width?: number; height?: number; label: string }) {
  const reduce = useReducedMotion();
  const stroke = tone === "down" ? "#FF4757" : tone === "up" ? "#00D4AA" : "#8E9BB5";
  if (!path) return <div className="font-mono text-[11px] text-slate-400" style={{ width, height, lineHeight: `${height}px` }}>no data</div>;
  return (
    <svg role="img" aria-label={label} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <motion.path d={path} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" initial={reduce ? false : { pathLength: 0, opacity: 0.4 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.9, ease: "easeOut" }} />
    </svg>
  );
}
