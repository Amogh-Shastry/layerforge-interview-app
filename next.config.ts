import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin the tracing/Turbopack root to THIS project so a stray parent lockfile
  // can't push the inferred root upward (which nests standalone server.js under
  // a wrong path and breaks the Docker/Render build).
  outputFileTracingRoot: path.join(__dirname),
  turbopack: { root: path.join(__dirname) },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  // Optional API proxy: when API_PROXY_TARGET is set (e.g. on Vercel), all
  // /api/* requests are forwarded to that backend (e.g. the Render deployment).
  // This lets Vercel serve the UI while the API runs on Render — same-origin
  // from the browser, so login cookies and CORS keep working. Leave the var
  // UNSET on Render and locally so each serves its own /api.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET?.replace(/\/$/, "");
    if (!target) return [];
    return {
      beforeFiles: [{ source: "/api/:path*", destination: `${target}/api/:path*` }],
    };
  },
};

export default nextConfig;
