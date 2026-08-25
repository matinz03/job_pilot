import { z } from "zod";
import { AI_MODEL, createAiClient } from "@/lib/ai";
import { companyResearchSchema, type CompanyResearchDossier } from "@/lib/company-research";
import { profileFormValuesFromRow, type ProfileDatabaseRow } from "@/lib/profile";
import { createResearchBrowser } from "@/lib/stagehand";
import type { createInsforgeServer } from "@/lib/insforge-server";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

type ResearchInput = { insforge: InsforgeServer; jobId: string; userId: string; userEmail: string; onProgress?: (step: string) => void | Promise<void> };
type ResearchJob = {
  id: string;
  title: string | null;
  company: string | null;
  about_role: string | null;
  matched_skills: string[] | null;
  missing_skills: string[] | null;
  source_url: string | null;
  external_apply_url: string | null;
};

const JOB_COLUMNS = "id, title, company, about_role, matched_skills, missing_skills, source_url, external_apply_url";
const PROFILE_COLUMNS = "full_name, email, phone, location, linkedin_url, portfolio_url, work_authorization, current_title, experience_level, years_experience, skills, industries, work_experience, education, job_titles_seeking, remote_preference, salary_expectation, preferred_locations, cover_letter_tone, completion_percentage, missing_fields, is_complete, resume_pdf_url, resume_pdf_key, resume_pdf_name";
const MAX_SUB_PAGES = 3;
const RESEARCH_FAILURE_MESSAGE = "Could not research this company right now. Please try again.";

const homepageSchema = z.object({
  oneLiner: z.string(),
  productSummary: z.string(),
  signals: z.array(z.string()),
  pageLinks: z.array(z.object({
    url: z.string(),
    kind: z.enum(["about", "careers", "blog", "engineering", "product", "team", "other"]),
  })),
});

const subPageSchema = z.object({
  keyPoints: z.array(z.string()),
  technologies: z.array(z.string()),
  valuesOrCulture: z.array(z.string()),
  notable: z.array(z.string()),
});

type WebsiteResearch = {
  homepage: z.infer<typeof homepageSchema> | null;
  pages: z.infer<typeof subPageSchema>[];
  sources: string[];
};

function rootDomain(hostname: string): string {
  const labels = hostname.toLowerCase().split(".").filter(Boolean);
  return labels.length > 2 ? labels.slice(-2).join(".") : labels.join(".");
}

function fallbackHomepage(company: string): string {
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 63);
  return domain ? `https://www.${domain}.com` : "";
}

function validHttpUrl(value: string | null): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

export async function deriveCompanyHomepage(company: string, redirectUrl: string | null): Promise<string> {
  const fallback = fallbackHomepage(company);
  const redirect = validHttpUrl(redirectUrl);
  if (!redirect) return fallback;

  try {
    const response = await fetch(redirect, { redirect: "follow", signal: AbortSignal.timeout(10_000) });
    const destination = validHttpUrl(response.url);
    if (!destination || destination.hostname.toLowerCase().includes("adzuna.com")) return fallback;
    return `https://${rootDomain(destination.hostname)}`;
  } catch {
    return fallback;
  }
}

function subPageUrls(links: z.infer<typeof homepageSchema>["pageLinks"], homepage: string): string[] {
  const origin = new URL(homepage).origin;
  const priority = ["about", "blog", "engineering", "product", "team", "careers", "other"];
  return links
    .flatMap((link) => {
      try {
        const url = new URL(link.url, homepage);
        return url.protocol === "https:" && url.origin === origin ? [{ ...link, url: url.toString() }] : [];
      } catch {
        return [];
      }
    })
    .sort((left, right) => priority.indexOf(left.kind) - priority.indexOf(right.kind))
    .filter((link, index, values) => values.findIndex((candidate) => candidate.url === link.url) === index)
    .slice(0, MAX_SUB_PAGES)
    .map((link) => link.url);
}

async function collectWebsiteResearch(homepageUrl: string, onProgress?: ResearchInput["onProgress"]): Promise<WebsiteResearch> {
  if (!homepageUrl) return { homepage: null, pages: [], sources: [] };

  let browser: Awaited<ReturnType<typeof createResearchBrowser>> | null = null;
  try {
    await onProgress?.("Opening secure browser");
    browser = await createResearchBrowser();
    await onProgress?.("Reading company homepage");
    await browser.page.goto(homepageUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const homepage = (await browser.stagehand.extract(
      "Capture what this company actually does, who it serves, concrete signals such as funding, customers, scale, mission or launches, and internal links worth visiting to research it as an employer. Return an empty string for unknown text and [] for unknown lists; include every field.",
      homepageSchema,
    )).data;
    const resolvedHomepage = await browser.page.url();
    const meaningful = homepage.oneLiner.trim() || homepage.productSummary.trim();
    if (!meaningful) return { homepage: null, pages: [], sources: [] };

    const sources = [resolvedHomepage];
    const pages: z.infer<typeof subPageSchema>[] = [];
    for (const url of subPageUrls(homepage.pageLinks, resolvedHomepage)) {
      try {
        await onProgress?.("Reviewing company pages");
        await browser.page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
        pages.push((await browser.stagehand.extract(
          "Extract substance for a candidate: company product, values and working style, concrete technologies and tools, notable projects or customers, and how the team operates. Ignore navigation, cookie banners, footers, and generic marketing copy. Return [] for every category with no evidence; include every field.",
          subPageSchema,
        )).data);
        sources.push(await browser.page.url());
      } catch (error) {
        console.error("[agent/research] sub-page", url, error);
      }
    }
    return { homepage, pages, sources: [...new Set(sources)].slice(0, 4) };
  } catch (error) {
    console.error("[agent/research] browser", error);
    return { homepage: null, pages: [], sources: [] };
  } finally {
    if (browser) {
      try {
        await browser.stagehand.close();
      } finally {
        await browser.browser.close();
      }
    }
  }
}

function isUnsupportedTemperatureError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error
    && (error as { status?: number }).status === 400
    && String((error as { message?: string }).message ?? "").toLowerCase().includes("temperature");
}

async function synthesiseDossier(job: ResearchJob, profile: ReturnType<typeof profileFormValuesFromRow>, research: WebsiteResearch): Promise<CompanyResearchDossier> {
  const roles = profile.workExperience
    .filter((role) => role.company || role.title)
    .map((role) => `${role.title || "Role"} at ${role.company || "an employer"}${role.responsibilities ? `: ${role.responsibilities}` : ""}`);
  const prompt = [
    "COMPANY RESEARCH", JSON.stringify(research), "",
    "JOB POSTING", `Title: ${job.title ?? "Untitled role"}`, `Company: ${job.company ?? "Unknown company"}`,
    `Description: ${(job.about_role ?? "No description available.").slice(0, 5000)}`,
    `Matched skills: ${(job.matched_skills ?? []).join(", ") || "None listed"}`,
    `Gaps: ${(job.missing_skills ?? []).join(", ") || "None listed"}`, "",
    "CANDIDATE PROFILE", `Current title: ${profile.currentTitle || "Not listed"}`,
    `Experience: ${profile.yearsExperience || "Not listed"} years, ${profile.experienceLevel || "level not listed"}`,
    `Skills: ${profile.skills.join(", ") || "None listed"}`,
    `Work history: ${roles.join(" | ") || "None listed"}`,
  ].join("\n");
  const system = "You are a sharp career strategist. Produce a concise, concrete dossier for this candidate and role. Ground company claims in supplied website research or job posting; never invent facts. Connect actual candidate experience to the role. Frame gaps as honest strategy. Every talking point and question must reference supplied evidence. Return only JSON with companyOverview, techStack, culture, whyThisRole, yourEdge, gapsToAddress, smartQuestions, interviewPrep, sources.";
  const request = {
    model: AI_MODEL,
    response_format: { type: "json_object" } as const,
    max_completion_tokens: 4000,
    messages: [{ role: "system" as const, content: system }, { role: "user" as const, content: prompt }],
  };
  const client = createAiClient();
  let content: string | null;
  try {
    const response = await client.chat.completions.create({ ...request, temperature: 0.4 }, { timeout: 60_000 });
    content = response.choices[0]?.message?.content ?? null;
  } catch (error) {
    if (!isUnsupportedTemperatureError(error)) throw error;
    const response = await client.chat.completions.create(request, { timeout: 60_000 });
    content = response.choices[0]?.message?.content ?? null;
  }
  if (!content) throw new Error("Research synthesis returned no dossier");
  let parsed: unknown;
  try { parsed = JSON.parse(content); } catch { throw new Error("Research synthesis returned invalid JSON"); }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Research synthesis returned an invalid dossier");
  }
  const source = parsed as Record<string, unknown>;
  const fallbackOverview = "The company website and job posting provided limited detail about the business.";
  const fallbackRole = job.about_role?.trim()
    ? "The job posting does not provide further detail on why this role exists."
    : "The job posting does not explain why this role exists.";
  const candidate = {
    ...source,
    companyOverview: typeof source.companyOverview === "string" && source.companyOverview.trim() ? source.companyOverview : fallbackOverview,
    whyThisRole: typeof source.whyThisRole === "string" && source.whyThisRole.trim() ? source.whyThisRole : fallbackRole,
    sources: research.sources,
  };
  const dossier = companyResearchSchema.safeParse(candidate);
  if (!dossier.success) throw new Error("Research synthesis returned an incomplete dossier");
  return { ...dossier.data, sources: research.sources };
}

async function log(insforge: InsforgeServer, userId: string, jobId: string, level: "success" | "warning" | "error", message: string) {
  const { error } = await insforge.database.from("agent_logs").insert([{ user_id: userId, job_id: jobId, run_id: null, level, message }]);
  if (error) console.error("[agent/research] log", error);
}

export async function runCompanyResearch({ insforge, jobId, onProgress, userEmail, userId }: ResearchInput) {
  const { data: jobRow, error: jobError } = await insforge.database.from("jobs").select(JOB_COLUMNS).eq("id", jobId).eq("user_id", userId).maybeSingle();
  if (jobError) throw new Error(RESEARCH_FAILURE_MESSAGE);
  if (!jobRow) return { status: "not_found" as const };
  const job = jobRow as ResearchJob;
  const { data: profileRow, error: profileError } = await insforge.database.from("profiles").select(PROFILE_COLUMNS).eq("id", userId).maybeSingle();
  if (profileError) throw new Error(RESEARCH_FAILURE_MESSAGE);
  const profile = profileFormValuesFromRow((profileRow as ProfileDatabaseRow | null) ?? null, userEmail);
  await onProgress?.("Finding company website");
  const homepage = await deriveCompanyHomepage(job.company ?? "", job.external_apply_url ?? job.source_url);
  const website = await collectWebsiteResearch(homepage, onProgress);
  if (!website.homepage) await log(insforge, userId, jobId, "warning", "Company website research was unavailable; dossier was generated from the job and profile.");
  try {
    await onProgress?.("Building tailored dossier");
    const dossier = await synthesiseDossier(job, profile, website);
    await onProgress?.("Saving dossier");
    const { error: saveError } = await insforge.database
      .from("jobs")
      .update({ company_research: dossier, researched_at: new Date().toISOString() })
      .eq("id", jobId)
      .eq("user_id", userId);
    if (saveError) throw new Error("Could not save company research");
    await log(insforge, userId, jobId, "success", `Researched ${job.company ?? "company"}.`);
    return { status: "success" as const, company: job.company ?? "Unknown company", dossier };
  } catch (error) {
    console.error("[agent/research] synthesis", error);
    await log(insforge, userId, jobId, "error", RESEARCH_FAILURE_MESSAGE);
    throw new Error(RESEARCH_FAILURE_MESSAGE);
  }
}
