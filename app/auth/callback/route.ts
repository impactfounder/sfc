import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  // 1. 배포 환경(프로덕션)이면 무조건 https://seoulfounders.club 사용
  const isDevelopment = process.env.NODE_ENV === "development";
  const origin = isDevelopment ? requestUrl.origin : "https://seoulfounders.club";

  // 2. 리다이렉트 응답 객체 미리 생성
  const response = NextResponse.redirect(`${origin}${next}`);

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // ✅ 핵심: response 객체에 쿠키 설정 + options 그대로 전달
              // Supabase가 httpOnly/Secure 등을 자동 관리하므로 덮어쓰지 않음
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log("🔥🔥🔥 [auth/callback] 로그인 성공 & 쿠키 설정 완료");

      // [신규 가입 알림 로직]
      try {
        const user = data.user;
        if (user) {
          const adminSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => [], setAll: () => {} } }
          );

          const { data: profile } = await adminSupabase
            .from("profiles")
            .select("last_login_date, full_name, email")
            .eq("id", user.id)
            .single();

          if (profile && !profile.last_login_date) {
            const { data: masters } = await adminSupabase
              .from("profiles")
              .select("id")
              .eq("role", "master");

            if (masters && masters.length > 0) {
              const userName = profile.full_name || profile.email?.split('@')[0] || "알 수 없음";
              const notifications = masters.map(master => ({
                user_id: master.id,
                type: "new_member",
                title: "새로운 멤버 가입",
                message: `새로운 멤버 '${userName}'님이 가입했습니다.`,
                related_post_id: null,
                related_event_id: null,
                actor_id: user.id,
                is_read: false
              }));
              await adminSupabase.from("notifications").insert(notifications);
            }
          }

          await adminSupabase
            .from("profiles")
            .update({ last_login_date: new Date().toISOString() })
            .eq("id", user.id);
        }
      } catch (err) {
        console.error("[auth/callback] Notification error:", err);
      }

      // 3. 쿠키가 담긴 response 반환
      return response;
    } else {
      console.error("🔥🔥🔥 [auth/callback] 에러:", error.message);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_code_error`);
}
