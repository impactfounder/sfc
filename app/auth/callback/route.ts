import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();

    // 1. 먼저 어디로 이동할지 결정합니다.
    // Vercel 배포 환경을 고려하여 URL을 생성합니다.
    const forwardedHost = request.headers.get("x-forwarded-host"); 
    const isLocalEnv = process.env.NODE_ENV === "development";

    let redirectUrl: URL;
    if (isLocalEnv) {
      redirectUrl = new URL(next, origin);
    } else if (forwardedHost) {
      redirectUrl = new URL(next, `https://${forwardedHost}`);
    } else {
      redirectUrl = new URL(next, origin);
    }

    // 2. 리디렉션할 Response 객체를 '미리' 만듭니다.
    const response = NextResponse.redirect(redirectUrl);

    // 3. Supabase 클라이언트를 만들면서, 위에서 만든 response에 쿠키를 심도록 설정합니다.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // ★ 여기가 핵심: 만들어둔 response 객체에 쿠키를 설정합니다.
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // 4. 인증 코드를 세션으로 교환합니다. (이때 setAll이 실행되어 쿠키가 심어짐)
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 5. 쿠키가 심어진 그 response를 그대로 반환합니다.
      return response;
    }
  }

  // 로그인 실패 시 에러 페이지로 이동
  return NextResponse.redirect(new URL("/auth/login?error=auth_failed", origin));
}
