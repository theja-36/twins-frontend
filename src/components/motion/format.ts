/** Number formatting shared by CountUp and tests (kept free of React so it can be unit tested). */
export function formatCount(n: number, decimals: number, prefix = "", suffix = ""): string {
  if (!Number.isFinite(n)) return "—";
  return `${prefix}${n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
}
