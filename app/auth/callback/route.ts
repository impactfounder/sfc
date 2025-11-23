import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorParam = requestUrl.searchParams.get("error");
  const next = requestUrl.searchParams.get("next") || "/";

  // OAuth 에러가 있으면 로그인 페이지로 리디렉션
  if (errorParam) {
    return NextResponse.redirect(new URL(`/auth/login?error=oauth_error&message=${encodeURIComponent(errorParam)}`, requestUrl.origin));
  }

  if (code) {
    const cookieStore = await cookies();
    
    // 리디렉션 응답을 먼저 생성
    const response = NextResponse.redirect(new URL(next, requestUrl.origin));
    
    // Supabase 클라이언트 생성 (setAll에서 response를 사용)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // @supabase/ssr이 자동으로 호출하는 setAll
            // 여기서 쿠키를 response에 설정해야 함
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
                sameSite: "lax",
                path: "/",
              });
            });
          },
        },
      }
    );
    
    // 코드를 세션으로 교환 (이 과정에서 setAll이 자동 호출됨)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("[auth/callback] Error:", error.message);
      return NextResponse.redirect(new URL(`/auth/login?error=auth_failed&message=${encodeURIComponent(error.message)}`, requestUrl.origin));
    }

    if (!data?.session) {
      console.error("[auth/callback] No session");
      return NextResponse.redirect(new URL("/auth/login?error=no_session", requestUrl.origin));
    }

    // 쿠키가 제대로 설정되었는지 확인
    const responseCookies = response.cookies.getAll();
    const hasAuthCookie = responseCookies.some(c => 
      c.name.includes('auth-token') || 
      c.name.includes('supabase')
    );

    // @supabase/ssr이 쿠키를 설정하지 못한 경우 수동 설정
    if (!hasAuthCookie) {
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
      
      if (projectRef && data.session) {
        const sessionData = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in,
          token_type: data.session.token_type,
          user: data.session.user,
        };
        
        const cookieName = `sb-${projectRef}-auth-token`;
        const cookieValue = JSON.stringify(sessionData);
        const isSecure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
        
        response.cookies.set(cookieName, cookieValue, {
          httpOnly: true,
          secure: isSecure,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }

    return response;
  }

  // code가 없으면 홈으로 리디렉션
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
