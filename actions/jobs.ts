"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";

export type DeleteResult =
  | { status: "success"; deleted: number }
  | { status: "error"; message: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FAILURE_MESSAGE = "Could not delete those jobs. Please try again.";

/**
 * Removes one search: its jobs, the run record, and the run's log entries.
 *
 * `jobs.run_id` is `on delete set null`, so deleting the run alone would orphan its jobs rather
 * than remove them — every table is deleted explicitly, and every delete is scoped by `user_id`
 * as well as by RLS.
 */
export async function deleteSearchRun(runId: string): Promise<DeleteResult> {
  if (!UUID_PATTERN.test(runId)) {
    return { status: "error", message: FAILURE_MESSAGE };
  }

  try {
    const insforge = await createInsforgeServer();
    const {
      data: { user },
      error: authError,
    } = await insforge.auth.getCurrentUser();

    if (authError || !user) {
      return { status: "error", message: "Please sign in again to delete these jobs." };
    }

    const { error: logsError } = await insforge.database
      .from("agent_logs")
      .delete()
      .eq("user_id", user.id)
      .eq("run_id", runId);
    if (logsError) {
      console.error("[actions/jobs] delete run logs", logsError);
      return { status: "error", message: FAILURE_MESSAGE };
    }

    const { data: deletedJobs, error: jobsError } = await insforge.database
      .from("jobs")
      .delete()
      .eq("user_id", user.id)
      .eq("run_id", runId)
      .select("id");
    if (jobsError) {
      console.error("[actions/jobs] delete run jobs", jobsError);
      return { status: "error", message: FAILURE_MESSAGE };
    }

    const { error: runError } = await insforge.database
      .from("agent_runs")
      .delete()
      .eq("user_id", user.id)
      .eq("id", runId);
    if (runError) {
      console.error("[actions/jobs] delete run", runError);
      return { status: "error", message: FAILURE_MESSAGE };
    }

    revalidatePath("/find-jobs");
    return { status: "success", deleted: (deletedJobs ?? []).length };
  } catch (error) {
    console.error("[actions/jobs] deleteSearchRun", error);
    return { status: "error", message: FAILURE_MESSAGE };
  }
}

/** Clears every saved job, search run and log entry for the current user. */
export async function deleteAllJobs(): Promise<DeleteResult> {
  try {
    const insforge = await createInsforgeServer();
    const {
      data: { user },
      error: authError,
    } = await insforge.auth.getCurrentUser();

    if (authError || !user) {
      return { status: "error", message: "Please sign in again to delete your jobs." };
    }

    const { error: logsError } = await insforge.database
      .from("agent_logs")
      .delete()
      .eq("user_id", user.id);
    if (logsError) {
      console.error("[actions/jobs] delete all logs", logsError);
      return { status: "error", message: FAILURE_MESSAGE };
    }

    const { data: deletedJobs, error: jobsError } = await insforge.database
      .from("jobs")
      .delete()
      .eq("user_id", user.id)
      .select("id");
    if (jobsError) {
      console.error("[actions/jobs] delete all jobs", jobsError);
      return { status: "error", message: FAILURE_MESSAGE };
    }

    const { error: runsError } = await insforge.database
      .from("agent_runs")
      .delete()
      .eq("user_id", user.id);
    if (runsError) {
      console.error("[actions/jobs] delete all runs", runsError);
      return { status: "error", message: FAILURE_MESSAGE };
    }

    revalidatePath("/find-jobs");
    revalidatePath("/dashboard");
    return { status: "success", deleted: (deletedJobs ?? []).length };
  } catch (error) {
    console.error("[actions/jobs] deleteAllJobs", error);
    return { status: "error", message: FAILURE_MESSAGE };
  }
}
