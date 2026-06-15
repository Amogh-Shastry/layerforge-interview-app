import { NextRequest, NextResponse } from "next/server";
import { getInterviewContext } from "@/lib/data";

export const dynamic = "force-dynamic";

// GET /api/interviews/:id/context → interview + job context (DB or demo fallback)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getInterviewContext(id);
    return NextResponse.json(ctx);
  } catch (error) {
    console.error("[GET /api/interviews/[id]/context]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
