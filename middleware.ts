import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // auth 콜백은 그대로 통과
  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  // 보호 경로가 아니면 Supabase 호출 없이 통과
  const protectedPrefixes = ["/admin"];
  const isProtected = protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) {
    return NextResponse.next();
  }

  // 환경 변수 검증
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
    console.error('필요한 환경 변수:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');

    // 개발 환경에서는 middleware를 우회
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  개발 환경: 인증 없이 계속 진행합니다.');
      return NextResponse.next();
    }

    // 프로덕션에서는 에러 페이지로 리다이렉트
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
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

  // 핵심: 세션을 갱신하여 쿠키 수명을 연장합니다
  const { data: { user } } = await supabase.auth.getUser();

  // 관리자 페이지 접근 제어
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
