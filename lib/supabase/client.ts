import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js"

// 싱글톤 패턴: 브라우저 환경에서 하나의 인스턴스만 생성
let supabaseClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  // 브라우저 환경에서만 싱글톤 적용 (서버 사이드에서는 매번 새로 생성)
  if (typeof window !== 'undefined') {
    if (!supabaseClient) {
      supabaseClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          },
          realtime: {
            params: {
              eventsPerSecond: 2,
            },
          },
        }
      )
    }
    return supabaseClient
  }

  // 서버 사이드에서는 매번 새로 생성 (서버 컴포넌트용)
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    }
  )
}
