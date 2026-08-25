import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { runCompanyResearch } from "@/agent/research";
import { createInsforgeServer } from "@/lib/insforge-server";
import { createPostHogServer } from "@/lib/posthog-server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const requestSchema = z.object({ jobId: z.string().uuid() });
const encoder = new TextEncoder();

function failure(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

function event(type: "complete" | "error" | "progress", data: unknown) {
  return encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: Request) {
  const insforge = await createInsforgeServer();
  const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
  if (authError || !user) return failure("Please sign in again to research a company.", 401);
  let body: unknown;
  try { body = await request.json(); } catch { return failure("Choose a saved job to research.", 400); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return failure("Choose a valid saved job to research.", 400);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await runCompanyResearch({
          insforge,
          jobId: parsed.data.jobId,
          userId: user.id,
          userEmail: user.email ?? "",
          onProgress: (step) => controller.enqueue(event("progress", { step })),
        });
        if (result.status === "not_found") {
          controller.enqueue(event("error", { error: "This job is no longer available." }));
          return;
        }

        const posthog = createPostHogServer();
        try {
          posthog?.capture({ distinctId: user.id, event: "company_researched", properties: { userId: user.id, jobId: parsed.data.jobId, company: result.company } });
        } catch (error) {
          console.error("[api/agent/research] analytics", error);
        } finally {
          try { await posthog?.shutdown(); } catch (error) { console.error("[api/agent/research] analytics shutdown", error); }
        }
        revalidatePath(`/find-jobs/${parsed.data.jobId}`);
        revalidatePath("/dashboard");
        controller.enqueue(event("complete", { dossier: result.dossier }));
      } catch (error) {
        console.error("[api/agent/research]", error);
        controller.enqueue(event("error", { error: error instanceof Error ? error.message : "Could not research this company right now. Please try again." }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Cache-Control": "no-cache", "Content-Type": "text/event-stream", Connection: "keep-alive" } });
}
