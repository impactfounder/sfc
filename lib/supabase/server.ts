import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  // @supabase/ssr의 createServerClient를 사용하여 쿠키 자동 처리
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // 서버 컴포넌트에서는 쿠키를 설정할 수 없으므로 무시
            // 클라이언트 컴포넌트나 Route Handler에서만 설정 가능
          }
        },
      },
    }
  )

  // 세션 새로고침 시도 (만료된 토큰 자동 갱신)
  try {
    await supabase.auth.getSession()
  } catch (error) {
    // 세션 가져오기 실패는 무시 (익명 사용자로 처리)
  }

  return supabase
}
