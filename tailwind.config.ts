import type { Config } from "tailwindcss";

/** Every colour is a CSS variable (src/app/globals.css) holding an RGB triple, so one token set drives dark (default) and light, and alpha utilities keep working. */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"), surface: { DEFAULT: v("surface"), 2: v("surface-2"), 3: v("surface-3") }, line: { DEFAULT: v("line"), strong: v("line-strong") },
        fg: { DEFAULT: v("fg"), muted: v("fg-muted"), faint: v("fg-faint") }, accent: { DEFAULT: v("accent"), soft: v("accent-soft") },
        pos: { DEFAULT: v("pos"), soft: v("pos-soft") }, neg: { DEFAULT: v("neg"), soft: v("neg-soft") }, warn: { DEFAULT: v("warn"), soft: v("warn-soft") }, info: { DEFAULT: v("info"), soft: v("info-soft") },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-jb-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: { "2xs": ["0.6875rem", { lineHeight: "1rem" }] },
      borderRadius: { DEFAULT: "6px", lg: "8px" },
      screens: { xs: "420px" },
    },
  },
  plugins: [],
};
export default config;
