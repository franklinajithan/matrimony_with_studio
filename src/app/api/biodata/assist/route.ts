import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthUser } from "@/lib/supabase/server";

const ActionSchema = z.enum([
  "improve",
  "grammar",
  "shorter",
  "tone-warm",
  "tone-concise",
  "tone-formal",
  "translate",
]);

const BodySchema = z.object({
  action: ActionSchema,
  text: z.string().min(1).max(8000),
  targetLang: z.enum(["en", "ta", "si"]).optional(),
});

type AssistAction = z.infer<typeof ActionSchema>;

const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;
const rateMap = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const prev = rateMap.get(userId) ?? [];
  const recent = prev.filter((t) => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    rateMap.set(userId, recent);
    return false;
  }
  recent.push(now);
  rateMap.set(userId, recent);
  return true;
}

function instructionFor(action: AssistAction, targetLang?: string): string {
  switch (action) {
    case "improve":
      return "Improve clarity, flow, and polish while keeping the same meaning and facts.";
    case "grammar":
      return "Fix grammar, spelling, and punctuation only. Do not change tone or meaning.";
    case "shorter":
      return "Make the text shorter and tighter while keeping all facts and meaning.";
    case "tone-warm":
      return "Rewrite in a warm, friendly tone. Do not add new facts.";
    case "tone-concise":
      return "Rewrite in a concise, direct tone. Do not add new facts.";
    case "tone-formal":
      return "Rewrite in a formal, respectful tone suitable for matrimonial biodata. Do not add new facts.";
    case "translate":
      return `Translate the text into ${
        targetLang === "ta" ? "Tamil" : targetLang === "si" ? "Sinhala" : "English"
      }. Preserve meaning; do not invent details.`;
    default:
      return "Improve the text without inventing facts.";
  }
}

function aiUnavailable() {
  return NextResponse.json(
    { error: "AI assistance is unavailable", available: false },
    { status: 503 }
  );
}

export async function POST(request: Request) {
  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: "Too many AI requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.action === "translate" && !body.targetLang) {
    return NextResponse.json(
      { error: "targetLang is required for translate." },
      { status: 400 }
    );
  }

  const hasKey =
    Boolean(process.env.GOOGLE_GENAI_API_KEY) ||
    Boolean(process.env.GOOGLE_API_KEY) ||
    Boolean(process.env.GEMINI_API_KEY);

  if (!hasKey) {
    return aiUnavailable();
  }

  try {
    const { rewriteBiodataText } = await import("@/ai/flows/biodata-assist-flow");
    const result = await rewriteBiodataText({
      instruction: instructionFor(body.action, body.targetLang),
      text: body.text.trim(),
    });
    const proposedText = result.proposedText?.trim();
    if (!proposedText) {
      return aiUnavailable();
    }
    return NextResponse.json({ proposedText });
  } catch (error) {
    console.error("biodata assist failed:", error instanceof Error ? error.message : "unknown");
    return aiUnavailable();
  }
}
