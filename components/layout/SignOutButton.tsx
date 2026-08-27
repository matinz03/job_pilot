"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/actions/auth";
import { posthog } from "@/lib/posthog-client";

export function SignOutButton({ fullWidth = false }: { fullWidth?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut(): Promise<void> {
    setError(null);
    setIsPending(true);

    const result = await signOut();

    if (!result.success) {
      setError(result.error ?? "Could not sign out. Please try again.");
      setIsPending(false);
      return;
    }

    posthog.reset();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? "items-stretch" : "items-end"}`}>
      <button
        className={`rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60 ${fullWidth ? "w-full" : ""}`}
        disabled={isPending}
        onClick={() => void handleSignOut()}
        type="button"
      >
        {isPending ? "Signing out…" : "Log out"}
      </button>
      {error ? (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
