import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  // 개발 환경인지 확인
  const isDevelopment = process.env.NODE_ENV === "development";

  // 1. 리디렉션 Origin 설정 (커스텀 도메인 강제)
  const origin = isDevelopment ? requestUrl.origin : "https://seoulfounders.club";

  if (code) {
    const cookieStore = await cookies();

    // 2. 쿠키 옵션을 명시적으로 설정한 클라이언트 생성
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
              cookieStore.set(name, value, {
                ...options,
                // Vercel 배포 환경에서 필수적인 옵션들 강제 적용
                sameSite: 'lax',
                secure: !isDevelopment, // 프로덕션에서는 무조건 Secure
                httpOnly: true,
                path: '/', // 모든 경로에서 쿠키 유효
              });
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log("🔥🔥🔥 [auth/callback] 세션 교환 및 쿠키 설정 완료:", { userId: data.user?.id });

      // 3. 캐시 초기화
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

      // 4. 절대 경로로 리디렉션 (Origin 강제)
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("🔥🔥🔥 [auth/callback] 로그인 에러:", error.message);
    }
  }

  // 에러 발생 시
  return NextResponse.redirect(`${origin}/auth/login?error=auth_code_error`);
}
