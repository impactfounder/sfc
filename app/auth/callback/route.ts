import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  // 1. 리디렉션할 기본 오리진 설정
  // Vercel 배포 환경에서는 request.url이 http로 인식될 수 있어 https로 강제 변환이 필요할 수 있습니다.
  let origin = requestUrl.origin;

  // x-forwarded-host 헤더가 있다면(Vercel 등 프록시 환경), 그 호스트를 신뢰하여 origin 재구성
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocal = process.env.NODE_ENV === 'development';

  if (forwardedHost && !isLocal) {
    // 프로덕션에서는 무조건 https 사용
    origin = `https://${forwardedHost}`;
  }

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

    if (!error) {
      console.log("🔥🔥🔥 [auth/callback] 로그인 성공:", { userId: data.user?.id, email: data.user?.email });

      // 로그인 성공 시 메인 페이지 캐시 무효화 (상단 헤더 로그인 상태 갱신을 위해)
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

      // 2. 최종 리디렉션 생성
      // 여기서 origin은 위에서 보정한 https://seoulfounders.club 형태가 됩니다.
      const redirectUrl = new URL(next, origin);

      console.log(`🔥🔥🔥 [auth/callback] 리디렉션: ${redirectUrl.toString()}`);

      return NextResponse.redirect(redirectUrl);
    } else {
      console.error("🔥🔥🔥 [auth/callback] 세션 교환 에러:", error.message);
    }
  }

  // 에러 발생 시 로그인 페이지로 이동
  return NextResponse.redirect(`${origin}/auth/login?error=auth_code_error`);
}
