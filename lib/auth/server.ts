import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isAdmin, isMasterAdmin } from "@/lib/utils"

/**
 * 로그인이 필수인 페이지에서 사용
 * 사용자가 로그인하지 않았으면 로그인 페이지로 리디렉션
 * @returns {Promise<{ user: User, supabase: SupabaseClient }>}
 */
export async function requireAuth() {
  const supabase = await createClient()
  
  // getUser를 사용하여 JWT 토큰 검증 (쿠키에서 자동으로 읽음)
  // getUser는 쿠키에서 access_token을 읽고 Supabase 서버에서 검증합니다
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // 인증 오류가 있거나 사용자가 없으면 로그인 페이지로 리디렉션
  if (error || !user) {
    // 디버깅을 위한 상세 로그 (프로덕션에서는 제거 가능)
    if (process.env.NODE_ENV === "development") {
      console.error("Auth error in requireAuth:", {
        error: error?.message,
        errorCode: error?.status,
        hasUser: !!user,
      })
    }
    redirect("/auth/login")
  }

  return { user, supabase }
}

/**
 * 관리자 권한이 필수인 페이지에서 사용
 * 사용자가 로그인하지 않았거나 관리자가 아니면 리디렉션
 * @returns {Promise<{ user: User, profile: Profile, supabase: SupabaseClient, isMaster: boolean }>}
 */
export async function requireAdmin() {
  const { user, supabase } = await requireAuth()

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    console.error("Profile fetch error:", profileError)
    redirect("/")
  }

  if (!isAdmin(profile.role, profile.email)) {
    redirect("/")
  }

  const isMaster = isMasterAdmin(profile.role, profile.email)

  return { user, profile, supabase, isMaster }
}

/**
 * 마스터 권한이 필수인 페이지에서 사용
 * 사용자가 로그인하지 않았거나 마스터가 아니면 리디렉션
 * @returns {Promise<{ user: User, profile: Profile, supabase: SupabaseClient }>}
 */
export async function requireMaster() {
  const { user, supabase } = await requireAuth()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (!profile || !isMasterAdmin(profile.role, profile.email)) {
    redirect("/admin")
  }

  return { user, profile, supabase }
}

/**
 * 선택적 사용자 정보 가져오기 (로그인하지 않아도 됨)
 * @returns {Promise<{ user: User | null, supabase: SupabaseClient }>}
 */
export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { user: user || null, supabase }
}

