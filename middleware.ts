import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // auth 콜백은 그대로 통과
  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  // 환경 변수 검증
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // 환경 변수 없으면 그냥 통과
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // getSession()으로 쿠키 갱신 (DB 호출 없음, 로컬 JWT 검증만)
  const { data: { session } } = await supabase.auth.getSession();

  // admin 라우트만 getUser()로 실제 DB 검증 (역할 확인 필요)
  let user = session?.user ?? null;
  if (pathname.startsWith("/admin")) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  // 관리자 페이지 접근 제어
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // 관리자 역할 검증
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin" || profile?.role === "master";
    if (!isAdmin) {
      // 관리자가 아니면 홈으로 리다이렉트
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
