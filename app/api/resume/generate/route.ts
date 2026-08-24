import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";
import { profileFormValuesFromRow, type ProfileDatabaseRow } from "@/lib/profile";
import {
  GENERATION_FAILURE_MESSAGE,
  buildResumeContent,
  checkResumeReadiness,
  generateResumeProse,
  resumeFileName,
} from "@/lib/resume-generation";
import { renderResumePdf } from "./ResumeDocument";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PROFILE_COLUMNS = "full_name, email, phone, location, linkedin_url, portfolio_url, work_authorization, current_title, experience_level, years_experience, skills, industries, work_experience, education, job_titles_seeking, remote_preference, salary_expectation, preferred_locations, cover_letter_tone, completion_percentage, missing_fields, is_complete, resume_pdf_url, resume_pdf_key, resume_pdf_name";

function failure(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST() {
  try {
    const insforge = await createInsforgeServer();
    const {
      data: { user },
      error: authError,
    } = await insforge.auth.getCurrentUser();

    if (authError || !user) {
      return failure("Please sign in again to generate your resume.", 401);
    }

    const { data: row, error: profileError } = await insforge.database
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[api/resume/generate] profile lookup", profileError);
      return failure(GENERATION_FAILURE_MESSAGE, 500);
    }

    const profile = profileFormValuesFromRow((row as ProfileDatabaseRow | null) ?? null, user.email ?? "");
    const readiness = checkResumeReadiness(profile);
    if (!readiness.ready) {
      return failure(readiness.error, 422);
    }

    const prose = await generateResumeProse(profile);
    if (!prose.success) {
      return failure(prose.error, 502);
    }

    const pdf = await renderResumePdf(buildResumeContent(profile, prose.data));
    const fileName = resumeFileName(profile.fullName);

    // Standard PUT semantics — uploading to the existing key replaces the object in place,
    // which is why the client confirms before an uploaded resume is overwritten.
    const { data: uploaded, error: uploadError } = await insforge.storage
      .from("resumes")
      .upload(`${user.id}/resume.pdf`, new Blob([new Uint8Array(pdf)], { type: "application/pdf" }));

    if (uploadError || !uploaded) {
      console.error("[api/resume/generate] upload", uploadError);
      return failure("Could not save your generated resume. Please try again.", 500);
    }

    const { error: saveError } = await insforge.database
      .from("profiles")
      .update({
        resume_pdf_url: uploaded.url,
        resume_pdf_key: uploaded.key,
        resume_pdf_name: fileName,
      })
      .eq("id", user.id);

    if (saveError) {
      console.error("[api/resume/generate] profile update", saveError);
      return failure("Your resume was generated but could not be linked to your profile. Please try again.", 500);
    }

    revalidatePath("/profile");
    return NextResponse.json({ success: true, data: { fileName } });
  } catch (error) {
    console.error("[api/resume/generate]", error);
    return failure(GENERATION_FAILURE_MESSAGE, 500);
  }
}
