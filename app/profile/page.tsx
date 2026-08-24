import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { createInsforgeServer } from "@/lib/insforge-server";
import { profileFormValuesFromRow, type ProfileDatabaseRow } from "@/lib/profile";

export default async function ProfilePage() {
  const insforge = await createInsforgeServer();
  const {
    data: { user },
    error,
  } = await insforge.auth.getCurrentUser();

  if (!user || error) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await insforge.database
    .from("profiles")
    .select("full_name, email, phone, location, linkedin_url, portfolio_url, work_authorization, current_title, experience_level, years_experience, skills, industries, work_experience, education, job_titles_seeking, remote_preference, salary_expectation, preferred_locations, cover_letter_tone, completion_percentage, missing_fields, is_complete, resume_pdf_url, resume_pdf_key, resume_pdf_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[profile/page] profile load", profileError);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar activeItem="profile" isAuthenticated />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <ProfileForm initialProfile={profileFormValuesFromRow((profile as ProfileDatabaseRow | null) ?? null, user.email ?? "")} />
      </main>
    </div>
  );
}
