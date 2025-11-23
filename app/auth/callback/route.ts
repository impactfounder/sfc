import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const cookieStore = await cookies();
    const response = NextResponse.redirect(new URL(next, requestUrl.origin));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                // NextResponse를 사용하여 쿠키 설정
                response.cookies.set(name, value, {
                  ...options,
                  httpOnly: options?.httpOnly ?? true,
                  secure: options?.secure ?? process.env.NODE_ENV === "production",
                  sameSite: (options?.sameSite as "lax" | "strict" | "none") ?? "lax",
                  path: options?.path ?? "/",
                  maxAge: options?.maxAge ?? 60 * 60 * 24 * 7, // 7일
                });
              });
            } catch (error) {
              console.error("Error setting cookies:", error);
            }
          },
        },
      }
    );
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(new URL(`/auth/login?error=auth_failed&message=${encodeURIComponent(error.message)}`, requestUrl.origin));
    }

    // 세션이 성공적으로 설정되었는지 확인
    if (!data.session) {
      console.error("No session after exchangeCodeForSession");
      return NextResponse.redirect(new URL("/auth/login?error=no_session", requestUrl.origin));
    }

    // 세션 확인을 위해 쿠키가 제대로 설정되었는지 로그
    if (process.env.NODE_ENV === "development") {
      console.log("Session created successfully:", {
        userId: data.session.user.id,
        expiresAt: data.session.expires_at,
        cookieCount: response.cookies.getAll().length,
      });
    }

    // 쿠키가 제대로 설정되었는지 확인
    const responseCookies = response.cookies.getAll();
    const hasAuthCookie = responseCookies.some(cookie => 
      cookie.name.includes('auth-token') || 
      cookie.name.includes('access-token') ||
      cookie.name.includes('refresh-token')
    );

    if (!hasAuthCookie && process.env.NODE_ENV === "development") {
      console.warn("Warning: No auth cookies found after session exchange");
    }

    return response;
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
