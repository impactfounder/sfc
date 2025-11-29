import { requireAdmin } from "@/lib/auth/server"
import { AdminView } from "@/components/admin/admin-view"

export default async function AdminDashboard() {
  const { supabase, user, isMaster } = await requireAdmin()

  // Fetch all data in parallel
  const [usersResult, eventsResult, postsResult, badgesResult, pendingBadgesResult, categoriesResult, partnerApplicationsResult, badgeCategoriesResult] = await Promise.all([
    // Users: 전체 프로필 (최신순)
    supabase
      .from("profiles")
      .select("id, full_name, email, role, membership_tier, points, created_at")
      .order("created_at", { ascending: false }),
    
    // Events: 전체 이벤트 (최신순, 호스트 정보 포함)
    supabase
      .from("events")
      .select(`
        id,
        title,
        thumbnail_url,
        event_date,
        location,
        max_participants,
        created_at,
        profiles:created_by (
          id,
          full_name,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false }),
    
    // Posts: 전체 게시글 (최신순, 작성자 및 게시판 정보 포함)
    supabase
      .from("posts")
      .select(`
        id,
        title,
        created_at,
        visibility,
        profiles:author_id (
          id,
          full_name,
          avatar_url
        ),
        board_categories:board_category_id (
          id,
          name,
          slug
        )
      `)
      .order("created_at", { ascending: false }),
    
    // Badges: 전체 뱃지 목록 (관리자 페이지에서는 숨김 처리된 뱃지도 모두 표시, 필터링 없음)
    (async () => {
      try {
        // 먼저 is_active 필드 포함하여 시도
        let { data, error } = await supabase
          .from("badges")
          .select("id, name, icon, category, description, is_active")
          .order("category", { ascending: true })
          .order("name", { ascending: true })
        
        // is_active 필드가 없어서 에러가 발생한 경우, 필드 제외하고 재시도
        if (error && error.code === '42703') {
          console.warn("is_active 필드가 없습니다. 필드를 제외하고 재시도합니다.")
          const fallbackResult = await supabase
            .from("badges")
            .select("id, name, icon, category, description")
            .order("category", { ascending: true })
            .order("name", { ascending: true })
          
          if (fallbackResult.error) {
            console.error("Badges fallback query error:", fallbackResult.error)
            return { data: [], error: fallbackResult.error }
          }
          
          // is_active 필드가 없는 경우 기본값 true로 설정
          data = (fallbackResult.data || []).map(badge => ({ ...badge, is_active: true }))
          error = null
        } else if (error) {
          console.error("Badges query error:", error)
          return { data: [], error }
        }
        
        // is_active가 null이거나 undefined인 경우 기본값 true로 설정
        const processedData = (data || []).map(badge => ({ 
          ...badge, 
          is_active: badge.is_active !== false // null, undefined도 true로 처리
        }))
        
        return { data: processedData, error: null }
      } catch (err) {
        console.error("Badges query exception:", err)
        return { data: [], error: err }
      }
    })(),
    
    // Pending Badges: 대기 중인 뱃지 신청
    supabase
      .from("user_badges")
      .select(`
        id,
        status,
        evidence,
        created_at,
        profiles:user_id (
          id,
          full_name,
          email,
          avatar_url
        ),
        badges:badge_id (
          id,
          name,
          icon
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    
    // Categories: 전체 카테고리 목록
    supabase
      .from("categories")
      .select("*")
      .order("type", { ascending: true })
      .order("created_at", { ascending: true }),
    
    // Partner Applications: 파트너스 신청 목록 (신청자 정보 조인)
    (async () => {
      try {
        const { data, error } = await supabase
          .from("partner_applications")
          .select(`
            id,
            created_at,
            status,
            company_name,
            current_usage,
            partner_name,
            profiles:user_id (
              id,
              full_name,
              email
            )
          `)
          .order("created_at", { ascending: false })
        
        if (error) {
          // 테이블이 없을 경우 빈 배열 반환
          if (error.code === "42P01") {
            console.warn("partner_applications 테이블이 없습니다.")
            return { data: [], error: null }
          }
          return { data: [], error }
        }
        
        return { data: data || [], error: null }
      } catch (err) {
        console.error("Partner applications query error:", err)
        return { data: [], error: err }
      }
    })(),
    
    // Badge Categories: 뱃지 카테고리 순서 정보
    (async () => {
      try {
        const { data, error } = await supabase
          .from("badge_categories")
          .select("category_value, category_label, sort_order")
          .order("sort_order", { ascending: true })
        
        if (error) {
          // 테이블이 없을 경우 빈 배열 반환
          if (error.code === "42P01") {
            console.warn("badge_categories 테이블이 없습니다.")
            return { data: [], error: null }
          }
          return { data: [], error }
        }
        
        return { data: data || [], error: null }
      } catch (err) {
        console.error("Badge categories query error:", err)
        return { data: [], error: null }
      }
    })(),
  ])

  // Fetch registration counts for events
  const eventsWithCounts = await Promise.all(
    (eventsResult.data || []).map(async (event) => {
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id)

      return {
        ...event,
        participantCount: count || 0,
      }
    })
  )

  // badgesResult 처리 (에러 발생 시 빈 배열 반환)
  let badgesData: any[] = []
  if (badgesResult && typeof badgesResult === 'object' && 'data' in badgesResult) {
    badgesData = badgesResult.data || []
  } else if (Array.isArray(badgesResult)) {
    badgesData = badgesResult
  }

  return (
    <AdminView
      users={usersResult.data || []}
      events={eventsWithCounts}
      posts={postsResult.data || []}
      badges={badgesData}
      pendingBadges={pendingBadgesResult.data || []}
      categories={categoriesResult.data || []}
      partnerApplications={partnerApplicationsResult.data || []}
      badgeCategories={badgeCategoriesResult.data || []}
      currentUserId={user.id}
      isMaster={isMaster}
    />
  )
}
