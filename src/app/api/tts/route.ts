import { NextRequest, NextResponse } from "next/server";
import { textToSpeech } from "@/lib/openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST { text } → audio/mpeg (OpenAI TTS, "nova" voice).
// If no OPENAI_API_KEY is configured, returns 503 so the client can fall back
// to the browser's built-in speechSynthesis.
export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "TTS unavailable: OPENAI_API_KEY not set" }, { status: 503 });
    }

    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const audio = await textToSpeech(text.slice(0, 4000));

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[POST /api/tts]", error);
    return NextResponse.json({ error: "TTS generation failed" }, { status: 500 });
  }
}
