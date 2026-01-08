"use client"

import { useEffect, useMemo, useState, useRef, useCallback, ReactNode, Suspense } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { NewEventForm } from "@/components/new-event-form"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { HeroSection } from "@/components/home/hero-section"
import { EventsSection } from "@/components/home/events-section"
import { PostsSection } from "@/components/home/posts-section"
import { ReviewsSection } from "@/components/home/reviews-section"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { EventCardEvent } from "@/components/ui/event-card"
import { getLatestPosts, getLatestReviews } from "@/lib/queries/posts"
import { getCurrentUserProfile } from "@/lib/queries/profiles"
import { getBadgesForUsers } from "@/lib/queries/badges"
import type { PostForDisplay, ReviewForDisplay, BoardCategory } from "@/lib/types/posts"
import type { User, Profile } from "@/lib/types/profile"
import type { VisibleBadge } from "@/lib/types/badges"

type Post = PostForDisplay & {
  visible_badges?: VisibleBadge[]
}

type HomePageClientProps = {
  children?: ReactNode
  sidebarProfile?: ReactNode
  initialEvents?: EventCardEvent[]
  initialPosts?: Post[]
  initialReviews?: ReviewForDisplay[]
  initialBoardCategories?: BoardCategory[]
  initialUser?: User | null
  initialProfile?: Profile | null
}

export function HomePageClient({
  children,
  sidebarProfile,
  initialEvents = [],
  initialPosts = [],
  initialReviews = [],
  initialBoardCategories = [],
  initialUser = null,
  initialProfile = null,
}: HomePageClientProps) {
  const [selectedBoard, setSelectedBoard] = useState<string>("all")
  const [events, setEvents] = useState<EventCardEvent[]>(initialEvents)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [reviews, setReviews] = useState<ReviewForDisplay[]>(initialReviews)
  const [boardCategories, setBoardCategories] = useState<BoardCategory[]>(initialBoardCategories)
  const [user, setUser] = useState<User | null>(initialUser || null)
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null)
  const userRef = useRef<User | null>(initialUser || null)

  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  // fetchData를 useCallback으로 감싸서 재사용 가능하게 함
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      userRef.current = user

      // user가 존재할 경우, profiles 테이블에서 최신 프로필 정보를 가져옴
      const userProfile = await getCurrentUserProfile(supabase)
      if (userProfile) {
        setUser(userProfile.user)
        setProfile(userProfile.profile)
        userRef.current = userProfile.user
      } else {
        setUser(null)
        setProfile(null)
        userRef.current = null
      }

      // 각 쿼리를 독립적으로 처리
      let categoriesData: BoardCategory[] = []
      let eventsData: EventCardEvent[] = []
      let postsData: Post[] = []
      let reviewsData: ReviewForDisplay[] = []

      // 1. 카테고리
      try {
        const { data, error } = await supabase
          .from("board_categories")
          .select("id, name, slug")
          .in("slug", ["free", "vangol", "hightalk", "free-board"])
          .eq("is_active", true)
          .order("order_index", { ascending: true })

        if (!error && data) {
          categoriesData = data.map((cat) => {
            if (cat.slug === "free-board") return { ...cat, slug: "free" }
            return cat
          }) as BoardCategory[]
        }
      } catch (error) {
        console.error('카테고리 로드 오류:', error)
        categoriesData = []
      }

      // 2. 이벤트
      try {
        const { data, error } = await supabase
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

        if (!error && data) {
          eventsData = data.map((event) => ({
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
        } else {
          eventsData = []
        }
      } catch (error) {
        console.error('이벤트 로드 오류:', error)
        eventsData = []
      }

      // 3. 게시글
      try {
        const { data, error } = await supabase
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

        if (!error && data) {
          // 뱃지 가져오기 (재사용 함수 사용)
          const authorIds = [...new Set(data.map((post) => post.author_id).filter(Boolean) as string[])]
          const badgesMap = await getBadgesForUsers(supabase, authorIds)

          postsData = data.map((post) => {
            // 배열이면 첫 번째 요소를, 아니면 그대로 사용
            const categoryData = Array.isArray(post.board_categories) ? post.board_categories[0] : post.board_categories
            const profileData = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles

            let slug = categoryData?.slug
            if (slug === "free-board") slug = "free"
            const visibleBadges = post.author_id ? (badgesMap.get(post.author_id) || []) : []
            return {
              id: post.id,
              title: post.title,
              content: post.content,
              created_at: post.created_at,
              visibility: 'public' as const,
              likes_count: 0,
              comments_count: 0,
              profiles: profileData ? {
                id: profileData.id,
                full_name: profileData.full_name,
              } : null,
              board_categories: categoryData ? {
                name: categoryData.name,
                slug: slug || categoryData.slug,
              } : null,
              communities: null,
              visible_badges: visibleBadges,
            } as Post
          })
        } else {
          postsData = []
        }
      } catch (error) {
        console.error('게시글 로드 오류:', error)
        postsData = []
      }

      // 4. 후기 (Reviews)
      try {
        const reviewsResult = await getLatestReviews(supabase, 10)
        reviewsData = reviewsResult || []
      } catch (error) {
        console.error('후기 로드 오류:', error)
        reviewsData = []
      }

      // 카테고리 처리
      setBoardCategories(categoriesData)

      // 이벤트 처리
      setEvents(eventsData)

      // 게시글 처리 (이미 뱃지가 포함된 상태)
      setPosts(postsData)

      // 후기 처리
      setReviews(reviewsData)

    } catch (error) {
      console.error('데이터 로드 중 오류 발생:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const previousUser = userRef.current
      const currentUser = session?.user ?? null
      userRef.current = currentUser
      setUser(currentUser)

      if (event === 'SIGNED_OUT' || (!currentUser && previousUser)) {
        setUser(null)
        userRef.current = null
        return
      }

      if (event === 'SIGNED_IN' && !previousUser && currentUser) {
        fetchData()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchData])

  const handleCreateEvent = () => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    setShowCreateSheet(true)
  }

  const handleLogin = () => {
    router.push("/auth/login")
  }

  return (
    <DashboardLayout
      sidebarProfile={
        sidebarProfile ? (
          <Suspense fallback={<div className="px-4 pb-4 min-h-[140px] flex flex-col justify-center"><div className="h-10 w-full bg-slate-100 rounded-full animate-pulse" /></div>}>
            {sidebarProfile}
          </Suspense>
        ) : undefined
      }
    >
      <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* [LEFT] 메인 콘텐츠 영역 */}
        <div className="xl:col-span-9 flex flex-col gap-6">
          <HeroSection user={user} profile={profile} onLogin={handleLogin} />
          {children && <div>{children}</div>}
          <div id="events-section">
            <EventsSection events={events} onCreateEvent={handleCreateEvent} isLoading={isLoading} />
          </div>
          <div className="mt-12">
            <ReviewsSection reviews={reviews} isLoading={isLoading} />
          </div>
          <div className="mt-12">
            <PostsSection
              posts={posts}
              boardCategories={boardCategories}
              selectedBoard={selectedBoard}
              onBoardChange={setSelectedBoard}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* [RIGHT] 우측 사이드바 영역 (xl 이상에서만 표시) */}
        <div className="hidden xl:block xl:col-span-3">
          <div className="sticky top-8 flex flex-col gap-6 h-fit">
            <StandardRightSidebar />
          </div>
        </div>
      </div>

      <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
        <SheetContent side="bottom" className="h-[95vh] p-0 rounded-t-2xl overflow-hidden" hideClose>
          <div className="flex h-full flex-col">
            <SheetHeader className="flex flex-row items-center justify-between border-b px-6 py-4 bg-white z-10">
              <SheetTitle className="text-xl font-bold">새 이벤트</SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                  <X className="size-5" />
                </Button>
              </SheetClose>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto bg-slate-50">
              <div className="max-w-5xl mx-auto p-6 md:p-8">
                <NewEventForm
                  userId={user?.id || ""}
                  onSuccess={() => {
                    setShowCreateSheet(false)
                    window.location.reload()
                  }}
                />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}

