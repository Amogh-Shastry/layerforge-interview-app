import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STARTER_POSITIONS } from "@/lib/demo-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Demo reset — wipes all candidate/interview data and restores the starter
 * positions (mirrors prisma/seed.ts). Used to give each demo run a clean slate.
 *
 * DESTRUCTIVE and publicly reachable, so it is DISABLED by default and only
 * runs when DEMO_RESET_ENABLED="true" is set in the environment.
 */
export async function POST() {
  if (process.env.DEMO_RESET_ENABLED !== "true") {
    return NextResponse.json({ error: "Reset disabled" }, { status: 403 });
  }

  try {
    // FK-safe delete order. Jobs/org/HR user are kept (jobs re-upserted below).
    await prisma.suspiciousEvent.deleteMany();
    await prisma.message.deleteMany();
    await prisma.report.deleteMany();
    await prisma.evaluation.deleteMany();
    await prisma.interview.deleteMany();
    await prisma.application.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.user.deleteMany({ where: { role: "CANDIDATE" } });

    const org = await prisma.organization.upsert({
      where: { slug: "deepstation" },
      update: {},
      create: { name: "DeepStation AI", slug: "deepstation" },
    });

    await prisma.user.upsert({
      where: { email: "hr@deepstation.ai" },
      update: {},
      create: { email: "hr@deepstation.ai", name: "HR Manager", role: "HR", organizationId: org.id },
    });

    for (const p of STARTER_POSITIONS) {
      const fields = {
        title: p.title,
        description: p.description,
        companyIntro: p.companyIntro,
        requirements: p.requirements,
        expectations: p.expectations,
        requiredSkills: p.requiredSkills,
        softSkills: p.softSkills,
        customQuestions: p.customQuestions,
        experienceMin: p.experienceMin,
      };
      await prisma.job.upsert({
        where: { id: p.id },
        update: { ...fields, isActive: true },
        create: { id: p.id, organizationId: org.id, ...fields },
      });
    }

    const positions = await prisma.job.count();
    return NextResponse.json({ ok: true, positions });
  } catch (error) {
    console.error("[POST /api/admin/reset]", error);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
