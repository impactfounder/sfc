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
            console.log(`[auth/callback] setAll called with ${cookiesToSet.length} cookies`);
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                // NextResponse를 사용하여 쿠키 설정
                // Vercel 환경에서도 작동하도록 명시적 설정
                response.cookies.set(name, value, {
                  ...options,
                  httpOnly: options?.httpOnly ?? true,
                  secure: options?.secure ?? (process.env.NODE_ENV === "production" || process.env.VERCEL === "1"),
                  sameSite: (options?.sameSite as "lax" | "strict" | "none") ?? "lax",
                  path: options?.path ?? "/",
                  maxAge: options?.maxAge ?? 60 * 60 * 24 * 7, // 7일
                  // Vercel에서도 작동하도록 도메인 명시하지 않음 (기본값 사용)
                });
                console.log(`[auth/callback] Set cookie via setAll: ${name} (${value.length} chars)`);
              });
            } catch (error) {
              console.error("[auth/callback] Error setting cookies in setAll:", error);
            }
          },
        },
      }
    );
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("[auth/callback] Error exchanging code for session:", error);
      return NextResponse.redirect(new URL(`/auth/login?error=auth_failed&message=${encodeURIComponent(error.message)}`, requestUrl.origin));
    }

    // 세션이 성공적으로 설정되었는지 확인
    if (!data.session) {
      console.error("[auth/callback] No session after exchangeCodeForSession");
      return NextResponse.redirect(new URL("/auth/login?error=no_session", requestUrl.origin));
    }

    // 세션 확인을 위해 쿠키가 제대로 설정되었는지 로그
    const responseCookies = response.cookies.getAll();
    console.log("[auth/callback] Session created successfully:", {
      userId: data.session.user.id,
      expiresAt: data.session.expires_at,
      cookieCount: responseCookies.length,
      cookieNames: responseCookies.map(c => c.name),
      cookieDetails: responseCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
        httpOnly: c.httpOnly,
        secure: c.secure,
        sameSite: c.sameSite,
        path: c.path,
      })),
    });

    // 쿠키가 제대로 설정되었는지 확인
    const hasAuthCookie = responseCookies.some(cookie => 
      cookie.name.includes('auth-token') || 
      cookie.name.includes('access-token') ||
      cookie.name.includes('refresh-token') ||
      cookie.name.includes('supabase')
    );

    // @supabase/ssr이 쿠키를 설정하지 못하는 경우가 있으므로 항상 명시적으로 설정
    // Supabase SSR은 sb-{project-ref}-auth-token 형식의 쿠키를 사용
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]
    
    if (!projectRef) {
      console.error("[auth/callback] Failed to extract project ref from URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    } else if (data.session) {
      // 세션 데이터를 JSON으로 직렬화하여 쿠키에 저장
      // @supabase/ssr이 기대하는 형식과 동일하게 설정
      const sessionData = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
        user: data.session.user,
      }
      
      const cookieName = `sb-${projectRef}-auth-token`
      const cookieValue = JSON.stringify(sessionData)
      
      // 환경에 따라 secure 설정 (로컬 개발 환경에서는 false)
      const isSecure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1"
      const isHttps = requestUrl.protocol === "https:"
      
      // 쿠키 설정 (@supabase/ssr이 읽을 수 있는 형식)
      // 중요: secure는 HTTPS에서만 true로 설정
      response.cookies.set(cookieName, cookieValue, {
        httpOnly: true,
        secure: isSecure && isHttps, // HTTPS인 경우에만 secure
        sameSite: "lax" as const,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7일
        // 도메인은 명시하지 않음 (기본값 사용)
      })
      
      console.log(`[auth/callback] Set auth cookie: ${cookieName} (${cookieValue.length} chars)`, {
        secure: isSecure && isHttps,
        sameSite: "lax",
        path: "/",
        protocol: requestUrl.protocol,
        host: requestUrl.host,
      })
      
      // 추가로 개별 토큰 쿠키도 설정 (일부 Supabase 클라이언트가 이를 기대할 수 있음)
      if (data.session.access_token) {
        response.cookies.set(`sb-${projectRef}-auth-token.access_token`, data.session.access_token, {
          httpOnly: true,
          secure: isSecure && isHttps,
          sameSite: "lax" as const,
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        })
      }
      
      if (data.session.refresh_token) {
        response.cookies.set(`sb-${projectRef}-auth-token.refresh_token`, data.session.refresh_token, {
          httpOnly: true,
          secure: isSecure && isHttps,
          sameSite: "lax" as const,
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30일
        })
      }
      
      if (!hasAuthCookie) {
        console.warn("[auth/callback] @supabase/ssr did not set cookies automatically, using manual fallback");
      }
    }

    return response;
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
