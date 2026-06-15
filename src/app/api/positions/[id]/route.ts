import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPosition } from "@/lib/data";

export const dynamic = "force-dynamic";

// GET /api/positions/:id → { position } (used by the public candidate entry page)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const position = await getPosition(id);
    if (!position) return NextResponse.json({ error: "Position not found" }, { status: 404 });
    return NextResponse.json({ position });
  } catch (error) {
    console.error("[GET /api/positions/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/positions/:id → edit a position.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const job = await prisma.job.update({
      where: { id },
      data: {
        ...(body.title ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.companyIntro !== undefined ? { companyIntro: body.companyIntro } : {}),
        ...(body.requirements !== undefined ? { requirements: body.requirements } : {}),
        ...(body.expectations !== undefined ? { expectations: body.expectations } : {}),
        ...(Array.isArray(body.requiredSkills) ? { requiredSkills: body.requiredSkills } : {}),
        ...(Array.isArray(body.softSkills) ? { softSkills: body.softSkills } : {}),
        ...(Array.isArray(body.customQuestions) ? { customQuestions: body.customQuestions } : {}),
        ...(typeof body.experienceMin === "number" ? { experienceMin: body.experienceMin } : {}),
      },
    });
    return NextResponse.json({ position: { id: job.id } });
  } catch (error) {
    console.error("[PATCH /api/positions/[id]]", error);
    return NextResponse.json({ error: "Failed to update position" }, { status: 500 });
  }
}

// DELETE /api/positions/:id → soft-delete (deactivate) a position.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.job.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/positions/[id]]", error);
    return NextResponse.json({ error: "Failed to delete position" }, { status: 500 });
  }
}
