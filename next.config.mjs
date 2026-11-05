import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // pages that showed sample data were removed; their routes now lead to the real equivalent
  async redirects() {
    return [
      { source: "/decisions", destination: "/approvals", permanent: false },
      { source: "/activity", destination: "/notifications", permanent: false },
      { source: "/snapshots", destination: "/market", permanent: false },
    ];
  },
};

export default nextConfig;
