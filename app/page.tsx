"use client"

import Link from "next/link"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Calendar, Plus, User, Users, X } from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { LoginModal } from "@/components/login-modal"
import { EventCard } from "@/components/ui/event-card"
import { NewEventForm } from "@/components/new-event-form"
import { PostListItem } from "@/components/ui/post-list-item"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type TabValue = "events" | "community"

type BoardCategory = {
  id: string
  name: string
  slug: string
}

type Profile = {
  full_name?: string | null
}

type Post = {
  id: string
  title: string
  created_at: string
  board_categories?: {
    name?: string | null
    slug?: string | null
  } | null
  profiles?: Profile | null
}

type Event = {
  id: string
  title: string
  thumbnail_url?: string | null
  event_date: string
  event_time?: string | null
  location?: string | null
  current_participants?: number | null
  max_participants?: number | null
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabValue>("events")
  const [selectedBoard, setSelectedBoard] = useState<string>("all")
  const [announcements, setAnnouncements] = useState<Post[]>([])
  const [events, setEvents] = useState<Event[]>([])
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

      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      const { data: categoriesData } = await supabase.from("board_categories").select("*").order("name")
      if (categoriesData) {
        setBoardCategories(categoriesData as BoardCategory[])
      }

      const { data: announcementsData } = await supabase
        .from("posts")
        .select(`*, profiles(full_name), board_categories!inner(name, slug)`)
        .eq("board_categories.slug", "announcement")
        .order("created_at", { ascending: false })
        .limit(1)

      const { data: eventsData } = await supabase
        .from("events")
        .select(`*, profiles(full_name), event_registrations(count)`)
        .eq("status", "upcoming")
        .order("event_date", { ascending: true })
        .limit(10)

      const { data: postsData } = await supabase
        .from("posts")
        .select(`*, profiles(full_name), board_categories!inner(name, slug)`)
        .neq("board_categories.slug", "announcement")
        .order("created_at", { ascending: false })
        .limit(20)

      if (announcementsData) setAnnouncements(announcementsData as Post[])
      if (eventsData) setEvents(eventsData as Event[])
      if (postsData) setPosts(postsData as Post[])

      setIsLoading(false)
    }

    fetchData()
  }, [supabase])

  const filteredPosts = useMemo(
    () =>
      selectedBoard === "all"
        ? posts
        : posts.filter((post: Post) => post.board_categories?.slug === selectedBoard),
    [posts, selectedBoard]
  )

  const latestPosts = useMemo(() => posts.slice(0, 5), [posts])

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

  const announcement = announcements[0]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MobileHeader />
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex w-full flex-1 justify-center overflow-x-hidden pb-20 pt-20 lg:pb-10 lg:pt-12">
        <div className="flex w-full max-w-6xl flex-col gap-6 px-4 lg:px-10">
          {announcement && <AnnouncementBanner announcement={announcement} />}

          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab((value as TabValue) ?? "events")} className="space-y-6">
            <Card className="gap-0">
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">커뮤니티 허브</CardTitle>
                  <CardDescription>이벤트와 커뮤니티 소식을 한눈에 확인하세요.</CardDescription>
                </div>
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <TabsList className="grid w-full grid-cols-2 bg-muted/40 p-1 md:w-auto">
                    <TabsTrigger value="events" className="rounded-lg text-base data-[state=active]:bg-background">
                      이벤트
                    </TabsTrigger>
                    <TabsTrigger value="community" className="rounded-lg text-base data-[state=active]:bg-background">
                      커뮤니티
                    </TabsTrigger>
                  </TabsList>
                  {activeTab === "events" && (
                    <Button onClick={handleCreateEvent} size="lg" className="w-full md:w-auto">
                      + 이벤트 만들기
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>

            <TabsContent value="events" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>이벤트</CardTitle>
                      <CardDescription>다가오는 일정을 확인하세요.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={handleCreateEvent}>
                      새 이벤트
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index: number) => (
                          <Skeleton key={index} className="h-56 rounded-2xl bg-white" />
                        ))}
                      </div>
                    ) : events.length > 0 ? (
                      <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {events.map((event: Event, index: number) => (
                            <EventCard
                              key={event.id}
                              event={event}
                              layout={index % 3 === 0 ? "poster" : "square"}
                              href={`/community/events/${event.id}`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Empty className="bg-white/60">
                        <EmptyHeader>
                          <EmptyTitle>아직 예정된 이벤트가 없어요</EmptyTitle>
                          <EmptyDescription>첫 번째 이벤트를 만들어 커뮤니티를 시작해보세요.</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button onClick={handleCreateEvent}>이벤트 만들기</Button>
                        </EmptyContent>
                      </Empty>
                    )}
                  </CardContent>
                </Card>

                <Card className="hidden lg:flex lg:flex-col">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>최신 글</CardTitle>
                      <CardDescription>커뮤니티 소식을 빠르게 확인하세요.</CardDescription>
                    </div>
                    <Button asChild variant="link" className="px-0 text-sm">
                      <Link href="/community/posts">더보기 →</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {latestPosts.length > 0 ? (
                      latestPosts.map((post: Post) => (
                        <PostListItem key={post.id} post={post} href={`/community/posts/${post.id}`} />
                      ))
                    ) : (
                      <CardDescription className="text-center text-base text-muted-foreground">
                        표시할 게시글이 없습니다.
                      </CardDescription>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="community" className="space-y-6">
              <Card className="gap-0">
                <CardHeader>
                  <CardTitle>게시판 필터</CardTitle>
                  <CardDescription>관심 있는 카테고리를 선택하세요.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full">
                    <ToggleGroup
                      type="single"
                      value={selectedBoard}
                      onValueChange={(value: string) => value && setSelectedBoard(value)}
                      variant="outline"
                      className="min-w-max rounded-full border bg-white/90 p-1"
                    >
                      <ToggleGroupItem value="all" className="rounded-full px-4">
                        전체
                      </ToggleGroupItem>
                      {boardCategories.map((category: BoardCategory) => (
                        <ToggleGroupItem key={category.id} value={category.slug} className="rounded-full px-4">
                          {category.name}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>최신 글</CardTitle>
                    <CardDescription>
                      {selectedBoard === "all"
                        ? "전체 게시판에서 모아봤어요."
                        : boardCategories.find((category: BoardCategory) => category.slug === selectedBoard)?.name || "게시판"}
                    </CardDescription>
                  </div>
                  <Button asChild variant="link" className="px-0 text-sm">
                    <Link href="/community/posts">더보기 →</Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredPosts.length > 0 ? (
                    filteredPosts.map((post: Post) => (
                      <PostListItem key={post.id} post={post} href={`/community/posts/${post.id}`} />
                    ))
                  ) : (
                    <Empty className="bg-white/60">
                      <EmptyHeader>
                        <EmptyTitle>게시글이 없습니다</EmptyTitle>
                        <EmptyDescription>첫 글을 작성해 커뮤니티를 시작해보세요.</EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button asChild variant="outline">
                          <Link href="/community/posts/new">글 작성하기</Link>
                        </Button>
                      </EmptyContent>
                    </Empty>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
        <SheetContent side="bottom" className="h-[80vh] p-0" hideClose>
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

type AnnouncementBannerProps = {
  announcement: Post
}

function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
  return (
    <Card className="gap-0 border-blue-100 bg-blue-50 text-blue-900 shadow-none">
      <CardContent className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:px-6">
        <div className="flex items-center gap-3">
          <Bell className="size-5 flex-shrink-0 text-blue-600" />
          <span className="text-sm font-medium uppercase tracking-wide text-blue-600">공지</span>
        </div>
        <Link
          href={`/community/posts/${announcement.id}`}
          className="text-base font-semibold hover:underline lg:text-lg"
        >
          {announcement.title}
        </Link>
      </CardContent>
    </Card>
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
