"use server";

import { createAuthActions } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { OAUTH_CODE_VERIFIER_KEY } from "@/lib/auth-constants";
type AuthActionResult = {
  success: boolean;
  error?: string;
  userId?: string;
};

type SignOutActionResult = {
  success: boolean;
  error?: string;
};

type StartOAuthActionResult = {
  success: boolean;
  error?: string;
  url?: string;
};

type OAuthProvider = "google" | "github";

function appUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export async function startOAuthSignIn(provider: OAuthProvider): Promise<StartOAuthActionResult> {
  const origin = appUrl();
  if (!origin) {
    console.error("[actions/auth] NEXT_PUBLIC_APP_URL is missing or invalid");
    return { success: false, error: "Sign-in is not configured for this deployment." };
  }

  try {
    const cookieStore = await cookies();
    const auth = createAuthActions({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
      cookies: cookieStore,
    });
    const { data, error } = await auth.signInWithOAuth(provider, {
      redirectTo: new URL("/api/auth/callback", origin).toString(),
      skipBrowserRedirect: true,
    });
    if (error || !data?.url || !data.codeVerifier) {
      console.error("[actions/auth] OAuth start", error);
      return { success: false, error: "Could not start sign-in. Please try again." };
    }

    cookieStore.set(OAUTH_CODE_VERIFIER_KEY, data.codeVerifier, {
      httpOnly: true,
      maxAge: 600,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return { success: true, url: data.url };
  } catch (error) {
    console.error("[actions/auth] OAuth start", error);
    return { success: false, error: "Could not start sign-in. Please try again." };
  }
}

export async function completeOAuthSignIn(
  code: string,
  codeVerifier: string,
): Promise<AuthActionResult> {
  if (!code || !codeVerifier) {
    return { success: false, error: "Authentication could not be completed." };
  }

  try {
    const cookieStore = await cookies();
    const auth = createAuthActions({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
      cookies: cookieStore,
    });
    const { data, error } = await auth.exchangeOAuthCode(code, codeVerifier);

    if (error || !data) {
      console.error("[actions/auth]", error);
      return { success: false, error: "Authentication could not be completed." };
    }

    return { success: true, userId: data.user.id };
  } catch (error) {
    console.error("[actions/auth]", error);
    return { success: false, error: "Authentication could not be completed." };
  }
}

export async function signOut(): Promise<SignOutActionResult> {
  try {
    const cookieStore = await cookies();
    const auth = createAuthActions({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
      cookies: cookieStore,
    });
    const { error } = await auth.signOut();

    if (error) {
      console.error("[actions/auth]", error);
      return { success: false, error: "Could not sign out. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("[actions/auth]", error);
    return { success: false, error: "Could not sign out. Please try again." };
  }
}
