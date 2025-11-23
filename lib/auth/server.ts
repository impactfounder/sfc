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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // 인증 오류가 있거나 사용자가 없으면 로그인 페이지로 리디렉션
  if (error || !user) {
    console.error("Auth error in requireAuth:", error)
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

