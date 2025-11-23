import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();

    // 1. 최종 리디렉션 URL 결정
    const forwardedHost = request.headers.get("x-forwarded-host"); // Vercel 배포 환경 대응
    const isLocalEnv = process.env.NODE_ENV === "development";

    let redirectUrl: URL;
    if (isLocalEnv) {
      redirectUrl = new URL(next, origin);
    } else if (forwardedHost) {
      redirectUrl = new URL(next, `https://${forwardedHost}`);
    } else {
      redirectUrl = new URL(next, origin);
    }

    // 2. 쿠키를 담을 Response 객체 생성 (딱 한 번만 생성)
    const response = NextResponse.redirect(redirectUrl);

    // 3. Supabase 클라이언트 생성 및 쿠키 설정 연결
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // 여기서 위에서 만든 response 객체에 쿠키를 심습니다.
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // 4. 코드 교환 (이 과정에서 setAll이 실행되어 response에 쿠키가 들어감)
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 5. 쿠키가 포함된 response 반환
      return response;
    }
  }

  // 로그인 실패 시 에러 페이지로 이동
  return NextResponse.redirect(new URL("/auth/login?error=auth_failed", origin));
}
