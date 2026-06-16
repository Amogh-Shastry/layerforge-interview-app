import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Lightweight liveness probe — no DB, no OpenAI, returns instantly.
// Used by Render's health check and by the keep-alive pinger that prevents
// free-tier spin-down. Must stay public (not gated by the dashboard auth proxy).
export async function GET() {
  return NextResponse.json({ status: "ok", ts: Date.now() });
}

export function HEAD() {
  return new Response(null, { status: 200 });
}
