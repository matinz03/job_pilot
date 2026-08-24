import { NextResponse } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const insforge = await createInsforgeServer();
  const {
    data: { user },
    error: authError,
  } = await insforge.auth.getCurrentUser();

  if (authError || !user) {
    return new NextResponse("Please sign in to open your resume.", { status: 401 });
  }

  const { data: profile, error: profileError } = await insforge.database
    .from("profiles")
    .select("resume_pdf_key")
    .eq("id", user.id)
    .maybeSingle();
  const expectedKey = `${user.id}/resume.pdf`;

  if (profileError || profile?.resume_pdf_key !== expectedKey) {
    return new NextResponse("Resume not found.", { status: 404 });
  }

  const { data, error: signedUrlError } = await insforge.storage
    .from("resumes")
    .createSignedUrl(expectedKey, 300);

  if (signedUrlError || !data?.signedUrl) {
    console.error("[api/resume] signed URL", signedUrlError);
    return new NextResponse("Could not open your resume. Please try again.", { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
