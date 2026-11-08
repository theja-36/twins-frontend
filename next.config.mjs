import path from "path";
import { fileURLToPath } from "url";
import { studioRedirects } from "./src/studio/routes.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // Always defined at build time ("0" unless explicitly "1") so the bundler can drop the Studio fixtures chunk from normal builds.
  env: { NEXT_PUBLIC_STUDIO_FIXTURES: process.env.NEXT_PUBLIC_STUDIO_FIXTURES === "1" ? "1" : "0" },
  // pages that showed sample data were removed; their routes now lead to the real equivalent
  async redirects() {
    return [
      { source: "/activity", destination: "/notifications", permanent: false },
      { source: "/snapshots", destination: "/market", permanent: false },
      // Studio transition: OFF unless the build sets TWINS_UI=studio (see src/studio/routes.mjs).
      ...studioRedirects(process.env.TWINS_UI === "studio"),
    ];
  },
};

export default nextConfig;
