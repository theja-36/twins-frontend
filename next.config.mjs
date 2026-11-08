import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // Always defined at build time ("0" unless explicitly "1"): DEMO mode shows clearly labelled development fixtures. Without it the fixtures chunk is not reachable.
  env: { NEXT_PUBLIC_TWINS_DEMO: process.env.NEXT_PUBLIC_TWINS_DEMO === "1" ? "1" : "0" },
  // Routes of the classic app and the Studio prototype lead to their Stage 09 equivalents (no link is left broken).
  async redirects() {
    const r = (source, destination) => ({ source, destination, permanent: false });
    return [
      r("/signals", "/telegram/history"), r("/claims", "/telegram/intake"), r("/channels", "/telegram/channels"), r("/intake", "/telegram/intake"), r("/history", "/telegram/history"),
      r("/agents", "/research/agents"), r("/decision/:id", "/decisions/:id"), r("/positions", "/execution/positions"), r("/pnl", "/performance/pnl"),
      r("/activity", "/notifications"), r("/snapshots", "/market"),
      r("/studio", "/"), r("/studio/deck", "/decisions"), r("/studio/signals", "/telegram/intake"), r("/studio/channels", "/telegram/channels"), r("/studio/market", "/market"), r("/studio/portfolio", "/execution/paper"), r("/studio/settings", "/settings"),
    ];
  },
};

export default nextConfig;
