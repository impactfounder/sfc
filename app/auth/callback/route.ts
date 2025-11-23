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
    
    // 프로젝트 참조 추출 (나중에 사용)
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // setAll이 호출되는지 확인하기 위한 로그
            // Vercel에서는 이 로그가 Runtime Logs에 표시되지 않을 수 있으므로
            // 쿠키를 항상 명시적으로 설정하는 방식으로 변경
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                // NextResponse를 사용하여 쿠키 설정
                response.cookies.set(name, value, {
                  ...options,
                  httpOnly: options?.httpOnly ?? true,
                  secure: options?.secure ?? (process.env.NODE_ENV === "production" || process.env.VERCEL === "1"),
                  sameSite: (options?.sameSite as "lax" | "strict" | "none") ?? "lax",
                  path: options?.path ?? "/",
                  maxAge: options?.maxAge ?? 60 * 60 * 24 * 7, // 7일
                });
              });
            } catch (error) {
              // 에러는 무시하고 계속 진행 (명시적 설정으로 대체)
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

    // @supabase/ssr이 쿠키를 설정하지 못하는 경우가 있으므로 항상 명시적으로 설정
    // Supabase SSR은 sb-{project-ref}-auth-token 형식의 쿠키를 사용
    if (!projectRef) {
      // 프로젝트 참조를 추출할 수 없으면 에러 반환
      return NextResponse.redirect(new URL(`/auth/login?error=config_error`, requestUrl.origin));
    }
    
    if (data.session) {
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
      
      // 환경에 따라 secure 설정
      // Vercel은 항상 HTTPS이므로 secure를 true로 설정
      const isHttps = requestUrl.protocol === "https:" || process.env.VERCEL === "1"
      
      // 쿠키 설정 (@supabase/ssr이 읽을 수 있는 형식)
      // 중요: Vercel에서는 항상 HTTPS이므로 secure를 true로 설정
      response.cookies.set(cookieName, cookieValue, {
        httpOnly: true,
        secure: isHttps, // Vercel은 항상 HTTPS
        sameSite: "lax" as const,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7일
      })
      
      // 추가로 개별 토큰 쿠키도 설정
      if (data.session.access_token) {
        response.cookies.set(`sb-${projectRef}-auth-token.access_token`, data.session.access_token, {
          httpOnly: true,
          secure: isHttps,
          sameSite: "lax" as const,
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        })
      }
      
      if (data.session.refresh_token) {
        response.cookies.set(`sb-${projectRef}-auth-token.refresh_token`, data.session.refresh_token, {
          httpOnly: true,
          secure: isHttps,
          sameSite: "lax" as const,
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30일
        })
      }
    }

    return response;
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
