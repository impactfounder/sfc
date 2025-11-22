"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Plus, User, Users, X } from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { LoginModal } from "@/components/login-modal"
import { NewEventForm } from "@/components/new-event-form"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AnnouncementBanner } from "@/components/home/announcement-banner"
import { EventsSection } from "@/components/home/events-section"
import { PostsSection } from "@/components/home/posts-section"
import { EventCardEvent } from "@/components/ui/event-card" // 타입 import

type TabValue = "events" | "community"

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

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabValue>("events")
  const [selectedBoard, setSelectedBoard] = useState<string>("all")
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [events, setEvents] = useState<EventCardEvent[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [boardCategories, setBoardCategories] = useState<BoardCategory[]>([])
  const [user, setUser] = useState<any>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // 카테고리 가져오기
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

      // 공지사항 가져오기
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

      // ★★★ 이벤트 가져오기 (최신 9개 & bio 포함) ★★★
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
        .gte("event_date", new Date().toISOString()) // 오늘 이후 이벤트만
        .order("event_date", { ascending: true })    // 가까운 날짜 순
        .limit(9)                                    // 9개 제한

      if (eventsData) {
        const transformedEvents = eventsData.map((event: any) => ({
          id: event.id,
          title: event.title,
          thumbnail_url: event.thumbnail_url,
          event_date: event.event_date,
          event_time: null, // EventCard 내부에서 처리함
          location: event.location,
          max_participants: event.max_participants,
          current_participants: event.event_registrations?.[0]?.count || 0,
          host_name: event.profiles?.full_name || "알 수 없음",
          host_avatar_url: event.profiles?.avatar_url || null,
          host_bio: event.profiles?.bio || null, // bio 연결
        }))
        setEvents(transformedEvents)
      }

      // 게시글 가져오기
      const { data: postsData } = await supabase
        .from("posts")
        .select(`id, title, content, created_at, profiles:author_id(full_name), board_categories!inner(name, slug)`)
        .in("board_categories.slug", ["free", "vangol", "hightalk", "free-board", "bangol", "hightalk"])
        .neq("board_categories.slug", "announcement")
        .order("created_at", { ascending: false })
        .limit(50)

      if (postsData) {
        const mappedPosts = postsData.map((post: any) => {
          let slug = post.board_categories?.slug
          if (slug === "free-board") slug = "free"
          if (slug === "bangol") slug = "vangol"
          return { ...post, board_categories: { ...post.board_categories, slug } }
        })
        setPosts(mappedPosts as Post[])
      }

      setIsLoading(false)
    }

    fetchData()
  }, [supabase])

  const handleCreateEvent = () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    setShowCreateSheet(true)
  }

  const handleProfileAction = () => {
    if (user) {
      router.push("/community/profile")
      return
    }
    setShowLoginModal(true)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MobileHeader />
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex w-full flex-1 justify-center overflow-x-hidden pb-20 pt-20 lg:pb-10 lg:pt-12">
        <div className="w-full flex flex-col gap-8">
          {/* Announcement */}
          {announcement && <AnnouncementBanner announcement={announcement} />}

          {/* Events Section */}
          <EventsSection events={events} onCreateEvent={handleCreateEvent} />

          {/* Posts Section */}
          <PostsSection
            posts={posts}
            boardCategories={boardCategories}
            selectedBoard={selectedBoard}
            onBoardChange={setSelectedBoard}
          />
        </div>
      </div>

      <MobileActionBar
        activeTab={activeTab}
        onTabChange={(tab: TabValue) => setActiveTab(tab)}
        onCreate={handleCreateEvent}
        onProfile={handleProfileAction}
      />

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />

      <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
        <SheetContent side="bottom" className="h-[85vh] p-0" hideClose>
          <div className="flex h-full flex-col overflow-hidden">
            <SheetHeader className="flex flex-row items-center justify-between border-b px-6 py-5">
              <SheetTitle className="text-xl font-bold">새 이벤트 만들기</SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="size-5" />
                </Button>
              </SheetClose>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <NewEventForm
                userId={user?.id || ""}
                onSuccess={() => {
                  setShowCreateSheet(false)
                  window.location.reload()
                }}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

type MobileActionBarProps = {
  activeTab: TabValue
  onTabChange: (tab: TabValue) => void
  onCreate: () => void
  onProfile: () => void
}

function MobileActionBar({ activeTab, onTabChange, onCreate, onProfile }: MobileActionBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur lg:hidden">
      <div className="grid h-16 grid-cols-4 divide-x text-xs font-medium">
        <NavButton
          icon={<Calendar className="size-5" />}
          label="이벤트"
          isActive={activeTab === "events"}
          onClick={() => onTabChange("events")}
        />
        <NavButton
          icon={<Users className="size-5" />}
          label="커뮤니티"
          isActive={activeTab === "community"}
          onClick={() => onTabChange("community")}
        />
        <NavButton icon={<Plus className="size-5" />} label="만들기" onClick={onCreate} />
        <NavButton icon={<User className="size-5" />} label="MY" onClick={onProfile} />
      </div>
    </nav>
  )
}

type NavButtonProps = {
  icon: ReactNode
  label: string
  isActive?: boolean
  onClick: () => void
}

function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-full flex-col items-center justify-center gap-1 text-gray-500 transition hover:text-gray-900",
        isActive && "text-blue-600"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}