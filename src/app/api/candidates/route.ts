import { NextResponse } from "next/server";
import { listInterviews, getMetrics } from "@/lib/data";

export const dynamic = "force-dynamic";

// GET /api/candidates → { interviews, metrics }
// Retained for compatibility; interview-centric data now lives at /api/interviews.
export async function GET() {
  try {
    const [interviews, metrics] = await Promise.all([listInterviews(), getMetrics()]);
    return NextResponse.json({ interviews, metrics });
  } catch (error) {
    console.error("[GET /api/candidates]", error);
    return NextResponse.json({ interviews: [], metrics: null });
  }
}
