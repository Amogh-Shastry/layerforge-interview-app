import OpenAI from "openai";

let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// Keep named export for backward compat — resolved lazily via getter
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ─── Interview system prompt ──────────────────────────────────────────────────

export interface InterviewPromptContext {
  jobTitle: string;
  companyIntro?: string;
  requirements?: string;
  expectations?: string;
  requiredSkills: string[];
  customQuestions?: string[];
  candidateName?: string;
}

export function buildSystemPrompt(ctx: InterviewPromptContext): string {
  const { jobTitle, companyIntro, requirements, expectations, requiredSkills, customQuestions, candidateName } = ctx;
  const who = candidateName ? `The candidate's name is ${candidateName}; greet them by name.` : "Ask the candidate's name if it comes up naturally.";

  const companyBlock = companyIntro
    ? `ABOUT THE COMPANY (give the candidate a one–two sentence version in your intro):\n${companyIntro}`
    : "";
  const reqBlock = requirements ? `ROLE REQUIREMENTS (brief the candidate on these in step 3):\n${requirements}` : "";
  const expBlock = expectations ? `EXPECTATIONS / WHAT SUCCESS LOOKS LIKE (brief the candidate in step 3):\n${expectations}` : "";
  const skillsBlock = `SKILLS TO ASSESS (cover each at least once during step 4):\n${requiredSkills.map((s) => `- ${s}`).join("\n")}`;
  const questionsBlock =
    customQuestions && customQuestions.length
      ? `HR-PROVIDED QUESTIONS (you MUST ask each of these during step 4, rephrasing naturally and adding follow-ups):\n${customQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      : "";

  return `You are Nova, a warm, professional AI voice interviewer for the ${jobTitle} role. ${who}

This is a SPOKEN conversation — your replies are read aloud, so keep each turn short and natural (1–3 sentences). Ask exactly ONE thing per turn. No markdown, lists, or code blocks.

${companyBlock}

${reqBlock}

${expBlock}

${skillsBlock}

${questionsBlock}

RUN THE INTERVIEW IN THIS ORDER — do not skip steps:
1. WELCOME: Warmly greet the candidate, introduce yourself as Nova, and say one or two sentences about the company and the role.
2. CANDIDATE INTAKE: Ask the candidate to briefly introduce themselves — their current role, years of experience, and the background most relevant to this position. Ask one or two short follow-ups so you understand their context. (This is information-gathering, not evaluation yet.)
3. ROLE BRIEFING: In a sentence or two, tell them what this role requires and what success looks like, drawing on the requirements and expectations above. Then ask if they're ready to begin.
4. INTERVIEW: Now conduct the interview. Work through the HR-provided questions AND probe the skills to assess — one question per turn. Build on each answer, and ask deeper follow-ups when an answer is vague or shallow. Adapt difficulty to how they're doing.
5. CLOSE: When you've covered the questions and skills, thank them by name and tell them the interview is complete and their report will be shared with the hiring team.

Stay encouraging and concise. Never reveal scores, assessments, or that you are scoring. Track these dimensions internally only: technical skill, communication, problem solving, leadership, confidence, teamwork, culture fit.`;
}

// ─── AI evaluation ────────────────────────────────────────────────────────────

export interface EvaluationResult {
  candidateBackground: string;
  technical: number;
  communication: number;
  leadership: number;
  problemSolving: number;
  teamwork: number;
  cultureFit: number;
  confidence: number;
  overallScore: number;
  recommendation: "STRONG_HIRE" | "HIRE" | "BORDERLINE" | "NO_HIRE";
  summary: string;
  strengths: string[];
  improvements: string[];
  missingSkills: string[];
  riskFlags: string[];
  nextRoundQuestions: string[];
  learningRoadmap: { title: string; source: string }[];
}

export async function evaluateInterview(
  transcript: { role: string; content: string }[],
  jobTitle: string,
  requiredSkills: string[]
): Promise<EvaluationResult> {
  const evaluationPrompt = `You are an expert technical recruiter. Analyze the following interview transcript for a ${jobTitle} role.

Required skills: ${requiredSkills.join(", ")}

Transcript:
${transcript.map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`).join("\n\n")}

The interview begins with the candidate introducing themselves; use that to fill candidateBackground.

Provide a detailed evaluation in JSON format with these exact fields:
{
  "candidateBackground": "<1-2 sentence profile from their intro: current role, years of experience, relevant background>",
  "technical": <0-100>,
  "communication": <0-100>,
  "leadership": <0-100>,
  "problemSolving": <0-100>,
  "teamwork": <0-100>,
  "cultureFit": <0-100>,
  "confidence": <0-100>,
  "overallScore": <0-100>,
  "recommendation": "STRONG_HIRE" | "HIRE" | "BORDERLINE" | "NO_HIRE",
  "summary": "<2-3 sentence executive summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<area 1>", "<area 2>", "<area 3>"],
  "missingSkills": ["<skill 1>", "<skill 2>"],
  "riskFlags": ["<risk 1>"],
  "nextRoundQuestions": ["<question 1>", "<question 2>", "<question 3>"],
  "learningRoadmap": [
    {"title": "<resource title>", "source": "<platform/author>"}
  ]
}

Return ONLY valid JSON, no markdown.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: evaluationPrompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content ?? "{}") as EvaluationResult;
}

// ─── TTS ──────────────────────────────────────────────────────────────────────

export async function textToSpeech(text: string): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input: text,
    response_format: "mp3",
  });
  return Buffer.from(await response.arrayBuffer());
}

// ─── STT ──────────────────────────────────────────────────────────────────────

export async function speechToText(audioBuffer: Buffer, filename: string): Promise<string> {
  const uint8 = new Uint8Array(audioBuffer);
  const file = new File([uint8], filename, { type: "audio/webm" });
  const response = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "en",
  });
  return response.text;
}
