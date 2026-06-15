import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listInterviews } from "@/lib/data";

export const dynamic = "force-dynamic";

// GET /api/interviews → { interviews }
export async function GET() {
  try {
    const interviews = await listInterviews();
    return NextResponse.json({ interviews });
  } catch (error) {
    console.error("[GET /api/interviews]", error);
    return NextResponse.json({ interviews: [] });
  }
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// POST /api/interviews → schedule an interview for a position.
// Body: { positionId, candidateName, candidateEmail?, scheduledAt? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { positionId, candidateName, scheduledAt } = body;
    let candidateEmail: string | undefined = body.candidateEmail;

    if (!positionId || !candidateName) {
      return NextResponse.json({ error: "positionId and candidateName are required" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({ where: { id: positionId } });
    if (!job) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }

    if (!candidateEmail) {
      candidateEmail = `${slugify(candidateName)}-${Math.random().toString(36).slice(2, 8)}@candidate.local`;
    }

    const user = await prisma.user.upsert({
      where: { email: candidateEmail },
      update: { name: candidateName },
      create: { email: candidateEmail, name: candidateName, role: "CANDIDATE" },
    });

    const candidate = await prisma.candidate.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const application = await prisma.application.upsert({
      where: { candidateId_jobId: { candidateId: candidate.id, jobId: job.id } },
      update: { status: "INTERVIEW_SCHEDULED" },
      create: { candidateId: candidate.id, jobId: job.id, status: "INTERVIEW_SCHEDULED" },
    });

    const interview = await prisma.interview.create({
      data: {
        applicationId: application.id,
        type: "TECHNICAL",
        status: "SCHEDULED",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      },
    });

    return NextResponse.json({ interview: { id: interview.id }, link: `/interview/${interview.id}` }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/interviews]", error);
    return NextResponse.json({ error: "Failed to schedule interview" }, { status: 500 });
  }
}
