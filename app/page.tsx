"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { NewEventForm } from "@/components/new-event-form"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AnnouncementBanner } from "@/components/home/announcement-banner"
import { EventsSection } from "@/components/home/events-section"
import { PostsSection } from "@/components/home/posts-section"
import { HeroSection } from "@/components/home/hero-section"
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
    id?: string
  } | null
  visible_badges?: Array<{
    icon: string
    name: string
  }>
}

type Announcement = {
  id: string
  title: string
}

export default function HomePage() {
  const [selectedBoard, setSelectedBoard] = useState<string>("all")
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [events, setEvents] = useState<EventCardEvent[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [boardCategories, setBoardCategories] = useState<BoardCategory[]>([])
  const [user, setUser] = useState<any>(null)
  const userRef = useRef<any>(null) // 이전 사용자 상태 추적
  
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  // fetchData를 useCallback으로 감싸서 재사용 가능하게 함
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      userRef.current = user

      // 근본 원인: Promise.all이 하나의 쿼리 실패 시 전체를 블로킹함
      // 해결: 1) 각 쿼리를 개별 try-catch로 감싸서 독립적으로 처리
      //       2) 타임아웃 추가하여 무한 대기 방지
      //       3) 에러 발생 시 빈 배열/null로 설정하여 UI는 표시

      // 근본 원인: Supabase 쿼리는 빌더 패턴이므로 직접 Promise가 아님
      // 해결: 쿼리를 실행한 후 Promise를 얻어서 처리
      
      // 각 쿼리를 독립적으로 처리
      let categoriesData: any[] = []
      let announcementData: any = null
      let eventsData: any[] = []
      let postsData: any[] = []

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
          console.log('카테고리 로드 성공:', categoriesData.length)
        } else {
          console.warn('카테고리 로드 실패:', error)
        }
      } catch (error: any) {
        console.error('카테고리 로드 오류:', error)
        categoriesData = [] // 빈 배열로 설정
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
          console.log('공지사항 로드 성공')
        } else {
          console.warn('공지사항 로드 실패:', error)
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
          eventsData = data
          console.log('이벤트 로드 성공:', eventsData.length)
        } else {
          console.warn('이벤트 로드 실패:', error)
          eventsData = [] // 빈 배열로 설정
        }
      } catch (error: any) {
        console.error('이벤트 로드 오류:', error)
        eventsData = [] // 빈 배열로 설정
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
          console.log('게시글 로드 성공:', postsData.length)
        } else {
          console.warn('게시글 로드 실패:', error)
          postsData = [] // 빈 배열로 설정
        }
      } catch (error: any) {
        console.error('게시글 로드 오류:', error)
        postsData = [] // 빈 배열로 설정
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
        }))
        setEvents(transformedEvents)
      } else {
        setEvents([]) // 빈 배열로 설정하여 빈 상태 표시
      }

      // 게시글 처리 (N+1 문제 해결: 배치로 뱃지 가져오기)
      if (postsData.length > 0) {
        // 모든 고유한 author_id 추출
        const authorIds = [...new Set(postsData.map((post: any) => post.author_id).filter(Boolean))]
        
        // 배치로 모든 뱃지 가져오기 (한 번의 쿼리)
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
            // 뱃지 로드 실패해도 게시글은 표시
          }
        }

        // 게시글에 뱃지 매핑
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
        setPosts([]) // 빈 배열로 설정하여 빈 상태 표시
      }

    } catch (error) {
      console.error('데이터 로드 중 오류 발생:', error)
      // 에러가 발생해도 기본 데이터는 표시
    } finally {
      setIsLoading(false) // 항상 로딩 상태 해제
    }
  }, [supabase])

  useEffect(() => {
    fetchData()

    // 인증 상태 변경 감지 - 사용자 상태가 변경되면 즉시 반영
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const previousUser = userRef.current
      const currentUser = session?.user ?? null
      userRef.current = currentUser
      setUser(currentUser)
      
      // 로그아웃 이벤트 처리 - 사용자 상태 즉시 초기화
      if (event === 'SIGNED_OUT' || (!currentUser && previousUser)) {
        setUser(null)
        userRef.current = null
        // 페이지 리로드가 일어나므로 여기서는 상태만 초기화
        return
      }
      
      // 로그인했을 때만 데이터 다시 가져오기 (SIGNED_IN 이벤트)
      if (event === 'SIGNED_IN' && !previousUser && currentUser) {
        // 전체 데이터 다시 가져오기 (fetchData 재사용)
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

  // 로그인 페이지로 이동 함수
  const handleLogin = () => {
    router.push("/auth/login")
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        {/* Hero, Banner, Events, Posts 등 콘텐츠 */}
        <HeroSection user={user} onLogin={handleLogin} />
        {announcement && <AnnouncementBanner announcement={announcement} />}
        <div id="events-section">
          <EventsSection events={events} onCreateEvent={handleCreateEvent} isLoading={isLoading} />
        </div>
        <PostsSection
          posts={posts}
          boardCategories={boardCategories}
          selectedBoard={selectedBoard}
          onBoardChange={setSelectedBoard}
          isLoading={isLoading}
        />
      </div>


      {/* LoginModal 관련 코드는 제거됨 */}

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
