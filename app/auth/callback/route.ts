import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  // 현재 요청이 들어온 URL(origin)을 그대로 가져옵니다.
  // 이렇게 해야 사용자가 'seoulfounders.club'으로 들어왔으면 쿠키도 그 도메인으로 구워집니다.
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("🔥🔥🔥 [auth/callback] 로그인 실패:", error.message);
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`);
    }

    console.log("🔥🔥🔥 [auth/callback] 로그인 성공:", { userId: data.user?.id, email: data.user?.email });

    // 로그인 성공 시 캐시 무효화
    revalidatePath("/", "layout");

    // [신규 가입 알림] 새 유저 확인 및 마스터에게 알림 발송
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

    // 중요: 무조건 현재 origin을 사용하여 리디렉션합니다.
    // x-forwarded-host 로직 제거 -> 도메인 불일치 원인 제거
    return NextResponse.redirect(`${origin}${next}`);
  }

  // code가 없으면 로그인 페이지로 이동
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
}
