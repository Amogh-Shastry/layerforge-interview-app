import { NextResponse } from "next/server";
import { getMetrics, listInterviews, listPositions } from "@/lib/data";

export const dynamic = "force-dynamic";

// GET /api/overview → { metrics, recentInterviews, positions }
export async function GET() {
  try {
    const [metrics, interviews, positions] = await Promise.all([getMetrics(), listInterviews(), listPositions()]);
    return NextResponse.json({
      metrics,
      recentInterviews: interviews.slice(0, 6),
      positions: positions.slice(0, 6),
    });
  } catch (error) {
    console.error("[GET /api/overview]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
