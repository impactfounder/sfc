"use client"

import { useEffect, useMemo, useState, useRef, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Plus, User, Users, X, Home } from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"
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

type TabValue = "home" | "events" | "community"

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
  const [activeTab, setActiveTab] = useState<TabValue>("home")
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

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      userRef.current = user

      // 카테고리
      const { data: categoriesData } = await supabase
        .from("board_categories")
        .select("id, name, slug")
        .in("slug", ["free", "vangol", "hightalk", "free-board", "bangol", "hightalk"])
        .eq("is_active", true)
        .order("order_index", { ascending: true })

      if (categoriesData) {
        const mappedCategories = categoriesData.map((cat) => {
          if (cat.slug === "free-board") return { ...cat, slug: "free" }
          if (cat.slug === "bangol") return { ...cat, slug: "vangol" }
          return cat
        })
        setBoardCategories(mappedCategories as BoardCategory[])
      }

      // 공지사항
      const { data: announcementData } = await supabase
        .from("posts")
        .select(`id, title, board_categories!inner(slug)`)
        .eq("board_categories.slug", "announcement")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (announcementData) {
        setAnnouncement({ id: announcementData.id, title: announcementData.title })
      }

      // 이벤트
      const { data: eventsData } = await supabase
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

      if (eventsData) {
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
      }

      // 게시글
      const { data: postsData } = await supabase
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
        .in("board_categories.slug", ["free", "vangol", "hightalk", "free-board", "bangol", "hightalk"])
        .neq("board_categories.slug", "announcement")
        .order("created_at", { ascending: false })
        .limit(50)

      if (postsData) {
        const postsWithBadges = await Promise.all(
          postsData.map(async (post: any) => {
            let slug = post.board_categories?.slug
            if (slug === "free-board") slug = "free"
            if (slug === "bangol") slug = "vangol"

            let visibleBadges: Array<{ icon: string; name: string }> = []
            if (post.author_id) {
              const { data: badgesData } = await supabase
                .from("user_badges")
                .select(`
                  badges:badge_id (
                    icon,
                    name
                  )
                `)
                .eq("user_id", post.author_id)
                .eq("is_visible", true)

              if (badgesData) {
                visibleBadges = badgesData
                  .map((ub: any) => ub.badges)
                  .filter(Boolean)
                  .map((badge: any) => ({
                    icon: badge.icon,
                    name: badge.name,
                  }))
              }
            }

            return {
              ...post,
              board_categories: { ...post.board_categories, slug },
              visible_badges: visibleBadges,
            }
          })
        )
        setPosts(postsWithBadges as Post[])
      }

      setIsLoading(false)
    }

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
        setIsLoading(true)
        // 데이터 다시 가져오기
        const { data: eventsData } = await supabase
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

        if (eventsData) {
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
        }
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // ★ 수정됨: 모달 대신 페이지 이동
  const handleCreateEvent = () => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    setShowCreateSheet(true)
  }

  // ★ 수정됨: 모달 대신 페이지 이동
  const handleProfileAction = () => {
    if (user) {
      router.push("/community/profile")
      return
    }
    router.push("/auth/login")
  }

  // 로그인 페이지로 이동 함수
  const handleLogin = () => {
    router.push("/auth/login")
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MobileHeader />
      <div className="hidden lg:block"><Sidebar /></div>

      <div className="flex w-full flex-1 justify-center overflow-x-hidden pb-24 pt-20 lg:pb-10 lg:pt-12 lg:pl-[344px]">
        <div className="w-full flex flex-col gap-8">
          {/* ★ 히어로 섹션 추가 (홈 탭일 때만 보임) */}
          {activeTab === 'home' && (
            <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
              {/* HeroSection에 로그인 핸들러 전달 */}
              <HeroSection user={user} onLogin={handleLogin} />
            </div>
          )}
          {(activeTab === 'home' || activeTab === 'events') && (
            <>
              {announcement && <AnnouncementBanner announcement={announcement} />}
              <div id="events-section">
                <EventsSection events={events} onCreateEvent={handleCreateEvent} isLoading={isLoading} />
              </div>
            </>
          )}
          {(activeTab === 'home' || activeTab === 'community') && (
            <PostsSection
              posts={posts}
              boardCategories={boardCategories}
              selectedBoard={selectedBoard}
              onBoardChange={setSelectedBoard}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>

      <MobileActionBar
        activeTab={activeTab}
        onTabChange={(tab: TabValue) => {
          setActiveTab(tab)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onCreate={handleCreateEvent}
        onProfile={handleProfileAction}
        user={user}
      />

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
    </div>
  )
}

// 하단 메뉴바 컴포넌트
type MobileActionBarProps = {
  activeTab: TabValue
  onTabChange: (tab: TabValue) => void
  onCreate: () => void
  onProfile: () => void
  user: any
}

function MobileActionBar({ activeTab, onTabChange, onCreate, onProfile, user }: MobileActionBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur lg:hidden safe-area-pb">
      <div className="grid h-16 grid-cols-5 divide-x-0 text-[10px] font-medium text-gray-500">
        <NavButton icon={<Home className={cn("size-6 mb-1", activeTab === "home" ? "text-slate-900" : "text-gray-400")} />} label="홈" isActive={activeTab === "home"} onClick={() => onTabChange("home")} />
        <NavButton icon={<Calendar className={cn("size-6 mb-1", activeTab === "events" ? "text-slate-900" : "text-gray-400")} />} label="이벤트" isActive={activeTab === "events"} onClick={() => onTabChange("events")} />
        <button type="button" onClick={onCreate} className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-center size-10 bg-slate-900 rounded-full shadow-lg text-white mb-1 transform active:scale-95 transition-transform">
            <Plus className="size-6" />
          </div>
          <span className="text-[10px] text-slate-900 font-semibold">만들기</span>
        </button>
        <NavButton icon={<Users className={cn("size-6 mb-1", activeTab === "community" ? "text-slate-900" : "text-gray-400")} />} label="커뮤니티" isActive={activeTab === "community"} onClick={() => onTabChange("community")} />
        <NavButton icon={<User className={cn("size-6 mb-1", !user ? "text-gray-400" : "text-gray-400")} />} label={user ? "프로필" : "로그인"} onClick={onProfile} />
      </div>
    </nav>
  )
}

type NavButtonProps = { icon: ReactNode, label: string, isActive?: boolean, onClick: () => void }
function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <button type="button" onClick={onClick} className={cn("flex flex-col items-center justify-center transition-colors active:bg-gray-50", isActive ? "text-slate-900 font-bold" : "text-gray-400")}>
      {icon}
      <span>{label}</span>
    </button>
  )
}