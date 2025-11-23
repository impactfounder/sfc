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
    const response = NextResponse.redirect(new URL(next, requestUrl.origin));
    
    // 프로젝트 참조 추출
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
    
    if (!projectRef) {
      return NextResponse.redirect(new URL(`/auth/login?error=config_error`, requestUrl.origin));
    }
    
    // Supabase 클라이언트 생성
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
    
    // 코드를 세션으로 교환
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      return NextResponse.redirect(new URL(`/auth/login?error=auth_failed&message=${encodeURIComponent(error.message)}`, requestUrl.origin));
    }

    if (!data?.session) {
      return NextResponse.redirect(new URL("/auth/login?error=no_session", requestUrl.origin));
    }

    // 항상 명시적으로 쿠키 설정 (@supabase/ssr이 실패할 수 있으므로)
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
    const isSecure = requestUrl.protocol === "https:" || process.env.VERCEL === "1";
    
    // 메인 쿠키 설정
    response.cookies.set(cookieName, cookieValue, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7일
    });
    
    // 개별 토큰 쿠키도 설정
    if (data.session.access_token) {
      response.cookies.set(`${cookieName}.access_token`, data.session.access_token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    
    if (data.session.refresh_token) {
      response.cookies.set(`${cookieName}.refresh_token`, data.session.refresh_token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30일
      });
    }

    return response;
  }

  // code가 없으면 홈으로 리디렉션
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
