// ─────────────────────────────────────────────────────────────────────────────
// Shared view types + helpers for the HR/candidate UI.
//
// All live data comes from Postgres via src/lib/data.ts. This module only holds
// the TypeScript "view shapes" the pages render, small pure helpers, and the
// starter positions used to bootstrap a fresh database. There is no fake
// candidate data — the app reflects exactly what HR creates and what candidates
// complete.
// ─────────────────────────────────────────────────────────────────────────────

export type RecommendationEnum = "STRONG_HIRE" | "HIRE" | "BORDERLINE" | "NO_HIRE";
export type RecommendationSlug = "strong-hire" | "hire" | "borderline" | "no-hire";
export type InterviewStatusView = "Scheduled" | "Live" | "Completed" | "Cancelled" | "Failed";

export interface ScoredNote {
  label: string;
  score: number;
  note?: string;
}
export interface TranscriptLine {
  timestamp: string;
  speaker: "Nova" | "Candidate";
  text: string;
}
export interface RoadmapItem {
  title: string;
  source: string;
}

export interface EvaluationView {
  candidateBackground: string;
  technical: number;
  communication: number;
  leadership: number;
  problemSolving: number;
  teamwork: number;
  cultureFit: number;
  confidence: number;
  overallScore: number;
  recommendation: RecommendationEnum;
  summary: string;
  strengths: string[];
  improvements: string[];
  missingSkills: string[];
  riskFlags: string[];
  nextRoundQuestions: string[];
  learningRoadmap: RoadmapItem[];
  technicalBreakdown: ScoredNote[];
  communicationBreakdown: ScoredNote[];
}

/** A scheduled/completed interview row (the primary entity HR works with). */
export interface InterviewRow {
  id: string;
  candidateName: string;
  candidateEmail: string;
  initials: string;
  positionId: string;
  position: string;
  skills: string[];
  status: InterviewStatusView;
  scheduledDate: string;
  completedDate: string;
  durationMin: number;
  overallScore: number | null;
  recommendation: RecommendationEnum | null;
}

/** Full candidate report view (interview + evaluation + transcript). */
export interface CandidateView {
  id: string;
  interviewId: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  appliedDate: string;
  completedDate: string;
  durationMin: number;
  experienceYears: number;
  status: InterviewStatusView;
  evaluation: EvaluationView | null;
  transcript: TranscriptLine[];
}

/** A job position HR creates; its skills + questions drive what Nova asks. */
export interface PositionView {
  id: string;
  title: string;
  description: string;
  companyIntro: string;
  requirements: string;
  expectations: string;
  requiredSkills: string[];
  softSkills: string[];
  customQuestions: string[];
  experienceMin: number;
  createdDate: string;
  interviewCount: number;
  completedCount: number;
  avgScore: number | null;
}

export interface JobContextView {
  id: string;
  title: string;
  description: string;
  companyIntro: string;
  requirements: string;
  expectations: string;
  requiredSkills: string[];
  softSkills: string[];
  customQuestions: string[];
  experienceMin: number;
  durationMin: number;
  maxAttempts: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function recommendationToSlug(rec: RecommendationEnum | null | undefined): RecommendationSlug {
  switch (rec) {
    case "STRONG_HIRE":
      return "strong-hire";
    case "HIRE":
      return "hire";
    case "NO_HIRE":
      return "no-hire";
    default:
      return "borderline";
  }
}

export function initialsOf(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function statusToView(status: string): InterviewStatusView {
  switch (status) {
    case "IN_PROGRESS":
      return "Live";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "FAILED":
      return "Failed";
    default:
      return "Scheduled";
  }
}

// ─── Starter positions (bootstrap only; HR can add/edit/delete) ────────────────

export interface StarterPosition {
  id: string;
  title: string;
  description: string;
  companyIntro: string;
  requirements: string;
  expectations: string;
  requiredSkills: string[];
  softSkills: string[];
  customQuestions: string[];
  experienceMin: number;
}

const DEEPSTATION_INTRO =
  "DeepStation is a global AI community and product studio with 4,000+ members, and an OpenAI Academy launch partner. We build practical AI tools used by a worldwide audience.";

export const STARTER_POSITIONS: StarterPosition[] = [
  {
    id: "pos-senior-python",
    title: "Senior Python Developer",
    description:
      "Backend role focused on high-concurrency services, data modeling, and architectural decision-making.",
    companyIntro: DEEPSTATION_INTRO,
    requirements:
      "Strong Python and FastAPI, solid PostgreSQL/data modeling, and hands-on experience designing scalable async backend services.",
    expectations:
      "Own backend services end-to-end, make sound architectural trade-offs, and mentor others while shipping reliable, well-tested code.",
    requiredSkills: ["Python", "FastAPI", "PostgreSQL", "System Design", "Async Programming"],
    softSkills: ["Communication", "Ownership", "Collaboration"],
    customQuestions: [
      "Walk me through a high-concurrency system you built and the hardest scaling problem you hit.",
      "How do you decide between adding a cache, an index, or restructuring a query when something is slow?",
    ],
    experienceMin: 4,
  },
  {
    id: "pos-frontend",
    title: "Senior Frontend Engineer",
    description: "Frontend role covering React performance, state architecture, and design-system thinking.",
    companyIntro: DEEPSTATION_INTRO,
    requirements:
      "Deep React + TypeScript expertise, a strong grasp of rendering/performance, accessibility, and scalable CSS/design-system architecture.",
    expectations:
      "Deliver fast, accessible interfaces, set frontend standards, and partner closely with design and product.",
    requiredSkills: ["React", "TypeScript", "Web Performance", "Accessibility", "CSS Architecture"],
    softSkills: ["Collaboration", "Mentorship", "Communication"],
    customQuestions: [
      "Tell me about a time you diagnosed and fixed a serious frontend performance problem.",
      "How do you approach building an accessible, reusable component library?",
    ],
    experienceMin: 5,
  },
  {
    id: "pos-devops",
    title: "DevOps Engineer",
    description: "Infrastructure role spanning CI/CD, Kubernetes, observability, and reliability engineering.",
    companyIntro: DEEPSTATION_INTRO,
    requirements:
      "Production Kubernetes and Terraform experience, strong CI/CD pipelines, and observability/reliability practices across cloud (AWS/GCP).",
    expectations:
      "Keep systems reliable and deployable, drive incident response and SLOs, and automate toil away.",
    requiredSkills: ["Kubernetes", "Terraform", "CI/CD", "Observability", "Cloud (AWS/GCP)"],
    softSkills: ["Incident Response", "Communication", "Pragmatism"],
    customQuestions: [
      "Design a zero-downtime deployment strategy for a stateful service.",
      "Describe a production incident you led — how you detected, diagnosed, and resolved it.",
    ],
    experienceMin: 4,
  },
];
