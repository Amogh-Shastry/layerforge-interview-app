import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { STARTER_POSITIONS } from "../src/lib/demo-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Resetting database…");

  // Wipe all interview/candidate data (FK-safe order). Positions are recreated.
  await prisma.suspiciousEvent.deleteMany();
  await prisma.message.deleteMany();
  await prisma.report.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.application.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.job.deleteMany();
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
  const candidates = await prisma.candidate.count();
  console.log(`Reset complete. ${positions} positions, ${candidates} candidates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
