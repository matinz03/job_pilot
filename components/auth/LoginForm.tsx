"use client";

import { useState } from "react";
import { OAUTH_CODE_VERIFIER_KEY } from "@/lib/auth-constants";
import { insforge, isInsforgeConfigured } from "@/lib/insforge-client";
import { posthog } from "@/lib/posthog-client";

type OAuthProvider = "google" | "github";

const GENERIC_ERROR = "Could not start sign-in. Please try again.";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWithProvider(provider: OAuthProvider): Promise<void> {
    setError(null);
    setIsLoading(provider);

    try {
      const { data, error: authError } = await insforge.auth.signInWithOAuth(
        provider,
        {
          redirectTo: `${window.location.origin}/callback`,
          skipBrowserRedirect: true,
        },
      );

      if (authError || !data.url || !data.codeVerifier) {
        const reason = authError ?? new Error("OAuth start returned no redirect URL");
        setError(authError?.message ?? GENERIC_ERROR);
        setIsLoading(null);
        posthog.captureException(reason, { provider, stage: "signin_start" });
        return;
      }

      window.sessionStorage.setItem(OAUTH_CODE_VERIFIER_KEY, data.codeVerifier);
      window.location.assign(data.url);
    } catch (authError) {
      console.error("[LoginForm]", authError);
      setError(GENERIC_ERROR);
      setIsLoading(null);
      posthog.captureException(authError, { provider, stage: "signin_start" });
    }
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-card sm:p-8">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-accent">WELCOME TO JOBPILOT</p>
        <h1 className="text-2xl font-semibold text-text-primary">Find work that fits.</h1>
        <p className="text-sm text-text-secondary">
          Sign in to save matches and move your job search forward.
        </p>
      </div>

      {isInsforgeConfigured ? (
        <>
          <div className="mt-8 space-y-3">
            <button
              className="flex w-full items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading !== null}
              onClick={() => void signInWithProvider("google")}
              type="button"
            >
              {isLoading === "google" ? "Connecting to Google…" : "Continue with Google"}
            </button>
            <button
              className="flex w-full items-center justify-center rounded-md bg-overlay px-4 py-2 text-sm font-medium text-accent-foreground shadow-button transition-all hover:-translate-y-0.5 hover:bg-overlay-dark hover:shadow-button-hover disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading !== null}
              onClick={() => void signInWithProvider("github")}
              type="button"
            >
              {isLoading === "github" ? "Connecting to GitHub…" : "Continue with GitHub"}
            </button>
          </div>

          {error ? (
            <p className="mt-4 text-center text-sm text-error" role="alert">
              {error}
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-8 text-center text-sm text-error" role="alert">
          Sign-in is not available. This deployment is missing its authentication
          configuration.
        </p>
      )}
    </div>
  );
}
