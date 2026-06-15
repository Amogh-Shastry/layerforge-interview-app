import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    const jobs = await prisma.job.findMany({
      where: {
        isActive: true,
        ...(organizationId ? { organizationId } : {}),
      },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, organizationId, requiredSkills, softSkills, experienceMin, experienceMax } = body;

    if (!title || !organizationId) {
      return NextResponse.json({ error: "title and organizationId are required" }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description: description ?? "",
        organizationId,
        requiredSkills: requiredSkills ?? [],
        softSkills: softSkills ?? [],
        experienceMin: experienceMin ?? 0,
        experienceMax,
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
