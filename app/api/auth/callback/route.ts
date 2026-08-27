import { createAuthActions } from "@insforge/sdk/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { OAUTH_CODE_VERIFIER_KEY } from "@/lib/auth-constants";

function loginRedirect(request: NextRequest, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const codeVerifier = request.cookies.get(OAUTH_CODE_VERIFIER_KEY)?.value;
  if (!code || !codeVerifier) return loginRedirect(request, "oauth_failed");

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  const auth = createAuthActions({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });
  const { error } = await auth.exchangeOAuthCode(code, codeVerifier);
  if (error) {
    console.error("[api/auth/callback]", error);
    return loginRedirect(request, "oauth_failed");
  }

  response.cookies.delete(OAUTH_CODE_VERIFIER_KEY);
  return response;
}
