import { z } from "zod";
import { AI_MODEL, createAiClient } from "@/lib/ai";
import type { AdzunaJob } from "@/lib/adzuna";
import type { ProfileFormValues } from "@/lib/profile";
import type { MatchResult } from "@/agent/types";

const MAX_SKILLS = 12;
const MAX_REASON_CHARACTERS = 600;
const MAX_DESCRIPTION_CHARACTERS = 4000;

export const MATCH_FAILURE_MESSAGE = "Could not score this job against your profile.";

function tagList() {
  return z.preprocess((value) => {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const tags: string[] = [];
    for (const item of value) {
      if (typeof item !== "string") continue;
      const tag = item.trim().slice(0, 50);
      const key = tag.toLowerCase();
      if (!tag || seen.has(key)) continue;
      seen.add(key);
      tags.push(tag);
      if (tags.length === MAX_SKILLS) break;
    }
    return tags;
  }, z.array(z.string()));
}

// The database constrains match_score to 0-100, so the score is clamped here rather than
// left to fail the insert.
const matchSchema = z.object({
  matchScore: z.preprocess((value) => {
    const score = typeof value === "number" ? value : Number(String(value ?? "").trim());
    if (!Number.isFinite(score)) return null;
    return Math.max(0, Math.min(100, Math.round(score)));
  }, z.number().int().min(0).max(100)),
  matchReason: z.preprocess(
    (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, MAX_REASON_CHARACTERS) : ""),
    z.string(),
  ),
  matchedSkills: tagList(),
  missingSkills: tagList(),
});

const systemPrompt = `You score how well a candidate matches a specific job posting.

Return ONLY valid JSON with exactly these keys:
{
  "matchScore": number,
  "matchReason": string,
  "matchedSkills": string[],
  "missingSkills": string[]
}

Rules:
- matchScore is an integer from 0 to 100. Weigh required skills, seniority, and domain fit.
  Be honest and use the full range: a weak fit scores below 40, a strong fit scores above 80.
- matchReason is one paragraph, at most ${MAX_REASON_CHARACTERS} characters, addressed to the candidate.
  Say plainly why the score is what it is, naming specifics from both the posting and the profile.
- matchedSkills are skills the candidate already has that this posting asks for.
- missingSkills are skills the posting asks for that the candidate's profile does not show.
- Use only the posting and the profile given. Never invent a requirement the posting does not state,
  and never credit the candidate with a skill their profile does not list.
- Both skill lists hold at most ${MAX_SKILLS} entries. Use [] when there are none.
- Plain text only. No markdown.`;

export function buildMatchPrompt(profile: ProfileFormValues, job: AdzunaJob): string {
  const roles = profile.workExperience
    .filter((role) => role.company.trim() && role.title.trim())
    .map((role) => `- ${role.title} at ${role.company}${role.responsibilities ? `: ${role.responsibilities}` : ""}`);

  return [
    "CANDIDATE PROFILE",
    profile.currentTitle ? `Current title: ${profile.currentTitle}` : "",
    profile.experienceLevel ? `Experience level: ${profile.experienceLevel}` : "",
    profile.yearsExperience ? `Years of experience: ${profile.yearsExperience}` : "",
    profile.skills.length > 0 ? `Skills: ${profile.skills.join(", ")}` : "Skills: none listed",
    profile.industries.length > 0 ? `Industries: ${profile.industries.join(", ")}` : "",
    roles.length > 0 ? `Work history:\n${roles.join("\n")}` : "",
    "",
    "JOB POSTING",
    `Title: ${job.title}`,
    `Company: ${job.company?.display_name ?? "Unknown"}`,
    `Location: ${job.location?.display_name ?? "Unknown"}`,
    `Description: ${(job.description ?? "").slice(0, MAX_DESCRIPTION_CHARACTERS)}`,
  ].filter(Boolean).join("\n");
}

function isUnsupportedParameterError(error: unknown, parameter: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 400 &&
    String((error as { message?: string }).message ?? "").toLowerCase().includes(parameter)
  );
}

async function requestMatch(prompt: string): Promise<string | null> {
  const client = createAiClient();
  const request = {
    model: AI_MODEL,
    response_format: { type: "json_object" } as const,
    max_completion_tokens: 4000,
    messages: [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: prompt },
    ],
  };

  try {
    const response = await client.chat.completions.create({ ...request, temperature: 0.3 });
    return response.choices[0]?.message?.content ?? null;
  } catch (error) {
    if (!isUnsupportedParameterError(error, "temperature")) throw error;
    const response = await client.chat.completions.create(request);
    return response.choices[0]?.message?.content ?? null;
  }
}

export function parseMatch(content: string): MatchResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    console.error("[agent/matcher] json parse", error);
    return { success: false, error: MATCH_FAILURE_MESSAGE };
  }

  const result = matchSchema.safeParse(parsed);
  if (!result.success) {
    console.error("[agent/matcher] schema validation", result.error.issues);
    return { success: false, error: MATCH_FAILURE_MESSAGE };
  }

  return { success: true, data: result.data };
}

export async function scoreJob(profile: ProfileFormValues, job: AdzunaJob): Promise<MatchResult> {
  let content: string | null;
  try {
    content = await requestMatch(buildMatchPrompt(profile, job));
  } catch (error) {
    console.error("[agent/matcher] model request", error);
    return { success: false, error: MATCH_FAILURE_MESSAGE };
  }

  if (!content) {
    console.error("[agent/matcher] empty model response");
    return { success: false, error: MATCH_FAILURE_MESSAGE };
  }

  return parseMatch(content);
}
