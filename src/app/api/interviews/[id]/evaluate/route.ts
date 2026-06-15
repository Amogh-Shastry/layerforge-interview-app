import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateInterview } from "@/lib/openai";
import { getInterviewContext } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface TranscriptMsg {
  role: string;
  content: string;
}

/**
 * Evaluate an interview transcript.
 *
 * Body: { transcript?: {role, content}[] }
 *   - If a transcript is supplied (the live client holds it), it is used directly.
 *   - Otherwise messages are loaded from the DB.
 *
 * Returns the full evaluation result. Persistence (Evaluation + Report + status)
 * is best-effort so the flow completes even without a database.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Evaluation unavailable: OPENAI_API_KEY not set" },
        { status: 503 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    let transcript: TranscriptMsg[] = Array.isArray(body.transcript) ? body.transcript : [];

    // If no transcript supplied, try the database.
    if (transcript.length === 0) {
      try {
        const interview = await prisma.interview.findUnique({
          where: { id },
          include: { messages: { orderBy: { timestamp: "asc" } } },
        });
        transcript = (interview?.messages ?? []).map((m) => ({ role: m.role, content: m.content }));
      } catch {
        /* DB unavailable — fall through */
      }
    }

    if (transcript.length < 2) {
      return NextResponse.json(
        { error: "Not enough conversation to evaluate" },
        { status: 400 }
      );
    }

    const ctx = await getInterviewContext(id);
    const result = await evaluateInterview(transcript, ctx.job.title, ctx.job.requiredSkills);

    // Best-effort persistence — never blocks the response.
    void persistEvaluation(id, result);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("[POST /api/interviews/[id]/evaluate]", error);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}

async function persistEvaluation(id: string, result: Awaited<ReturnType<typeof evaluateInterview>>) {
  try {
    const data = {
      technical: result.technical,
      communication: result.communication,
      leadership: result.leadership,
      problemSolving: result.problemSolving,
      teamwork: result.teamwork,
      cultureFit: result.cultureFit,
      confidence: result.confidence,
      overallScore: result.overallScore,
      recommendation: result.recommendation,
      summary: result.summary,
      strengths: result.strengths,
      improvements: result.improvements,
      missingSkills: result.missingSkills,
      riskFlags: result.riskFlags,
      rawAnalysis: result as unknown as object,
    };

    await prisma.evaluation.upsert({
      where: { interviewId: id },
      create: { interviewId: id, ...data },
      update: data,
    });

    await prisma.interview.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    await prisma.report.upsert({
      where: { interviewId: id },
      create: {
        interviewId: id,
        nextRoundQuestions: result.nextRoundQuestions,
        learningRoadmap: result.learningRoadmap as unknown as object,
      },
      update: {
        nextRoundQuestions: result.nextRoundQuestions,
        learningRoadmap: result.learningRoadmap as unknown as object,
      },
    });
  } catch (err) {
    console.warn("[evaluate] persistence skipped (DB unavailable):", (err as Error).message);
  }
}
