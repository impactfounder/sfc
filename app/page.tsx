import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getLatestPosts, getLatestReviews } from "@/lib/queries/posts"
import { getCurrentUserProfile } from "@/lib/queries/profiles"
import { getBadgesForUsers } from "@/lib/queries/badges"
import { HomePageClient } from "@/components/home/home-page-client"
import SidebarProfile from "@/components/sidebar-profile"
import type { EventCardEvent } from "@/components/ui/event-card"
import type { PostForDisplay, ReviewForDisplay, BoardCategory } from "@/lib/types/posts"
import type { VisibleBadge } from "@/lib/types/badges"


export default async function HomePage() {
  const supabase = await createClient()

  // 서버에서 초기 데이터 가져오기
  const userProfile = await getCurrentUserProfile(supabase)
  const user = userProfile?.user || null
  const profile = userProfile?.profile || null

  // 병렬 데이터 페칭
  const [
    eventsResult,
    postsResult,
    eventRequestsResult,
    reviewsResult,
    boardCategoriesResult
  ] = await Promise.all([
    // 이벤트
    (async () => {
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
          .limit(6)
        
        if (data) {
          return data.map((event) => ({
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
          })) as EventCardEvent[]
        }
        return [] as EventCardEvent[]
      } catch (error) {
        console.error('이벤트 로드 오류:', error)
        return [] as EventCardEvent[]
      }
    })(),
    // 게시글
    (async () => {
      try {
        const { data } = await supabase
          .from("posts")
          .select(`
            id, 
            title, 
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
          .limit(15)
        
        if (data) {
          // 뱃지 가져오기 (재사용 함수 사용)
          const authorIds = [...new Set(data.map((post) => post.author_id).filter(Boolean) as string[])]
          const badgesMap = await getBadgesForUsers(supabase, authorIds)

          return data.map((post) => {
            let slug = post.board_categories?.slug
            if (slug === "free-board") slug = "free"
            const visibleBadges = post.author_id ? (badgesMap.get(post.author_id) || []) : []
            return {
              id: post.id,
              title: post.title,
              content: null, // 리스트에서는 본문 전체가 필요 없으므로 null로 설정
              created_at: post.created_at,
              visibility: 'public' as const,
              likes_count: 0,
              comments_count: 0,
              profiles: post.profiles ? {
                id: post.profiles.id,
                full_name: post.profiles.full_name,
              } : null,
              board_categories: post.board_categories ? {
                name: post.board_categories.name,
                slug: slug || post.board_categories.slug,
              } : null,
              communities: null,
              // visible_badges는 PostForDisplay 타입에 없으므로 타입 단언 사용
              visible_badges: visibleBadges,
            } as PostForDisplay & { visible_badges?: VisibleBadge[] }
          })
        }
        return [] as PostForDisplay[]
      } catch (error) {
        console.error('게시글 로드 오류:', error)
        return [] as PostForDisplay[]
      }
    })(),
    // 열어주세요
    (async () => {
      try {
        return await getLatestPosts(supabase, 6, 'event-requests')
      } catch (error) {
        console.error('열어주세요 로드 오류:', error)
        return [] as PostForDisplay[]
      }
    })(),
    // 후기
    (async () => {
      try {
        return await getLatestReviews(supabase, 10)
      } catch (error) {
        console.error('후기 로드 오류:', error)
        return [] as ReviewForDisplay[]
      }
    })(),
    // 카테고리
    (async () => {
      try {
        const { data } = await supabase
          .from("board_categories")
          .select("id, name, slug")
          .in("slug", ["free", "vangol", "hightalk", "free-board"])
          .eq("is_active", true)
          .order("order_index", { ascending: true })
        
        if (data) {
          return data.map((cat) => {
            if (cat.slug === "free-board") return { ...cat, slug: "free" }
            return cat
          }) as BoardCategory[]
        }
        return [] as BoardCategory[]
      } catch (error) {
        console.error('카테고리 로드 오류:', error)
        return [] as BoardCategory[]
      }
    })()
  ]);

  const events = eventsResult;
  const posts = postsResult;
  const eventRequests = eventRequestsResult;
  const reviews = reviewsResult;
  const boardCategories = boardCategoriesResult;

  return (
    <HomePageClient
      sidebarProfile={
        <Suspense fallback={<div className="px-4 pb-4 min-h-[140px] flex flex-col justify-center"><div className="h-10 w-full bg-slate-100 rounded-full animate-pulse" /></div>}>
          <SidebarProfile />
        </Suspense>
      }
      initialEvents={events}
      initialPosts={posts}
      initialEventRequests={eventRequests}
      initialReviews={reviews}
      initialBoardCategories={boardCategories}
      initialUser={user}
      initialProfile={profile}
    />
  )
}
