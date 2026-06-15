import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listPositions } from "@/lib/data";

export const dynamic = "force-dynamic";

// GET /api/positions → { positions }
export async function GET() {
  try {
    const positions = await listPositions();
    return NextResponse.json({ positions });
  } catch (error) {
    console.error("[GET /api/positions]", error);
    return NextResponse.json({ positions: [] });
  }
}

async function getOrgId(): Promise<string> {
  const org = await prisma.organization.upsert({
    where: { slug: "deepstation" },
    update: {},
    create: { name: "DeepStation AI", slug: "deepstation" },
  });
  return org.id;
}

// POST /api/positions → create a position (job posting with skills).
// Body: { title, description?, requiredSkills[], softSkills?[], experienceMin? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, companyIntro, requirements, expectations, requiredSkills, softSkills, customQuestions, experienceMin } = body;

    if (!title || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return NextResponse.json({ error: "title and at least one required skill are needed" }, { status: 400 });
    }

    const organizationId = await getOrgId();
    const job = await prisma.job.create({
      data: {
        title,
        description: description ?? `${title} interview conducted by Nova.`,
        organizationId,
        companyIntro: companyIntro ?? null,
        requirements: requirements ?? null,
        expectations: expectations ?? null,
        requiredSkills,
        softSkills: Array.isArray(softSkills) ? softSkills : [],
        customQuestions: Array.isArray(customQuestions) ? customQuestions : [],
        experienceMin: typeof experienceMin === "number" ? experienceMin : 0,
      },
    });

    return NextResponse.json({ position: { id: job.id } }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/positions]", error);
    return NextResponse.json({ error: "Failed to create position" }, { status: 500 });
  }
}
