/**
 * 프로필 관련 쿼리 함수
 * 프로필 데이터 페칭 로직의 재사용성을 높이기 위한 유틸리티 함수들
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { User, Profile, UserWithProfile } from "@/lib/types/profile"

/**
 * 현재 로그인한 사용자의 프로필 정보를 가져옵니다.
 * @param supabase Supabase 클라이언트
 * @returns 사용자와 프로필 정보를 포함한 객체, 또는 null (로그인하지 않은 경우)
 */
export async function getCurrentUserProfile(
  supabase: SupabaseClient
): Promise<UserWithProfile | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, bio, role, points, company, position, introduction, is_profile_public, membership_tier, last_login_date, created_at, updated_at")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("프로필 조회 오류:", profileError)
      return { user, profile: null }
    }

    return {
      user,
      profile: profile as Profile | null,
    }
  } catch (error) {
    console.error("getCurrentUserProfile 오류:", error)
    return null
  }
}

