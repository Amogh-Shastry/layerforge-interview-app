import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt } from "@/lib/openai";
import { getInterviewContext } from "@/lib/data";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Client-driven interview chat.
 *
 * Body: {
 *   messages: ChatMessage[]   // full conversation so far (client is source of truth)
 *   start?: boolean           // true → AI opens the interview (no user turn rendered)
 *   persist?: boolean         // best-effort write to DB (default true)
 * }
 *
 * Returns a plain text stream of the AI's reply. The job context is loaded from
 * the DB when available, otherwise from the demo dataset — so the interview runs
 * with or without a database.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI unavailable: OPENAI_API_KEY not set" },
        { status: 503 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const incoming: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
    const isStart: boolean = body.start === true || incoming.length === 0;
    const persist: boolean = body.persist !== false;

    const ctx = await getInterviewContext(id);
    const systemPrompt = buildSystemPrompt({
      jobTitle: ctx.job.title,
      companyIntro: ctx.job.companyIntro,
      requirements: ctx.job.requirements,
      expectations: ctx.job.expectations,
      requiredSkills: ctx.job.requiredSkills,
      customQuestions: ctx.job.customQuestions,
      candidateName: ctx.candidateName,
    });

    // For the opening turn, inject a synthetic instruction (not shown to the user).
    const conversation: ChatMessage[] = isStart
      ? [
          {
            role: "user",
            content:
              "The candidate has just joined the interview room. Greet them warmly by acknowledging the role, briefly explain how the session will work, and ask your first question.",
          },
        ]
      : incoming;

    // Best-effort: persist the latest candidate message before generating.
    if (persist && !isStart) {
      const last = incoming[incoming.length - 1];
      if (last?.role === "user") {
        prisma.message
          .create({ data: { interviewId: id, role: "user", content: last.content } })
          .catch(() => {});
      }
    }

    const aiClient = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const result = streamText({
      // gpt-4o-mini keeps spoken-turn latency low; evaluation still uses gpt-4o.
      model: aiClient("gpt-4o-mini"),
      system: systemPrompt,
      messages: conversation,
      temperature: 0.7,
      maxOutputTokens: 200,
      onFinish: async ({ text }) => {
        if (persist) {
          prisma.message
            .create({ data: { interviewId: id, role: "assistant", content: text } })
            .catch(() => {});
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[POST /api/interviews/[id]/chat]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
