import { z } from "zod";
import { AI_MODEL, createAiClient } from "@/lib/ai";
import type { Education, ProfileFormValues, WorkExperience } from "@/lib/profile";
import { parseMonthYear } from "@/lib/profile-validation";

export const MINIMUM_RESUME_TEXT_LENGTH = 200;
export const UNREADABLE_PDF_MESSAGE = "Could not extract text from this PDF. Please try a different file.";

const MAX_SKILLS = 30;
const MAX_ROLES = 3;

export type ExtractedRole = Omit<WorkExperience, "id">;

export type ExtractedProfile = {
  fullName: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  workAuthorization: string;
  currentTitle: string;
  experienceLevel: string;
  yearsExperience: string;
  skills: string[];
  industries: string[];
  workExperience: ExtractedRole[];
  education: Education;
};

export type ExtractionResult =
  | { success: true; data: ExtractedProfile }
  | { success: false; error: string };

function text(maximumLength: number) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim().slice(0, maximumLength) : ""),
    z.string(),
  );
}

function textList(maximumLength: number, maximumItems: number) {
  return z.preprocess((value) => {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const items: string[] = [];
    for (const item of value) {
      if (typeof item !== "string") continue;
      const tag = item.trim().slice(0, maximumLength);
      const key = tag.toLowerCase();
      if (!tag || seen.has(key)) continue;
      seen.add(key);
      items.push(tag);
      if (items.length === maximumItems) break;
    }
    return items;
  }, z.array(z.string()));
}

function enumOrEmpty(allowed: readonly string[]) {
  return z.preprocess((value) => {
    if (typeof value !== "string") return "";
    const match = allowed.find((option) => option.toLowerCase() === value.trim().toLowerCase());
    return match ?? "";
  }, z.string());
}

// The form only accepts MM/YY dates that are not in the future, so anything else is dropped
// rather than surfaced as a validation error the user did not cause.
const monthYear = z.preprocess((value) => {
  if (typeof value !== "string") return "";
  const candidate = value.trim();
  return parseMonthYear(candidate) === null ? "" : candidate;
}, z.string());

const wholeNumberText = z.preprocess((value) => {
  const candidate = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  const digits = /^\d+$/.exec(candidate);
  if (!digits) return "";
  const years = Number(candidate);
  return years > 0 && years <= 99 ? String(years) : "";
}, z.string());

const extractedProfileSchema = z.object({
  fullName: text(100),
  phone: text(25),
  location: text(120),
  linkedinUrl: text(2048),
  portfolioUrl: text(2048),
  workAuthorization: enumOrEmpty(["citizen", "permanent_resident", "visa_required"]),
  currentTitle: text(120),
  experienceLevel: enumOrEmpty(["Junior", "Mid-level", "Senior", "Lead"]),
  yearsExperience: wholeNumberText,
  skills: textList(50, MAX_SKILLS),
  industries: textList(50, MAX_SKILLS),
  workExperience: z.preprocess(
    (value) => (Array.isArray(value) ? value.slice(0, MAX_ROLES) : []),
    z.array(z.object({
      company: text(120),
      title: text(120),
      startDate: monthYear,
      endDate: monthYear,
      current: z.preprocess((value) => value === true, z.boolean()),
      responsibilities: text(2000),
    })),
  ),
  education: z.preprocess(
    (value) => (typeof value === "object" && value !== null && !Array.isArray(value) ? value : {}),
    z.object({
      degree: enumOrEmpty(["High School", "Associate Degree", "Bachelor's Degree", "Master's Degree", "Doctorate"]),
      fieldOfStudy: text(120),
      institution: text(160),
      graduationYear: z.preprocess((value) => {
        const candidate = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
        return /^(19|20)\d{2}$/.test(candidate) && Number(candidate) <= new Date().getFullYear() ? candidate : "";
      }, z.string()),
    }),
  ),
});

const systemPrompt = `You extract structured profile data from a candidate's resume text.

Return ONLY valid JSON with exactly these keys:
{
  "fullName": string,
  "phone": string,
  "location": string,
  "linkedinUrl": string,
  "portfolioUrl": string,
  "workAuthorization": "" | "citizen" | "permanent_resident" | "visa_required",
  "currentTitle": string,
  "experienceLevel": "" | "Junior" | "Mid-level" | "Senior" | "Lead",
  "yearsExperience": string,
  "skills": string[],
  "industries": string[],
  "workExperience": [{ "company": string, "title": string, "startDate": string, "endDate": string, "current": boolean, "responsibilities": string }],
  "education": { "degree": "" | "High School" | "Associate Degree" | "Bachelor's Degree" | "Master's Degree" | "Doctorate", "fieldOfStudy": string, "institution": string, "graduationYear": string }
}

Rules:
- Use only what the resume states. Never invent a value. Use "" for missing text, [] for missing lists.
- location is "City, Country". linkedinUrl and portfolioUrl must be full https:// URLs or "".
- workAuthorization is set only when the resume states it explicitly.
- currentTitle is the most recent job title. yearsExperience is a whole number of total professional years.
- experienceLevel is inferred from seniority in titles and total years.
- skills are concrete technologies, languages, tools, and frameworks. No soft skills.
- industries are business domains the candidate worked in, such as FinTech or Healthcare.
- workExperience holds at most the 3 most recent roles, newest first. startDate and endDate use MM/YY format.
  Set current to true and endDate to "" for a present role.
- responsibilities is a short plain-text summary of that role's bullet points.
- education is the highest degree only. graduationYear is a four-digit year.`;

function isUnsupportedParameterError(error: unknown, parameter: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 400 &&
    String((error as { message?: string }).message ?? "").toLowerCase().includes(parameter)
  );
}

async function requestExtraction(resumeText: string): Promise<string | null> {
  const client = createAiClient();
  const request = {
    model: AI_MODEL,
    response_format: { type: "json_object" } as const,
    max_completion_tokens: 4000,
    messages: [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: `RESUME TEXT:\n${resumeText}` },
    ],
  };

  try {
    const response = await client.chat.completions.create({ ...request, temperature: 0.3 });
    return response.choices[0]?.message?.content ?? null;
  } catch (error) {
    // Reasoning models on the Zen gateway reject a fixed temperature; the extraction is
    // deterministic enough without it, so retry once rather than failing the request.
    if (!isUnsupportedParameterError(error, "temperature")) throw error;
    const response = await client.chat.completions.create(request);
    return response.choices[0]?.message?.content ?? null;
  }
}

const MODEL_FAILURE_MESSAGE = "Could not read your resume right now. Please try again.";

export function parseExtractedProfile(content: string): ExtractionResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    console.error("[lib/resume-extraction] json parse", error);
    return { success: false, error: MODEL_FAILURE_MESSAGE };
  }

  const result = extractedProfileSchema.safeParse(parsed);
  if (!result.success) {
    console.error("[lib/resume-extraction] schema validation", result.error.issues);
    return { success: false, error: MODEL_FAILURE_MESSAGE };
  }

  return { success: true, data: result.data };
}

export async function extractProfileFromResumeText(resumeText: string): Promise<ExtractionResult> {
  if (resumeText.trim().length < MINIMUM_RESUME_TEXT_LENGTH) {
    return { success: false, error: UNREADABLE_PDF_MESSAGE };
  }

  let content: string | null;
  try {
    content = await requestExtraction(resumeText.trim());
  } catch (error) {
    console.error("[lib/resume-extraction] model request", error);
    return { success: false, error: MODEL_FAILURE_MESSAGE };
  }

  if (!content) {
    console.error("[lib/resume-extraction] empty model response");
    return { success: false, error: MODEL_FAILURE_MESSAGE };
  }

  return parseExtractedProfile(content);
}

function fill(current: string, extracted: string, filled: string[], label: string): string {
  if (current.trim() || !extracted) return current;
  filled.push(label);
  return extracted;
}

function mergeEducation(current: Education, extracted: Education, filled: string[]): Education {
  return {
    degree: fill(current.degree, extracted.degree, filled, "Highest Degree"),
    fieldOfStudy: fill(current.fieldOfStudy, extracted.fieldOfStudy, filled, "Field of Study"),
    institution: fill(current.institution, extracted.institution, filled, "Institution Name"),
    graduationYear: fill(current.graduationYear, extracted.graduationYear, filled, "Graduation Year"),
  };
}

function mergeRoles(
  current: WorkExperience[],
  extracted: ExtractedRole[],
  filled: string[],
  createId: () => string,
): WorkExperience[] {
  const roleKey = (role: { company: string; title: string }) => `${role.company.trim().toLowerCase()}|${role.title.trim().toLowerCase()}`;
  const existingKeys = new Set(current.map(roleKey));
  const merged = [...current];

  for (const role of extracted) {
    if (merged.length >= MAX_ROLES) break;
    if (!role.company && !role.title) continue;
    if (existingKeys.has(roleKey(role))) continue;
    existingKeys.add(roleKey(role));
    merged.push({ ...role, id: createId() });
    filled.push("Work Experience");
  }

  return merged;
}

function mergeTags(current: string[], extracted: string[], filled: string[], label: string): string[] {
  const existing = new Set(current.map((tag) => tag.toLowerCase()));
  const additions = extracted.filter((tag) => !existing.has(tag.toLowerCase()));
  if (additions.length === 0) return current;
  filled.push(label);
  return [...current, ...additions].slice(0, MAX_SKILLS);
}

export function mergeExtractedIntoProfile(
  current: ProfileFormValues,
  extracted: ExtractedProfile,
  createId: () => string,
): { values: ProfileFormValues; filledFields: string[] } {
  const filled: string[] = [];
  const values: ProfileFormValues = {
    ...current,
    fullName: fill(current.fullName, extracted.fullName, filled, "Full Name"),
    phone: fill(current.phone, extracted.phone, filled, "Phone Number"),
    location: fill(current.location, extracted.location, filled, "Location"),
    linkedinUrl: fill(current.linkedinUrl, extracted.linkedinUrl, filled, "LinkedIn URL"),
    portfolioUrl: fill(current.portfolioUrl, extracted.portfolioUrl, filled, "Portfolio / GitHub"),
    workAuthorization: fill(current.workAuthorization, extracted.workAuthorization, filled, "Work Authorization"),
    currentTitle: fill(current.currentTitle, extracted.currentTitle, filled, "Current Job Title"),
    experienceLevel: fill(current.experienceLevel, extracted.experienceLevel, filled, "Experience Level"),
    yearsExperience: fill(current.yearsExperience, extracted.yearsExperience, filled, "Years of Experience"),
    skills: mergeTags(current.skills, extracted.skills, filled, "Skills"),
    industries: mergeTags(current.industries, extracted.industries, filled, "Industries"),
    workExperience: mergeRoles(current.workExperience, extracted.workExperience, filled, createId),
    education: mergeEducation(current.education, extracted.education, filled),
  };

  return { values, filledFields: [...new Set(filled)] };
}
