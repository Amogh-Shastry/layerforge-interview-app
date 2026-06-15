import { NextRequest, NextResponse } from "next/server";
import { getCandidate } from "@/lib/data";

export const dynamic = "force-dynamic";

// GET /api/candidates/:id → { candidate }
// `id` may be a candidate id or an interview id (both resolve).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const candidate = await getCandidate(id);
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }
    return NextResponse.json({ candidate });
  } catch (error) {
    console.error("[GET /api/candidates/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
