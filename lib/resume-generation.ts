import { z } from "zod";
import { AI_MODEL, createAiClient } from "@/lib/ai";
import type { ProfileFormValues, WorkExperience } from "@/lib/profile";

// The page is A4 and there is no way to ask @react-pdf/renderer whether the content
// overflowed, so a single page is guaranteed by capping the content instead of measuring it.
export const MAX_SUMMARY_CHARACTERS = 480;
export const MAX_BULLETS_PER_ROLE = 4;
export const MAX_BULLET_CHARACTERS = 180;
export const MAX_SKILLS_SHOWN = 18;

export const GENERATION_FAILURE_MESSAGE = "Could not generate your resume right now. Please try again.";

export type ResumeRole = {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
};

export type ResumeContent = {
  fullName: string;
  headline: string;
  contactLine: string;
  links: string[];
  summary: string;
  roles: ResumeRole[];
  education: string[];
  skills: string[];
};

export type ResumeProse = {
  summary: string;
  roles: { bullets: string[] }[];
};

export type ProseResult =
  | { success: true; data: ResumeProse }
  | { success: false; error: string };

export type ReadinessResult = { ready: true } | { ready: false; error: string };

function usableRoles(profile: ProfileFormValues): WorkExperience[] {
  return profile.workExperience.filter((role) => role.company.trim() && role.title.trim());
}

/**
 * A resume needs a name and something to say. Below that bar the document would be close to
 * empty and the model would be tempted to pad it, so the user is told what to fill in instead.
 */
export function checkResumeReadiness(profile: ProfileFormValues): ReadinessResult {
  if (!profile.fullName.trim()) {
    return { ready: false, error: "Add your full name before generating a resume." };
  }
  if (usableRoles(profile).length === 0 && profile.skills.length === 0) {
    return {
      ready: false,
      error: "Add at least one work experience role, or a few skills, before generating a resume.",
    };
  }
  return { ready: true };
}

function cleanBullet(value: string): string {
  return value.replace(/^\s*[-–—•*•]\s*/, "").replace(/\s+/g, " ").trim().slice(0, MAX_BULLET_CHARACTERS);
}

const proseSchema = z.object({
  summary: z.preprocess(
    (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, MAX_SUMMARY_CHARACTERS) : ""),
    z.string(),
  ),
  roles: z.preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(z.preprocess(
      (value) => {
        const record = typeof value === "object" && value !== null && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : {};
        const bullets = Array.isArray(record.bullets) ? record.bullets : [];
        return {
          bullets: bullets
            .filter((bullet): bullet is string => typeof bullet === "string")
            .map(cleanBullet)
            .filter(Boolean)
            .slice(0, MAX_BULLETS_PER_ROLE),
        };
      },
      z.object({ bullets: z.array(z.string()) }),
    )),
  ),
});

const systemPrompt = `You are a resume writer. You rewrite a candidate's own material into polished resume prose.

Return ONLY valid JSON with exactly these keys:
{
  "summary": string,
  "roles": [{ "bullets": string[] }]
}

Rules:
- Never invent an employer, a date, a metric, a technology, a degree, or an achievement.
  Every statement must be supported by the material you are given.
- "summary" is one professional summary paragraph written in the third person without pronouns,
  at most ${MAX_SUMMARY_CHARACTERS} characters. It states seniority, domain, and strongest skills.
- "roles" has exactly one entry per role given, in the same order. Do not add, drop, or reorder roles.
- Each role has at most ${MAX_BULLETS_PER_ROLE} bullets, each at most ${MAX_BULLET_CHARACTERS} characters.
- Bullets start with a strong past-tense verb, except a role marked as current, which uses present tense.
- Bullets carry no leading dash or bullet character, and no trailing period is required.
- If a role's material is thin, write fewer bullets rather than padding it with generic filler.
- Plain text only. No markdown, no emoji.`;

function isUnsupportedParameterError(error: unknown, parameter: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 400 &&
    String((error as { message?: string }).message ?? "").toLowerCase().includes(parameter)
  );
}

export function buildProsePrompt(profile: ProfileFormValues): string {
  const roles = usableRoles(profile).map((role, index) => [
    `ROLE ${index + 1}`,
    `Company: ${role.company}`,
    `Title: ${role.title}`,
    `Period: ${role.startDate || "unknown"} to ${role.current ? "present" : role.endDate || "unknown"}`,
    `Material: ${role.responsibilities || "(none supplied)"}`,
  ].join("\n"));

  return [
    `Name: ${profile.fullName}`,
    profile.currentTitle ? `Current title: ${profile.currentTitle}` : "",
    profile.experienceLevel ? `Experience level: ${profile.experienceLevel}` : "",
    profile.yearsExperience ? `Years of experience: ${profile.yearsExperience}` : "",
    profile.industries.length > 0 ? `Industries: ${profile.industries.join(", ")}` : "",
    profile.skills.length > 0 ? `Skills: ${profile.skills.join(", ")}` : "",
    "",
    roles.length > 0 ? roles.join("\n\n") : "No work experience supplied. Return an empty roles array.",
  ].filter(Boolean).join("\n");
}

async function requestProse(profile: ProfileFormValues): Promise<string | null> {
  const client = createAiClient();
  const request = {
    model: AI_MODEL,
    response_format: { type: "json_object" } as const,
    max_completion_tokens: 4000,
    messages: [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: buildProsePrompt(profile) },
    ],
  };

  try {
    const response = await client.chat.completions.create({ ...request, temperature: 0.4 });
    return response.choices[0]?.message?.content ?? null;
  } catch (error) {
    // Some reasoning models on the gateway reject a fixed temperature. The prose is
    // acceptable without it, so retry once rather than failing the request.
    if (!isUnsupportedParameterError(error, "temperature")) throw error;
    const response = await client.chat.completions.create(request);
    return response.choices[0]?.message?.content ?? null;
  }
}

export function parseResumeProse(content: string): ProseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    console.error("[lib/resume-generation] json parse", error);
    return { success: false, error: GENERATION_FAILURE_MESSAGE };
  }

  const result = proseSchema.safeParse(parsed);
  if (!result.success) {
    console.error("[lib/resume-generation] schema validation", result.error.issues);
    return { success: false, error: GENERATION_FAILURE_MESSAGE };
  }

  return { success: true, data: result.data };
}

export async function generateResumeProse(profile: ProfileFormValues): Promise<ProseResult> {
  let content: string | null;
  try {
    content = await requestProse(profile);
  } catch (error) {
    console.error("[lib/resume-generation] model request", error);
    return { success: false, error: GENERATION_FAILURE_MESSAGE };
  }

  if (!content) {
    console.error("[lib/resume-generation] empty model response");
    return { success: false, error: GENERATION_FAILURE_MESSAGE };
  }

  return parseResumeProse(content);
}

function fallbackBullets(responsibilities: string): string[] {
  return responsibilities
    .split(/\r?\n/)
    .map(cleanBullet)
    .filter(Boolean)
    .slice(0, MAX_BULLETS_PER_ROLE);
}

function educationLines(profile: ProfileFormValues): string[] {
  const { degree, fieldOfStudy, institution, graduationYear } = profile.education;
  const qualification = [degree, fieldOfStudy && `in ${fieldOfStudy}`].filter(Boolean).join(" ");
  const place = [institution, graduationYear].filter(Boolean).join(", ");
  return [qualification, place].filter(Boolean);
}

/**
 * Merges model prose with the profile's own facts. Names, titles, dates, education and skills are
 * copied straight from the profile — the model's output only ever supplies the summary and bullets,
 * so it cannot alter a fact in a document the candidate sends to an employer.
 */
export function buildResumeContent(profile: ProfileFormValues, prose: ResumeProse): ResumeContent {
  const roles = usableRoles(profile);

  return {
    fullName: profile.fullName.trim(),
    headline: profile.currentTitle.trim(),
    contactLine: [profile.email, profile.phone, profile.location].map((part) => part.trim()).filter(Boolean).join("  •  "),
    links: [profile.linkedinUrl, profile.portfolioUrl].map((link) => link.trim()).filter(Boolean),
    summary: prose.summary,
    roles: roles.map((role, index) => {
      const bullets = prose.roles[index]?.bullets ?? [];
      return {
        company: role.company.trim(),
        title: role.title.trim(),
        startDate: role.startDate.trim(),
        endDate: role.endDate.trim(),
        current: role.current,
        bullets: bullets.length > 0 ? bullets : fallbackBullets(role.responsibilities),
      };
    }),
    education: educationLines(profile),
    skills: profile.skills.slice(0, MAX_SKILLS_SHOWN),
  };
}

export function resumeFileName(fullName: string): string {
  const slug = fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug ? `${slug}-resume.pdf` : "resume.pdf";
}
