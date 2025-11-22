import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { HomePageContent } from "./home-page-content"
import { createClient } from "@/lib/supabase/server"
import { EventCardEvent } from "@/components/ui/event-card"

type BoardCategory = {
  id: string
  name: string
  slug: string
}

type Post = {
  id: string
  title: string
  content?: string | null
  created_at: string
  board_categories?: {
    name?: string | null
    slug?: string | null
  } | null
  profiles?: {
    full_name?: string | null
  } | null
}

type Announcement = {
  id: string
  title: string
}

export default async function HomePage() {
  const supabase = await createClient()

  // 디버깅: 환경 변수 확인 (서버 로그에만 출력)
  if (process.env.NODE_ENV === 'development') {
    console.log("=== HomePage Debug ===")
    console.log("Supabase URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("Anon Key exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  }

  // 카테고리 가져오기
  const { data: categoriesData, error: categoriesError } = await supabase
    .from("board_categories")
    .select("id, name, slug")
    .in("slug", ["free", "vangol", "hightalk", "free-board", "bangol", "hightalk"])
    .eq("is_active", true)
    .order("order_index", { ascending: true })

  if (categoriesError) {
    console.error("Categories error:", categoriesError)
  }

  const boardCategories: BoardCategory[] = categoriesData
    ? categoriesData.map((cat) => {
        if (cat.slug === "free-board") return { ...cat, slug: "free" }
        if (cat.slug === "bangol") return { ...cat, slug: "vangol" }
        return cat
      })
    : []

  // 공지사항 가져오기
  const { data: announcementData, error: announcementError } = await supabase
    .from("posts")
    .select(`id, title, board_categories!inner(slug)`)
    .eq("board_categories.slug", "announcement")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (announcementError) {
    console.error("Announcement error:", announcementError)
  }

  const announcement: Announcement | null = announcementData
    ? { id: announcementData.id, title: announcementData.title }
    : null

  // 이벤트 가져오기 (최신 9개 & bio 포함) - 인증 없이도 가져오기
  const { data: eventsData, error: eventsError } = await supabase
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

  if (eventsError) {
    console.error("Events error:", {
      message: eventsError.message,
      details: eventsError.details,
      hint: eventsError.hint,
      code: eventsError.code
    })
  }

  // 디버깅: 데이터가 없는 경우 로그 출력
  if (!eventsError && (!eventsData || eventsData.length === 0)) {
    console.log("Events query succeeded but returned empty array")
  }

  const events: EventCardEvent[] = eventsData
    ? eventsData.map((event: any) => ({
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
      }))
    : []

  // 게시글 가져오기 - 인증 없이도 가져오기
  // 에러가 발생하면 빈 배열 반환하도록 안전하게 처리
  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select(`id, title, content, created_at, profiles:author_id(full_name), board_categories!inner(name, slug)`)
    .in("board_categories.slug", ["free", "vangol", "hightalk", "free-board", "bangol", "hightalk"])
    .neq("board_categories.slug", "announcement")
    .order("created_at", { ascending: false })
    .limit(50)

  if (postsError) {
    console.error("Posts query error:", {
      message: postsError.message,
      details: postsError.details,
      hint: postsError.hint,
      code: postsError.code
    })
  }

  // 디버깅: 데이터가 없는 경우 로그 출력 (프로덕션에서도 출력)
  if (!postsError && (!postsData || postsData.length === 0)) {
    console.log("⚠️ Posts query succeeded but returned empty array")
    
    // 추가 확인: 카테고리 연결 없는 게시글 확인
    const { data: allPosts, error: allPostsError } = await supabase
      .from("posts")
      .select("id, title, board_category_id")
      .limit(5)
    
    if (allPostsError) {
      console.error("Error fetching all posts:", allPostsError.message)
    } else {
      console.log("Sample posts (with board_category_id):", allPosts?.length || 0, "posts found")
    }
  }

  const posts: Post[] = postsData
    ? postsData.map((post: any) => {
        let slug = post.board_categories?.slug
        if (slug === "free-board") slug = "free"
        if (slug === "bangol") slug = "vangol"
        return { ...post, board_categories: { ...post.board_categories, slug } }
      })
    : []

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MobileHeader />
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <HomePageContent
        announcement={announcement}
        events={events}
        posts={posts}
        boardCategories={boardCategories}
      />
    </div>
  )
}
