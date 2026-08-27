import { createServerClient } from "@insforge/sdk/ssr";
import { updateSession } from "@insforge/sdk/ssr/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next();
  const isApiRequest = request.nextUrl.pathname.startsWith("/api/");
  try {
    const { accessToken, error } = await updateSession({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
      requestCookies: request.cookies,
      responseCookies: response.cookies,
    });

    if (!accessToken || error) {
      if (isApiRequest) return response;
      return redirectToLogin(request, response);
    }

    const insforge = createServerClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
      accessToken,
    });
    const {
      data: { user },
      error: userError,
    } = await insforge.auth.getCurrentUser();

    if (!user || userError) {
      if (isApiRequest) return response;
      return redirectToLogin(request, response);
    }

    return response;
  } catch (error) {
    console.error("[proxy]", error);
    return redirectToLogin(request, response);
  }
}

function redirectToLogin(request: NextRequest, response: NextResponse): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  const loginResponse = NextResponse.redirect(loginUrl);

  response.cookies.getAll().forEach((cookie) => loginResponse.cookies.set(cookie));
  return loginResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/find-jobs/:path*", "/api/((?!auth(?:/|$)).*)"],
};
