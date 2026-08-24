import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { createInsforgeServer } from "@/lib/insforge-server";
import { UNREADABLE_PDF_MESSAGE, extractProfileFromResumeText } from "@/lib/resume-extraction";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function failure(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

async function readResumeText(resume: Blob): Promise<string | null> {
  const parser = new PDFParse({ data: new Uint8Array(await resume.arrayBuffer()) });
  try {
    const result = await parser.getText();
    return result.text;
  } catch (error) {
    console.error("[api/resume/extract] pdf parse", error);
    return null;
  } finally {
    await parser.destroy();
  }
}

export async function POST() {
  try {
    const insforge = await createInsforgeServer();
    const {
      data: { user },
      error: authError,
    } = await insforge.auth.getCurrentUser();

    if (authError || !user) {
      return failure("Please sign in again to extract your resume.", 401);
    }

    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("resume_pdf_key")
      .eq("id", user.id)
      .maybeSingle();
    const expectedKey = `${user.id}/resume.pdf`;

    if (profileError) {
      console.error("[api/resume/extract] profile lookup", profileError);
      return failure("Could not read your resume right now. Please try again.", 500);
    }
    if (profile?.resume_pdf_key !== expectedKey) {
      return failure("Upload a resume before extracting your profile.", 404);
    }

    const { data: resume, error: downloadError } = await insforge.storage
      .from("resumes")
      .download(expectedKey);

    if (downloadError || !resume) {
      console.error("[api/resume/extract] resume download", downloadError);
      return failure("Could not open your resume. Please try again.", 500);
    }

    const resumeText = await readResumeText(resume);
    if (resumeText === null) {
      return failure(UNREADABLE_PDF_MESSAGE, 422);
    }

    const extraction = await extractProfileFromResumeText(resumeText);
    if (!extraction.success) {
      return failure(extraction.error, extraction.error === UNREADABLE_PDF_MESSAGE ? 422 : 502);
    }

    return NextResponse.json({ success: true, data: extraction.data });
  } catch (error) {
    console.error("[api/resume/extract]", error);
    return failure("Could not read your resume right now. Please try again.", 500);
  }
}
