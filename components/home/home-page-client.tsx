"use client"

import { useEffect, useMemo, useState, useRef, useCallback, ReactNode } from "react"
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
import { EventRequestSection } from "@/components/home/event-request-section"
import { ReviewsSection } from "@/components/home/reviews-section"
import { EventCardEvent } from "@/components/ui/event-card"
import { getLatestPosts, getLatestReviews } from "@/lib/queries/posts"

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
    id?: string
  } | null
  visible_badges?: Array<{
    icon: string
    name: string
  }>
}

type HomePageClientProps = {
  children?: ReactNode
  initialAnnouncement?: { id: string; title: string } | null
  initialEvents?: EventCardEvent[]
  initialPosts?: Post[]
  initialEventRequests?: Post[]
  initialReviews?: any[]
  initialBoardCategories?: BoardCategory[]
  initialUser?: any
}

export function HomePageClient({
  children,
  initialAnnouncement = null,
  initialEvents = [],
  initialPosts = [],
  initialEventRequests = [],
  initialReviews = [],
  initialBoardCategories = [],
  initialUser = null,
}: HomePageClientProps) {
  const [selectedBoard, setSelectedBoard] = useState<string>("all")
  const [announcement, setAnnouncement] = useState<{ id: string; title: string } | null>(initialAnnouncement)
  const [events, setEvents] = useState<EventCardEvent[]>(initialEvents)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [eventRequests, setEventRequests] = useState<Post[]>(initialEventRequests)
  const [reviews, setReviews] = useState<any[]>(initialReviews)
  const [boardCategories, setBoardCategories] = useState<BoardCategory[]>(initialBoardCategories)
  const [user, setUser] = useState<any>(initialUser)
  const userRef = useRef<any>(initialUser)
  
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

      // 각 쿼리를 독립적으로 처리
      let categoriesData: any[] = []
      let announcementData: any = null
      let eventsData: any[] = []
      let postsData: any[] = []
      let eventRequestsData: any[] = []
      let reviewsData: any[] = []

      // 1. 카테고리
      try {
        const { data, error } = await supabase
          .from("board_categories")
          .select("id, name, slug")
          .in("slug", ["free", "vangol", "hightalk", "free-board"])
          .eq("is_active", true)
          .order("order_index", { ascending: true })
        
        if (!error && data) {
          categoriesData = data
        }
      } catch (error: any) {
        console.error('카테고리 로드 오류:', error)
        categoriesData = []
      }

      // 2. 공지사항
      try {
        const { data, error } = await supabase
          .from("posts")
          .select(`id, title, board_categories!inner(slug)`)
          .eq("board_categories.slug", "announcement")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (!error && data) {
          announcementData = data
        }
      } catch (error: any) {
        console.error('공지사항 로드 오류:', error)
        announcementData = null
      }

      // 3. 이벤트
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
          eventsData = data.map((event: any) => ({
            ...event,
            event_type: event.event_type || 'networking'
          }))
        } else {
          eventsData = []
        }
      } catch (error: any) {
        console.error('이벤트 로드 오류:', error)
        eventsData = []
      }

      // 4. 게시글
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
          postsData = data
        } else {
          postsData = []
        }
      } catch (error: any) {
        console.error('게시글 로드 오류:', error)
        postsData = []
      }

      // 5. 열어주세요(Event Requests)
      try {
        const requestsData = await getLatestPosts(supabase, 6, 'event-requests')
        if (requestsData) {
          eventRequestsData = requestsData
        } else {
          eventRequestsData = []
        }
      } catch (error: any) {
        console.error('열어주세요 로드 오류:', error)
        eventRequestsData = []
      }

      // 6. 후기 (Reviews)
      try {
        const reviewsResult = await getLatestReviews(supabase, 10)
        if (reviewsResult) {
          reviewsData = reviewsResult
        } else {
          reviewsData = []
        }
      } catch (error: any) {
        console.error('후기 로드 오류:', error)
        reviewsData = []
      }

      // 카테고리 처리
      if (categoriesData.length > 0) {
        const mappedCategories = categoriesData.map((cat) => {
          if (cat.slug === "free-board") return { ...cat, slug: "free" }
          return cat
        })
        setBoardCategories(mappedCategories as BoardCategory[])
      }

      // 공지사항 처리
      if (announcementData) {
        setAnnouncement({ id: announcementData.id, title: announcementData.title })
      }

      // 이벤트 처리
      if (eventsData.length > 0) {
        const transformedEvents = eventsData.map((event: any) => ({
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
        setEvents(transformedEvents)
      } else {
        setEvents([])
      }

      // 게시글 처리 (N+1 문제 해결: 배치로 뱃지 가져오기)
      if (postsData.length > 0) {
        const authorIds = [...new Set(postsData.map((post: any) => post.author_id).filter(Boolean))]
        
        const badgesMap = new Map<string, Array<{ icon: string; name: string }>>()
        if (authorIds.length > 0) {
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
              .in("user_id", authorIds)
              .eq("is_visible", true)
            
            if (!badgesError && allBadgesData) {
              allBadgesData.forEach((ub: any) => {
                if (ub.badges && ub.user_id) {
                  const existing = badgesMap.get(ub.user_id) || []
                  badgesMap.set(ub.user_id, [...existing, { icon: ub.badges.icon, name: ub.badges.name }])
                }
              })
            }
          } catch (error: any) {
            console.error('뱃지 로드 오류:', error)
          }
        }

        const postsWithBadges = postsData.map((post: any) => {
          let slug = post.board_categories?.slug
          if (slug === "free-board") slug = "free"

          const visibleBadges = post.author_id ? (badgesMap.get(post.author_id) || []) : []

          return {
            ...post,
            board_categories: { ...post.board_categories, slug },
            visible_badges: visibleBadges,
          }
        })
        setPosts(postsWithBadges as Post[])
      } else {
        setPosts([])
      }

      // 열어주세요 처리
      if (eventRequestsData.length > 0) {
        setEventRequests(eventRequestsData as Post[])
      } else {
        setEventRequests([])
      }

      // 후기 처리
      if (reviewsData.length > 0) {
        setReviews(reviewsData)
      } else {
        setReviews([])
      }

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
    <DashboardLayout>
      <div className="flex flex-col">
        <div className="mb-6">
          <HeroSection user={user} onLogin={handleLogin} />
        </div>
        {children && (
          <div className="mb-16">
            {children}
          </div>
        )}
        <div id="events-section" className="mb-20">
          <EventsSection events={events} onCreateEvent={handleCreateEvent} isLoading={isLoading} />
        </div>
        <div className="mb-20">
          <EventRequestSection posts={eventRequests} isLoading={isLoading} user={user} />
        </div>
        <div className="mb-20">
          <ReviewsSection reviews={reviews} isLoading={isLoading} />
        </div>
        <div>
          <PostsSection
            posts={posts}
            boardCategories={boardCategories}
            selectedBoard={selectedBoard}
            onBoardChange={setSelectedBoard}
            isLoading={isLoading}
          />
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

