import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            candidate: { include: { user: true } },
            job: true,
          },
        },
        messages: { orderBy: { timestamp: "asc" } },
        evaluation: true,
        report: true,
        suspiciousEvents: { orderBy: { timestamp: "desc" } },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    return NextResponse.json({ interview });
  } catch (error) {
    console.error("[GET /api/interviews/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, startedAt, completedAt, durationSeconds } = body;

    const interview = await prisma.interview.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(startedAt ? { startedAt: new Date(startedAt) } : {}),
        ...(completedAt ? { completedAt: new Date(completedAt) } : {}),
        ...(durationSeconds !== undefined ? { durationSeconds } : {}),
      },
    });

    return NextResponse.json({ interview });
  } catch (error) {
    console.error("[PATCH /api/interviews/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
