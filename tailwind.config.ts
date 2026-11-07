import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#F4F6F8", // Warm off-white canvas
          subtle: "#ECEFF2",
          surface: "#FFFFFF",
          muted: "#E2E8F0",
        },
        ink: {
          DEFAULT: "#0A0E17", // Near-black crisp typography
          secondary: "#475569",
          muted: "#94A3B8",
          faint: "#CBD5E1",
        },
        // Cockpit palette: ONE accent system. teal = live / positive / buy, coral = negative / sell / risk, amber (tailwind default) = caution.
        royal: { 50: "#E6FBF6", 100: "#C2F5E8", 200: "#8CEBD4", 300: "#4FE0C0", 400: "#1FD9B1", 500: "#00D4AA", 600: "#00B891", 700: "#008F70", 800: "#066B56", 900: "#0A5444", 950: "#06362C" },
        acid: { 50: "#E6FBF6", 100: "#C2F5E8", 200: "#8CEBD4", 300: "#4FE0C0", 400: "#00D4AA", 500: "#00B891", 600: "#008F70", 700: "#066B56" },
        emerald: { 50: "#E6FBF6", 100: "#C2F5E8", 200: "#8CEBD4", 300: "#4FE0C0", 400: "#1FD9B1", 500: "#00D4AA", 600: "#00B891", 700: "#008F70", 800: "#066B56", 900: "#0A5444", 950: "#06362C" },
        rose: { 50: "#FFEEF0", 100: "#FFD9DD", 200: "#FFB3BB", 300: "#FF8793", 400: "#FF6272", 500: "#FF4757", 600: "#E5303F", 700: "#BF2432", 800: "#8F1C27", 900: "#6B161E", 950: "#3D0C11" },
      },
      boxShadow: {
        card: "0 0 0 0 transparent",
        cardHover: "0 8px 16px -4px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
        hero: "0 10px 25px -5px rgba(29, 78, 216, 0.12), 0 8px 10px -6px rgba(29, 78, 216, 0.08)",
        dropdown: "0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-jb-mono)", "var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "pulse-ring": { "0%": { boxShadow: "0 0 0 0 currentColor", opacity: "1" }, "70%": { boxShadow: "0 0 0 6px transparent", opacity: "1" }, "100%": { boxShadow: "0 0 0 0 transparent", opacity: "1" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: { "fade-up": "fade-up .35s ease-out both", "pulse-ring": "pulse-ring 2s ease-out infinite", shimmer: "shimmer 1.6s linear infinite" },
    },
  },
  plugins: [],
};
export default config;
