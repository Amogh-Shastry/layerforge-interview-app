# AIEval Pro — AI Interview Automation Platform

A production-grade AI interview platform built for DeepStation. Candidates take a
fully voice-driven interview with **Nova**, an AI interviewer powered by GPT-4o,
and HR reviews scored, evidence-backed reports.

## What works

**Candidate flow** (`/interview/demo`):
Landing → Screen-share check → Device setup → Ready → **Live voice room** →
Processing → Complete → Personalized report.

- **Real two-way voice.** Nova speaks each question aloud (OpenAI TTS, "nova" voice)
  and listens to spoken answers (Chrome's Web Speech API), with automatic
  turn-taking on natural pauses. A "Done Answering" button gives manual control.
- **Adaptive questioning.** GPT-4o drives the conversation, probing based on prior
  answers — the full transcript is the model's context each turn.
- **Real evaluation.** On completion the transcript is scored across seven
  dimensions and turned into strengths, gaps, risk flags, a learning roadmap, and
  a hire recommendation.

**HR dashboard** (`/dashboard`):
Live candidate roster with scores, AI recommendations, and search. Click any
candidate for the full report — competency scores, technical/communication
breakdowns, transcript, risk flags, and suggested next-round questions.

## Graceful degradation

The app is built to run in any environment:

| Capability         | With config                  | Without config (fallback)                     |
| ------------------ | ---------------------------- | --------------------------------------------- |
| AI questions       | GPT-4o (`OPENAI_API_KEY`)    | Scripted question bank                        |
| Nova's voice       | OpenAI TTS                   | Browser `speechSynthesis`                     |
| Listening          | Web Speech API (Chrome/Edge) | Type-to-answer input                          |
| Data / persistence | Postgres (`DATABASE_URL`)    | Curated in-memory demo dataset (8 candidates) |

The UI is always fully populated and the interview always runs — a missing
database or API key degrades gracefully instead of breaking.

## Setup

```bash
npm install
# .env already contains working DATABASE_URL + OPENAI_API_KEY
npm run dev                 # http://localhost:3000
```

### Environment variables

- `OPENAI_API_KEY` — **required for real voice/AI.** Without it the app uses the
  scripted + browser-speech fallback.
- `DATABASE_URL` — Postgres connection string. Without it, the demo dataset is
  served and live interviews run but aren't persisted.

### Enabling database persistence

With a real `DATABASE_URL` set, create the schema and seed it:

```bash
npm run db:generate     # generate Prisma client
npm run db:push         # create tables (or: npm run db:migrate)
npm run db:seed         # load the candidate dataset
```

Once seeded, the dashboard and reports read live rows, and completed interviews
persist (messages, evaluation, report).

## Tech

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma + Postgres (pg
adapter) · OpenAI (GPT-4o, Whisper, TTS) · Web Speech API.

## Browser support

Best in **Chrome or Edge** (Web Speech API for live transcription). Other browsers
automatically fall back to a type-to-answer input. Use headphones to prevent
Nova's voice from being picked up by the microphone.
