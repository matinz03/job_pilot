import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runJobDiscovery } from "@/agent/adzuna";
import { createInsforgeServer } from "@/lib/insforge-server";
import { createPostHogServer } from "@/lib/posthog-server";
import { profileFormValuesFromRow, type ProfileDatabaseRow } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const PROFILE_COLUMNS = "full_name, email, phone, location, linkedin_url, portfolio_url, work_authorization, current_title, experience_level, years_experience, skills, industries, work_experience, education, job_titles_seeking, remote_preference, salary_expectation, preferred_locations, cover_letter_tone, completion_percentage, missing_fields, is_complete, resume_pdf_url, resume_pdf_key, resume_pdf_name";

const requestSchema = z.object({
  jobTitle: z.string().trim().min(2, "Enter a job title to search for.").max(120),
  location: z.string().trim().max(120).default(""),
});

function failure(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST(request: Request) {
  try {
    const insforge = await createInsforgeServer();
    const {
      data: { user },
      error: authError,
    } = await insforge.auth.getCurrentUser();

    if (authError || !user) {
      return failure("Please sign in again to search for jobs.", 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return failure("Enter a job title to search for.", 400);
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return failure(parsed.error.issues[0]?.message ?? "Enter a job title to search for.", 400);
    }

    const { data: row, error: profileError } = await insforge.database
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[api/agent/find] profile lookup", profileError);
      return failure("Could not search for jobs right now. Please try again.", 500);
    }

    // Scoring is meaningless without something to score against.
    const profile = profileFormValuesFromRow((row as ProfileDatabaseRow | null) ?? null, user.email ?? "");
    if (profile.skills.length === 0 && !profile.currentTitle.trim()) {
      return failure("Add your job title and a few skills to your profile before searching, so jobs can be scored against it.", 422);
    }

    const posthog = createPostHogServer();
    try {
      posthog?.capture({
        distinctId: user.id,
        event: "job_search_started",
        properties: { userId: user.id, jobTitle: parsed.data.jobTitle, location: parsed.data.location },
      });

      const result = await runJobDiscovery({
        insforge,
        userId: user.id,
        profile,
        jobTitle: parsed.data.jobTitle,
        location: parsed.data.location,
      });

      for (const job of result.savedJobs) {
        posthog?.capture({
          distinctId: user.id,
          event: "job_found",
          properties: { userId: user.id, source: "search", matchScore: job.matchScore },
        });
      }

      revalidatePath("/find-jobs");
      return NextResponse.json({
        success: true,
        data: {
          message: result.message,
          jobsFound: result.jobsFound,
          jobsSaved: result.jobsSaved,
          strongMatches: result.strongMatches,
        },
      });
    } finally {
      await posthog?.shutdown();
    }
  } catch (error) {
    console.error("[api/agent/find]", error);
    const message = error instanceof Error && error.message ? error.message : "Could not search for jobs right now. Please try again.";
    return failure(message, 502);
  }
}
