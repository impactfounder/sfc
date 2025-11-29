import { createClient } from "@supabase/supabase-js"

/**
 * Service Role Key를 사용하는 관리자 클라이언트
 * RLS 정책을 우회하여 모든 데이터에 접근 가능
 * 주의: 이 클라이언트는 서버 사이드에서만 사용해야 합니다.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set")
  }

  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Please add it to your environment variables.")
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

