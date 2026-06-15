import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { type, severity = "LOW", description, metadata } = await req.json();

    const event = await prisma.suspiciousEvent.create({
      data: {
        interviewId: id,
        type,
        severity,
        description,
        metadata,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/interviews/[id]/suspicious-event]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
