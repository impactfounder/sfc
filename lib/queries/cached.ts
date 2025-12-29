/**
 * 캐시된 쿼리 함수들
 * React의 cache()를 사용하여 동일 요청 내에서 쿼리 중복 호출을 방지합니다.
 * 서버 컴포넌트 간에 데이터를 공유할 때 사용합니다.
 */

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import type { UserWithProfile } from "@/lib/types/profile"

/**
 * 경량화된 프로필 타입 (헤더/사이드바용)
 */
type LightProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
  points: number
}

/**
 * 캐시된 사용자 프로필 조회 (경량화 버전)
 * 헤더, 사이드바, 히어로 섹션에 필요한 최소한의 필드만 조회합니다.
 * 동일 요청 내에서 여러 번 호출해도 한 번만 DB 쿼리를 실행합니다.
 */
export const getCachedUserProfile = cache(async (): Promise<UserWithProfile | null> => {
  const supabase = await createClient()

  try {
    // 세션 없으면 getUser() 호출 없이 즉시 반환 (비로그인 최적화)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return null
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return null
    }

    // 헤더/사이드바에 필요한 최소 필드만 조회 (5개 필드)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role, points")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("프로필 조회 오류:", profileError)
      return { user, profile: null }
    }

    return {
      user,
      profile: profile as LightProfile as any,
    }
  } catch (error) {
    console.error("getCachedUserProfile 오류:", error)
    return null
  }
})

/**
 * 캐시된 공지사항 조회 (최근 3개)
 */
export const getCachedAnnouncements = cache(async () => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      board_categories!inner(slug)
    `)
    .eq("board_categories.slug", "announcement")
    .order("created_at", { ascending: false })
    .limit(3)

  if (error || !data) {
    return []
  }

  return data.map((post: any) => ({
    id: post.id,
    title: post.title,
  }))
})
