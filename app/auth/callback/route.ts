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

    if (error) {
      console.error("[auth/callback] Error exchanging code:", error.message);
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, origin));
    }

    // 5. [신규 가입 알림] 새 유저 확인 및 마스터에게 알림 발송
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 프로필 정보 조회 (last_login_date 확인)
        const { data: profile } = await supabase
          .from("profiles")
          .select("last_login_date, full_name, email")
          .eq("id", user.id)
          .single();

        // last_login_date가 없으면 '최초 로그인'으로 간주하여 알림 발송
        if (profile && !profile.last_login_date) {
          // 마스터 계정 조회
          const { data: masters } = await supabase
            .from("profiles")
            .select("id")
            .eq("role", "master");

          if (masters && masters.length > 0) {
            const userName = profile.full_name || profile.email?.split('@')[0] || "알 수 없음";
            
            // 알림 데이터 생성
            const notifications = masters.map(master => ({
              user_id: master.id,
              type: "new_member",
              title: "새로운 멤버 가입",
              message: `새로운 멤버 '${userName}'님이 가입했습니다. 환영해주세요!`,
              related_post_id: null,
              related_event_id: null,
              actor_id: user.id,
              is_read: false
            }));

            // 알림 일괄 전송
            await supabase.from("notifications").insert(notifications);
          }
        }

        // 로그인 시간 업데이트
        await supabase
          .from("profiles")
          .update({ last_login_date: new Date().toISOString() })
          .eq("id", user.id);
      }
    } catch (err) {
      console.error("[auth/callback] Notification error:", err);
      // 알림 실패가 로그인 흐름을 방해하지 않도록 예외 무시
    }

    // 6. 쿠키가 심어진 그 response를 그대로 반환합니다.
    return response;
  }

  // code가 없으면 로그인 페이지로 이동
  return NextResponse.redirect(new URL("/auth/login?error=no_code", origin));
}
