/**
 * 뱃지 관련 쿼리 함수
 * 뱃지 데이터 페칭 로직의 재사용성을 높이기 위한 유틸리티 함수들
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { VisibleBadge } from "@/lib/types/badges"

/**
 * 여러 사용자의 노출된 뱃지 정보를 한 번에 가져옵니다.
 * N+1 문제를 방지하기 위해 배치로 조회합니다.
 * @param supabase Supabase 클라이언트
 * @param userIds 사용자 ID 배열
 * @returns Map<userId, VisibleBadge[]> 형태의 뱃지 맵
 */
export async function getBadgesForUsers(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, VisibleBadge[]>> {
  const badgesMap = new Map<string, VisibleBadge[]>()

  if (userIds.length === 0) {
    return badgesMap
  }

  try {
    const { data: allBadgesData, error: badgesError } = await supabase
      .from("user_badges")
      .select(`
        user_id,
        badges:badge_id (
          icon,
          name
        )
      `)
      .in("user_id", userIds)
      .eq("is_visible", true)

    if (badgesError) {
      console.error("뱃지 로드 오류:", badgesError)
      return badgesMap
    }

    if (allBadgesData) {
      allBadgesData.forEach((ub) => {
        if (ub.badges && ub.user_id) {
          const badge = Array.isArray(ub.badges) ? ub.badges[0] : ub.badges
          const existing = badgesMap.get(ub.user_id) || []
          badgesMap.set(ub.user_id, [
            ...existing,
            { icon: badge?.icon, name: badge?.name },
          ])
        }
      })
    }
  } catch (error) {
    console.error("getBadgesForUsers 오류:", error)
  }

  return badgesMap
}

