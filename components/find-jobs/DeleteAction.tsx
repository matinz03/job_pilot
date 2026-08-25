"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DeleteResult } from "@/actions/jobs";

type DeleteActionProps = {
  action: () => Promise<DeleteResult>;
  count: number;
  idleLabel: string;
  /** Where to go once the rows are gone. Omit to stay put and re-render in place. */
  redirectTo?: string;
  tone?: "button" | "quiet";
};

const buttonTone = "shrink-0 rounded-md border border-error/40 bg-surface px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/5 disabled:cursor-not-allowed disabled:opacity-60";
const quietTone = "rounded-md px-2 py-1 text-sm font-medium text-text-secondary underline underline-offset-4 transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-60";
const confirmClassName = "shrink-0 rounded-md bg-error px-4 py-2 text-sm font-semibold text-error-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
const cancelClassName = "shrink-0 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-dark transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60";

export function DeleteAction({ action, count, idleLabel, redirectTo, tone = "button" }: DeleteActionProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function confirm() {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setIsConfirming(false);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  }

  if (!isConfirming) {
    return (
      <div className="flex flex-col items-end gap-2">
        <button className={tone === "quiet" ? quietTone : buttonTone} onClick={() => setIsConfirming(true)} type="button">
          {idleLabel}
        </button>
        {error && <p className="text-sm font-medium text-error" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {/* The count is the whole point of the confirm — it states the blast radius. */}
        <p className="text-sm font-medium text-text-dark">
          Delete {count} {count === 1 ? "job" : "jobs"}? This cannot be undone.
        </p>
        <button className={cancelClassName} disabled={isPending} onClick={() => setIsConfirming(false)} type="button">
          Cancel
        </button>
        <button className={confirmClassName} disabled={isPending} onClick={confirm} type="button">
          {isPending ? "Deleting..." : "Delete"}
        </button>
      </div>
      {error && <p className="text-sm font-medium text-error" role="alert">{error}</p>}
    </div>
  );
}
