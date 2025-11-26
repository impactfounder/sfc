import { requireAdmin } from "@/lib/auth/server"
import { AdminView } from "@/components/admin/admin-view"

export default async function AdminDashboard() {
  const { supabase, user, isMaster } = await requireAdmin()

  // Fetch all data in parallel
  const [usersResult, eventsResult, postsResult] = await Promise.all([
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

  return (
    <AdminView
      users={usersResult.data || []}
      events={eventsWithCounts}
      posts={postsResult.data || []}
      currentUserId={user.id}
      isMaster={isMaster}
    />
  )
}
