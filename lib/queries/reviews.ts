import { SupabaseClient } from "@supabase/supabase-js"
import type { ReviewForDisplay } from "@/lib/types/reviews"

/**
 * 호스트(이벤트 생성자)가 받은 모든 후기 조회
 * @param supabase Supabase 클라이언트
 * @param hostId 호스트 사용자 ID
 * @param limit 최대 조회 개수 (기본값: 50)
 */
export async function getReviewsForHost(
  supabase: SupabaseClient,
  hostId: string,
  limit: number = 50
): Promise<ReviewForDisplay[]> {
  try {
    // 1. 호스트가 만든 이벤트 ID들 조회
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id")
      .eq("created_by", hostId)

    if (eventsError) {
      console.error("🚨 [getReviewsForHost] Events query error:", eventsError)
      return []
    }

    if (!events || events.length === 0) {
      return []
    }

    const eventIds = events.map(e => e.id)

    // 2. 해당 이벤트들의 공개 후기 조회
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .in("event_id", eventIds)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (reviewsError) {
      console.error("🚨 [getReviewsForHost] Reviews query error:", reviewsError)
      return []
    }

    if (!reviews || reviews.length === 0) {
      return []
    }

    // 3. Profiles & Events 매핑 (N+1 방지용 배치 조회)
    const userIds = [...new Set(reviews.map(r => r.user_id).filter(Boolean))]
    const eventIdsForReviews = [...new Set(reviews.map(r => r.event_id).filter(Boolean))]

    const [profilesResult, eventsDataResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, company, position")
        .in("id", userIds),
      supabase
        .from("events")
        .select("id, title, event_date, thumbnail_url")
        .in("id", eventIdsForReviews)
    ])

    const profileMap = new Map(
      (profilesResult.data || []).map(p => [p.id, p])
    )
    const eventMap = new Map(
      (eventsDataResult.data || []).map(e => [e.id, e])
    )

    // 4. 데이터 조합
    return reviews
      .map((review): ReviewForDisplay | null => {
        const event = eventMap.get(review.event_id)
        if (!event) return null

        const profile = profileMap.get(review.user_id)

        return {
          id: review.id,
          user_id: review.user_id,
          event_id: review.event_id,
          rating: review.rating,
          keywords: review.keywords || [],
          one_liner: review.one_liner,
          detail_content: review.detail_content,
          images: review.images || [],
          is_best: review.is_best,
          is_public: review.is_public,
          created_at: review.created_at,
          updated_at: review.updated_at,
          profiles: profile ? {
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            role: profile.role,
            company: profile.company,
            position: profile.position
          } : null,
          events: {
            id: event.id,
            title: event.title,
            event_date: event.event_date,
            thumbnail_url: event.thumbnail_url
          }
        }
      })
      .filter((item): item is ReviewForDisplay => item !== null)

  } catch (error) {
    console.error("🚨 [getReviewsForHost] Unexpected error:", error)
    return []
  }
}

/**
 * 전체 공개 후기 조회 (필터/정렬 지원)
 * @param supabase Supabase 클라이언트
 * @param options 옵션 (정렬, 필터, 페이징)
 */
export async function getAllReviewsWithFilters(
  supabase: SupabaseClient,
  options: {
    sortBy?: "latest" | "popular"
    photoOnly?: boolean
    limit?: number
    offset?: number
  } = {}
): Promise<ReviewForDisplay[]> {
  const { sortBy = "latest", photoOnly = false, limit = 30, offset = 0 } = options

  try {
    // 1. Reviews 조회
    let query = supabase
      .from("reviews")
      .select("*")
      .eq("is_public", true)

    // 포토 후기만 필터링
    if (photoOnly) {
      // images 배열이 비어있지 않은 후기만
      query = query.not("images", "eq", "{}")
    }

    // 정렬
    if (sortBy === "latest") {
      query = query.order("created_at", { ascending: false })
    } else {
      // popular: is_best 우선, 그 다음 created_at
      query = query
        .order("is_best", { ascending: false })
        .order("created_at", { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data: reviews, error } = await query

    if (error) {
      console.error("🚨 [getAllReviewsWithFilters] Query error:", error)
      return []
    }

    if (!reviews || reviews.length === 0) {
      return []
    }

    // 2. Profiles & Events 배치 조회
    const userIds = [...new Set(reviews.map(r => r.user_id).filter(Boolean))]
    const eventIds = [...new Set(reviews.map(r => r.event_id).filter(Boolean))]

    const [profilesResult, eventsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, company, position")
        .in("id", userIds),
      supabase
        .from("events")
        .select("id, title, event_date, thumbnail_url")
        .in("id", eventIds)
    ])

    const profileMap = new Map(
      (profilesResult.data || []).map(p => [p.id, p])
    )
    const eventMap = new Map(
      (eventsResult.data || []).map(e => [e.id, e])
    )

    // 3. 데이터 조합
    return reviews
      .map((review): ReviewForDisplay | null => {
        const event = eventMap.get(review.event_id)
        if (!event) return null

        const profile = profileMap.get(review.user_id)

        return {
          id: review.id,
          user_id: review.user_id,
          event_id: review.event_id,
          rating: review.rating,
          keywords: review.keywords || [],
          one_liner: review.one_liner,
          detail_content: review.detail_content,
          images: review.images || [],
          is_best: review.is_best,
          is_public: review.is_public,
          created_at: review.created_at,
          updated_at: review.updated_at,
          profiles: profile ? {
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            role: profile.role,
            company: profile.company,
            position: profile.position
          } : null,
          events: {
            id: event.id,
            title: event.title,
            event_date: event.event_date,
            thumbnail_url: event.thumbnail_url
          }
        }
      })
      .filter((item): item is ReviewForDisplay => item !== null)

  } catch (error) {
    console.error("🚨 [getAllReviewsWithFilters] Unexpected error:", error)
    return []
  }
}
