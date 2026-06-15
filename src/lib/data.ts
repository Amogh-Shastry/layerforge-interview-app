// ─────────────────────────────────────────────────────────────────────────────
// Data-access layer — live Postgres only.
//
// Every accessor reads from the database. If the DB is unreachable the accessors
// return empty results (never fabricated data), so the UI shows honest empty
// states until HR creates positions and candidates complete interviews.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "./prisma";
import {
  initialsOf,
  statusToView,
  type CandidateView,
  type EvaluationView,
  type InterviewRow,
  type JobContextView,
  type PositionView,
  type RecommendationEnum,
  type TranscriptLine,
} from "./demo-data";

async function tryDb<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn("[data] database query failed:", (err as Error).message);
    return fallback;
  }
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function mapEvaluation(e: Record<string, unknown> | null | undefined): EvaluationView | null {
  if (!e) return null;
  const num = (k: string) => (typeof e[k] === "number" ? (e[k] as number) : 0);
  const arr = (k: string) => (Array.isArray(e[k]) ? (e[k] as string[]) : []);
  const raw = (e.rawAnalysis as Record<string, unknown>) ?? {};
  return {
    candidateBackground: typeof raw.candidateBackground === "string" ? raw.candidateBackground : "",
    technical: num("technical"),
    communication: num("communication"),
    leadership: num("leadership"),
    problemSolving: num("problemSolving"),
    teamwork: num("teamwork"),
    cultureFit: num("cultureFit"),
    confidence: num("confidence"),
    overallScore: num("overallScore"),
    recommendation: (e.recommendation as RecommendationEnum) ?? "BORDERLINE",
    summary: (e.summary as string) ?? "",
    strengths: arr("strengths"),
    improvements: arr("improvements"),
    missingSkills: arr("missingSkills"),
    riskFlags: arr("riskFlags"),
    nextRoundQuestions: Array.isArray(raw.nextRoundQuestions) ? (raw.nextRoundQuestions as string[]) : [],
    learningRoadmap: Array.isArray(raw.learningRoadmap) ? (raw.learningRoadmap as { title: string; source: string }[]) : [],
    technicalBreakdown: Array.isArray(raw.technicalBreakdown) ? (raw.technicalBreakdown as { label: string; score: number; note?: string }[]) : [],
    communicationBreakdown: Array.isArray(raw.communicationBreakdown) ? (raw.communicationBreakdown as { label: string; score: number }[]) : [],
  };
}

// Structural type for an interview with the includes we use.
type DbInterview = {
  id: string;
  status: string;
  scheduledAt: Date | null;
  completedAt: Date | null;
  durationSeconds: number | null;
  createdAt: Date;
  maxAttempts: number;
  attemptNumber: number;
  application: {
    candidate: { user: { name: string; email: string } } | null;
    job: { id: string; title: string; description: string; requiredSkills: string[]; softSkills: string[]; experienceMin: number } | null;
  } | null;
  evaluation: Record<string, unknown> | null;
  messages?: Array<{ role: string; content: string; timestamp: Date }>;
};

function mapInterviewRow(i: DbInterview): InterviewRow {
  const name = i.application?.candidate?.user?.name ?? "Candidate";
  const evalView = mapEvaluation(i.evaluation);
  return {
    id: i.id,
    candidateName: name,
    candidateEmail: i.application?.candidate?.user?.email ?? "",
    initials: initialsOf(name),
    positionId: i.application?.job?.id ?? "",
    position: i.application?.job?.title ?? "—",
    skills: i.application?.job?.requiredSkills ?? [],
    status: statusToView(i.status),
    scheduledDate: fmtDate(i.scheduledAt ?? i.createdAt),
    completedDate: fmtDate(i.completedAt),
    durationMin: i.durationSeconds ? Math.round(i.durationSeconds / 60) : 0,
    overallScore: evalView?.overallScore ?? null,
    recommendation: evalView?.recommendation ?? null,
  };
}

const interviewInclude = {
  application: { include: { candidate: { include: { user: true } }, job: true } },
  evaluation: true,
} as const;

// ─── Interviews ────────────────────────────────────────────────────────────────

export async function listInterviews(): Promise<InterviewRow[]> {
  const rows = await tryDb(
    () => prisma.interview.findMany({ include: interviewInclude, orderBy: { createdAt: "desc" } }),
    [] as unknown[]
  );
  return (rows as unknown as DbInterview[]).map(mapInterviewRow);
}

export async function getCandidate(id: string): Promise<CandidateView | null> {
  const row = await tryDb(
    () =>
      prisma.interview.findFirst({
        where: { OR: [{ id }, { application: { candidate: { id } } }] },
        include: {
          application: { include: { candidate: { include: { user: true } }, job: true } },
          evaluation: true,
          messages: { orderBy: { timestamp: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
    null
  );

  if (!row) return null;
  const i = row as unknown as DbInterview;
  const name = i.application?.candidate?.user?.name ?? "Candidate";
  const transcript: TranscriptLine[] = (i.messages ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      timestamp: new Date(m.timestamp).toLocaleTimeString("en-US", { minute: "2-digit", second: "2-digit" }),
      speaker: m.role === "assistant" ? ("Nova" as const) : ("Candidate" as const),
      text: m.content,
    }));

  return {
    id: i.application?.candidate ? id : i.id,
    interviewId: i.id,
    name,
    email: i.application?.candidate?.user?.email ?? "",
    role: i.application?.job?.title ?? "—",
    initials: initialsOf(name),
    appliedDate: fmtDate(i.createdAt),
    completedDate: fmtDate(i.completedAt),
    durationMin: i.durationSeconds ? Math.round(i.durationSeconds / 60) : 0,
    experienceYears: i.application?.job?.experienceMin ?? 0,
    status: statusToView(i.status),
    evaluation: mapEvaluation(i.evaluation),
    transcript,
  };
}

export interface InterviewContext {
  interviewId: string;
  job: JobContextView;
  attemptNumber: number;
  maxAttempts: number;
  candidateName?: string;
}

const GENERIC_JOB: JobContextView = {
  id: "generic",
  title: "General Interview",
  description: "A general professional interview.",
  companyIntro: "",
  requirements: "",
  expectations: "",
  requiredSkills: ["Problem Solving", "Communication", "Relevant Experience"],
  softSkills: ["Communication", "Collaboration"],
  customQuestions: [],
  experienceMin: 0,
  durationMin: 30,
  maxAttempts: 3,
};

export async function getInterviewContext(interviewId: string): Promise<InterviewContext> {
  const row = await tryDb(
    () =>
      prisma.interview.findUnique({
        where: { id: interviewId },
        include: { application: { include: { job: true, candidate: { include: { user: true } } } } },
      }),
    null
  );

  if (row && row.application?.job) {
    const job = row.application.job as typeof row.application.job & {
      companyIntro: string | null;
      requirements: string | null;
      expectations: string | null;
      customQuestions: string[];
    };
    return {
      interviewId: row.id,
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        companyIntro: job.companyIntro ?? "",
        requirements: job.requirements ?? "",
        expectations: job.expectations ?? "",
        requiredSkills: job.requiredSkills,
        softSkills: job.softSkills,
        customQuestions: job.customQuestions ?? [],
        experienceMin: job.experienceMin,
        durationMin: 30,
        maxAttempts: row.maxAttempts,
      },
      attemptNumber: row.attemptNumber,
      maxAttempts: row.maxAttempts,
      candidateName: row.application.candidate?.user?.name,
    };
  }

  return { interviewId, job: GENERIC_JOB, attemptNumber: 1, maxAttempts: GENERIC_JOB.maxAttempts };
}

// ─── Positions ──────────────────────────────────────────────────────────────────

type DbJob = {
  id: string;
  title: string;
  description: string;
  companyIntro: string | null;
  requirements: string | null;
  expectations: string | null;
  requiredSkills: string[];
  softSkills: string[];
  customQuestions: string[];
  experienceMin: number;
  createdAt: Date;
  applications: Array<{ interviews: Array<{ status: string; evaluation: { overallScore: number } | null }> }>;
};

export async function listPositions(): Promise<PositionView[]> {
  const rows = await tryDb(
    () =>
      prisma.job.findMany({
        where: { isActive: true },
        include: { applications: { include: { interviews: { include: { evaluation: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
    [] as unknown[]
  );

  return (rows as unknown as DbJob[]).map((j) => {
    const interviews = j.applications.flatMap((a) => a.interviews);
    const completed = interviews.filter((iv) => iv.status === "COMPLETED");
    const scores = completed.map((iv) => iv.evaluation?.overallScore).filter((s): s is number => typeof s === "number");
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return {
      id: j.id,
      title: j.title,
      description: j.description,
      companyIntro: j.companyIntro ?? "",
      requirements: j.requirements ?? "",
      expectations: j.expectations ?? "",
      requiredSkills: j.requiredSkills,
      softSkills: j.softSkills,
      customQuestions: j.customQuestions ?? [],
      experienceMin: j.experienceMin,
      createdDate: fmtDate(j.createdAt),
      interviewCount: interviews.length,
      completedCount: completed.length,
      avgScore: avg,
    };
  });
}

export async function getPosition(id: string): Promise<PositionView | null> {
  const row = await tryDb(
    () =>
      prisma.job.findUnique({
        where: { id },
        include: { applications: { include: { interviews: { include: { evaluation: true } } } } },
      }),
    null
  );
  if (!row || row.isActive === false) return null;
  const j = row as unknown as DbJob & { isActive?: boolean };
  const interviews = j.applications.flatMap((a) => a.interviews);
  const completed = interviews.filter((iv) => iv.status === "COMPLETED");
  const scores = completed.map((iv) => iv.evaluation?.overallScore).filter((s): s is number => typeof s === "number");
  return {
    id: j.id,
    title: j.title,
    description: j.description,
    companyIntro: j.companyIntro ?? "",
    requirements: j.requirements ?? "",
    expectations: j.expectations ?? "",
    requiredSkills: j.requiredSkills,
    softSkills: j.softSkills,
    customQuestions: j.customQuestions ?? [],
    experienceMin: j.experienceMin,
    createdDate: fmtDate(j.createdAt),
    interviewCount: interviews.length,
    completedCount: completed.length,
    avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
  };
}

// ─── Metrics ────────────────────────────────────────────────────────────────────

export interface OverviewMetrics {
  positions: number;
  totalInterviews: number;
  scheduled: number;
  live: number;
  completed: number;
  strongHire: number;
  avgScore: number | null;
  byRecommendation: { strongHire: number; hire: number; borderline: number; noHire: number };
}

export async function getMetrics(): Promise<OverviewMetrics> {
  const [interviews, positions] = await Promise.all([listInterviews(), listPositions()]);
  const completed = interviews.filter((i) => i.status === "Completed");
  const scores = completed.map((i) => i.overallScore).filter((s): s is number => typeof s === "number");
  const byRec = { strongHire: 0, hire: 0, borderline: 0, noHire: 0 };
  for (const i of interviews) {
    if (i.recommendation === "STRONG_HIRE") byRec.strongHire++;
    else if (i.recommendation === "HIRE") byRec.hire++;
    else if (i.recommendation === "NO_HIRE") byRec.noHire++;
    else if (i.recommendation === "BORDERLINE") byRec.borderline++;
  }
  return {
    positions: positions.length,
    totalInterviews: interviews.length,
    scheduled: interviews.filter((i) => i.status === "Scheduled").length,
    live: interviews.filter((i) => i.status === "Live").length,
    completed: completed.length,
    strongHire: byRec.strongHire,
    avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    byRecommendation: byRec,
  };
}
