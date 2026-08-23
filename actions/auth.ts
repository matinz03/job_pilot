"use server";

import { createAuthActions } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";

type AuthActionResult = {
  success: boolean;
  error?: string;
};

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
    const { error } = await auth.exchangeOAuthCode(code, codeVerifier);

    if (error) {
      console.error("[actions/auth]", error);
      return { success: false, error: "Authentication could not be completed." };
    }

    return { success: true };
  } catch (error) {
    console.error("[actions/auth]", error);
    return { success: false, error: "Authentication could not be completed." };
  }
}
