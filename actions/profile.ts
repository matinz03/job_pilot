"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";
import { createPostHogServer } from "@/lib/posthog-server";
import { profileInputFromFormData, validateResume, type ProfileFieldErrors, type ProfileValidationInput } from "@/lib/profile-validation";

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message: string;
  completionPercentage: number;
  missingFields: string[];
  fieldErrors: ProfileFieldErrors;
};

function errorState(message: string, fieldErrors: ProfileFieldErrors = {}): ProfileActionState {
  return { status: "error", message, completionPercentage: 0, missingFields: [], fieldErrors };
}

function calculateCompletion(input: ProfileValidationInput) {
  const yearsExperience = input.yearsExperience ? Number(input.yearsExperience) : null;
  const checks = [
    ["Full Name", Boolean(input.fullName)],
    ["Phone", Boolean(input.phone)],
    ["Location", Boolean(input.location)],
    ["Work Authorization", Boolean(input.workAuthorization)],
    ["Current Job Title", Boolean(input.currentTitle)],
    ["Experience Level", Boolean(input.experienceLevel)],
    ["Years of Experience", yearsExperience !== null && yearsExperience > 0],
    ["Skills", input.skills.length > 0],
    ["Work Experience", input.workExperience.some((role) => Boolean(role.company && role.title && role.startDate && role.responsibilities))],
    ["Education", Boolean(input.education.degree && input.education.fieldOfStudy && input.education.institution && input.education.graduationYear)],
    ["Job Titles Seeking", input.jobTitlesSeeking.length > 0],
    ["Remote Preference", Boolean(input.remotePreference)],
  ] as const;
  const missingFields = checks.filter(([, complete]) => !complete).map(([label]) => label);

  return {
    completionPercentage: Math.round(((checks.length - missingFields.length) / checks.length) * 100),
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

export async function saveProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const insforge = await createInsforgeServer();
    const {
      data: { user },
      error: authError,
    } = await insforge.auth.getCurrentUser();

    if (authError || !user) {
      return errorState("Please sign in again before saving your profile.");
    }

    const profileInput = profileInputFromFormData(formData);
    const resumeErrors = await validateResume(formData.get("resume"));
    const fieldErrors = { ...profileInput.fieldErrors, ...resumeErrors };
    if (!profileInput.data || Object.keys(fieldErrors).length > 0) {
      return errorState("Fix the highlighted fields before saving your profile.", fieldErrors);
    }

    const { data: existingProfile, error: existingProfileError } = await insforge.database
      .from("profiles")
      .select("is_complete")
      .eq("id", user.id)
      .maybeSingle();
    if (existingProfileError) {
      console.error("[actions/profile] profile lookup", existingProfileError);
      return errorState("Could not save your profile. Please try again.");
    }

    const input = profileInput.data;
    const completion = calculateCompletion(input);
    const yearsExperience = input.yearsExperience ? Number(input.yearsExperience) : null;
  let resumePdfUrl: string | null | undefined;
  let resumePdfKey: string | null | undefined;
  let resumePdfName: string | null | undefined;
    const resume = formData.get("resume");
    if (resume instanceof File && resume.size > 0) {
      const { data, error } = await insforge.storage
        .from("resumes")
        .upload(`${user.id}/resume.pdf`, resume);
      if (error || !data) {
        console.error("[actions/profile] resume upload", error);
        return errorState("Could not upload your resume. Please try again.", { resume: "Resume upload failed. Please try again." });
      }
    resumePdfUrl = data.url;
    resumePdfKey = data.key;
    resumePdfName = resume.name || "resume.pdf";
    }

    const payload = {
      id: user.id,
      full_name: input.fullName || null,
      email: user.email ?? null,
      phone: input.phone || null,
      location: input.location || null,
      current_title: input.currentTitle || null,
      experience_level: input.experienceLevel || null,
      years_experience: yearsExperience,
      skills: input.skills,
      industries: input.industries,
      work_experience: input.workExperience,
      education: input.education.degree || input.education.fieldOfStudy || input.education.institution || input.education.graduationYear ? [input.education] : [],
      job_titles_seeking: input.jobTitlesSeeking,
      remote_preference: input.remotePreference || null,
      preferred_locations: input.preferredLocations,
      salary_expectation: input.salaryExpectation || null,
      cover_letter_tone: input.coverLetterTone || null,
      linkedin_url: input.linkedinUrl || null,
      portfolio_url: input.portfolioUrl || null,
      work_authorization: input.workAuthorization || null,
    ...(resumePdfUrl ? { resume_pdf_url: resumePdfUrl, resume_pdf_key: resumePdfKey, resume_pdf_name: resumePdfName } : {}),
      is_complete: completion.isComplete,
      completion_percentage: completion.completionPercentage,
      missing_fields: completion.missingFields,
    };
    const { error: saveError } = await insforge.database.from("profiles").upsert(payload);
    if (saveError) {
      console.error("[actions/profile] profile save", saveError);
      return errorState("Could not save your profile. Please try again.");
    }

    if (completion.isComplete && !existingProfile?.is_complete) {
      try {
        const posthog = createPostHogServer();
        if (posthog) {
          posthog.capture({
            distinctId: user.id,
            event: "profile_completed",
            properties: { userId: user.id },
          });
          await posthog.shutdown();
        }
      } catch (error) {
        console.error("[actions/profile] profile completion event", error);
      }
    }

    revalidatePath("/profile");
    return {
      status: "success",
      message: "Profile saved.",
      completionPercentage: completion.completionPercentage,
      missingFields: completion.missingFields,
      fieldErrors: {},
    };
  } catch (error) {
    console.error("[actions/profile] unexpected save failure", error);
    return errorState("Could not save your profile. Please try again.");
  }
}
