import { createClient } from "@/lib/supabase/server"
import { getLatestPosts, getLatestReviews } from "@/lib/queries/posts"
import { HomePageClient } from "@/components/home/home-page-client"
import AnnouncementBanner from "@/components/home/announcement-banner"


export default async function HomePage() {
  const supabase = await createClient()

  // 서버에서 초기 데이터 가져오기
  const { data: { user } } = await supabase.auth.getUser()

  // 프로필 정보 가져오기
  let profile = null
  if (user) {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      profile = profileData || null
    } catch (error) {
      console.error('프로필 로드 오류:', error)
    }
  }

  // 공지사항
  let announcement = null
  try {
    const { data } = await supabase
      .from("posts")
      .select(`id, title, board_categories!inner(slug)`)
      .eq("board_categories.slug", "announcement")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) {
      announcement = { id: data.id, title: data.title }
    }
  } catch (error) {
    console.error('공지사항 로드 오류:', error)
  }

  // 이벤트
  let events: any[] = []
  try {
    const { data } = await supabase
      .from("events")
      .select(`
        *,
        profiles:created_by (
          id,
          full_name,
          avatar_url,
          bio
        ),
        event_registrations(count)
      `)
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(9)
    
    if (data) {
      events = data.map((event: any) => ({
        id: event.id,
        title: event.title,
        thumbnail_url: event.thumbnail_url,
        event_date: event.event_date,
        event_time: null,
        location: event.location,
        max_participants: event.max_participants,
        current_participants: event.event_registrations?.[0]?.count || 0,
        host_name: event.profiles?.full_name || "알 수 없음",
        host_avatar_url: event.profiles?.avatar_url || null,
        host_bio: event.profiles?.bio || null,
        event_type: event.event_type || 'networking',
      }))
    }
  } catch (error) {
    console.error('이벤트 로드 오류:', error)
  }

  // 게시글
  let posts: any[] = []
  try {
    const { data } = await supabase
      .from("posts")
      .select(`
        id, 
        title, 
        content, 
        created_at, 
        author_id,
        profiles:author_id(
          id,
          full_name
        ), 
        board_categories!inner(name, slug)
      `)
      .in("board_categories.slug", ["free", "vangol", "hightalk", "free-board"])
      .neq("board_categories.slug", "announcement")
      .order("created_at", { ascending: false })
      .limit(50)
    
    if (data) {
      // 뱃지 가져오기
      const authorIds = [...new Set(data.map((post: any) => post.author_id).filter(Boolean))]
      const badgesMap = new Map<string, Array<{ icon: string; name: string }>>()
      
      if (authorIds.length > 0) {
        try {
          const { data: allBadgesData } = await supabase
            .from("user_badges")
            .select(`
              user_id,
              badges:badge_id (
                icon,
                name
              )
            `)
            .in("user_id", authorIds)
            .eq("is_visible", true)
          
          if (allBadgesData) {
            allBadgesData.forEach((ub: any) => {
              if (ub.badges && ub.user_id) {
                const existing = badgesMap.get(ub.user_id) || []
                badgesMap.set(ub.user_id, [...existing, { icon: ub.badges.icon, name: ub.badges.name }])
              }
            })
          }
        } catch (error) {
          console.error('뱃지 로드 오류:', error)
        }
      }

      posts = data.map((post: any) => {
        let slug = post.board_categories?.slug
        if (slug === "free-board") slug = "free"
        const visibleBadges = post.author_id ? (badgesMap.get(post.author_id) || []) : []
        return {
          ...post,
          board_categories: { ...post.board_categories, slug },
          visible_badges: visibleBadges,
        }
      })
    }
  } catch (error) {
    console.error('게시글 로드 오류:', error)
  }

  // 열어주세요
  let eventRequests: any[] = []
  try {
    eventRequests = await getLatestPosts(supabase, 6, 'event-requests')
  } catch (error) {
    console.error('열어주세요 로드 오류:', error)
  }

  // 후기
  let reviews: any[] = []
  try {
    reviews = await getLatestReviews(supabase, 10)
  } catch (error) {
    console.error('후기 로드 오류:', error)
  }

  // 카테고리
  let boardCategories: any[] = []
  try {
    const { data } = await supabase
      .from("board_categories")
      .select("id, name, slug")
      .in("slug", ["free", "vangol", "hightalk", "free-board"])
      .eq("is_active", true)
      .order("order_index", { ascending: true })
    
    if (data) {
      boardCategories = data.map((cat) => {
        if (cat.slug === "free-board") return { ...cat, slug: "free" }
        return cat
      })
    }
  } catch (error) {
    console.error('카테고리 로드 오류:', error)
  }

  return (
    <HomePageClient
      initialAnnouncement={announcement}
      initialEvents={events}
      initialPosts={posts}
      initialEventRequests={eventRequests}
      initialReviews={reviews}
      initialBoardCategories={boardCategories}
      initialUser={user}
      initialProfile={profile}
    >
      <AnnouncementBanner />
    </HomePageClient>
  )
}
