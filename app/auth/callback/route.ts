import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const response = NextResponse.redirect(new URL(next, origin));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // Route Handler에서는 NextResponse를 사용하여 쿠키 설정
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 로그인 성공 시 원래 가려던 페이지로 이동
      const forwardedHost = request.headers.get("x-forwarded-host"); // Vercel 배포 환경 대응
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(new URL(next, origin));
      } else if (forwardedHost) {
        return NextResponse.redirect(new URL(next, `https://${forwardedHost}`));
      } else {
        return response; // 이미 next로 리디렉션 설정됨
      }
    }
  }

  // 로그인 실패 시 로그인 페이지로 이동
  return NextResponse.redirect(new URL("/auth/login?error=auth_failed", origin));
}
