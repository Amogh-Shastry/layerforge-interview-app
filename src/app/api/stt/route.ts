import { NextRequest, NextResponse } from "next/server";
import { speechToText } from "@/lib/openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST multipart/form-data { audio: Blob } → { text }
// Server-side transcription via Whisper. This is the fallback path for browsers
// without the native Web Speech API; Chrome uses on-device recognition directly.
export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "STT unavailable: OPENAI_API_KEY not set" }, { status: 503 });
    }

    const form = await req.formData();
    const file = form.get("audio");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "audio file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = (file as File).name || "audio.webm";
    const text = await speechToText(buffer, filename);

    return NextResponse.json({ text });
  } catch (error) {
    console.error("[POST /api/stt]", error);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
