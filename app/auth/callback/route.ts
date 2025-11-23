import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const response = NextResponse.redirect(new URL("/", requestUrl.origin));
    
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
                  sameSite: options?.sameSite ?? "lax",
                  path: options?.path ?? "/",
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
      return NextResponse.redirect(new URL("/auth/login?error=auth_failed", requestUrl.origin));
    }

    // 세션이 성공적으로 설정되었는지 확인
    if (!data.session) {
      console.error("No session after exchangeCodeForSession");
      return NextResponse.redirect(new URL("/auth/login?error=no_session", requestUrl.origin));
    }

    return response;
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
