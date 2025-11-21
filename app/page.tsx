"use client"

import { Bell, Calendar, Users, Plus, User, X } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { LoginModal } from "@/components/login-modal"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { EventCard } from "@/components/ui/event-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import { NewEventForm } from "@/components/new-event-form"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"events" | "community">("events")
  const [selectedBoard, setSelectedBoard] = useState<string>("all")
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [boardCategories, setBoardCategories] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
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
        setBoardCategories(categoriesData)
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

      if (announcementsData) setAnnouncements(announcementsData)
      if (eventsData) setEvents(eventsData)
      if (postsData) setPosts(postsData)

      setIsLoading(false)
    }

    fetchData()
  }, [])

  const filteredPosts =
    selectedBoard === "all" ? posts : posts.filter((post) => post.board_categories?.slug === selectedBoard)

  const handleCreateEvent = () => {
    if (!user) {
      setShowLoginModal(true)
    } else {
      setShowCreateSheet(true)
    }
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <MobileHeader />
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="w-full max-w-full overflow-x-hidden pb-16 pt-16 lg:flex-1 lg:pb-0 lg:pt-0">
        <div className="w-full lg:mx-auto lg:max-w-6xl lg:px-10">
          {announcements.length > 0 && (
            <div className="border-b border-blue-100 bg-blue-50">
              <Link
                href={`/community/posts/${announcements[0].id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-blue-100 lg:px-0"
              >
                <Bell className="size-5 flex-shrink-0 text-blue-600" />
                <span className="truncate text-base font-medium text-gray-900">{announcements[0].title}</span>
              </Link>
            </div>
          )}

          <div className="flex-1">
            <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab((value as "events" | "community") ?? "events")}
                className="gap-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <TabsList className="flex-1 gap-3 bg-transparent p-0 md:max-w-md">
                    <TabsTrigger
                      value="events"
                      className="flex-1 rounded-xl bg-white px-4 py-2 text-base shadow-sm data-[state=active]:text-foreground"
                    >
                      이벤트
                    </TabsTrigger>
                    <TabsTrigger
                      value="community"
                      className="flex-1 rounded-xl bg-white px-4 py-2 text-base shadow-sm data-[state=active]:text-foreground"
                    >
                      커뮤니티
                    </TabsTrigger>
                  </TabsList>
                  {activeTab === "events" && (
                    <Button onClick={handleCreateEvent} size="sm" className="w-full justify-center md:w-auto md:px-6">
                      + 이벤트 만들기
                    </Button>
                  )}
                </div>

                <TabsContent value="events" className="space-y-10">
                  {isLoading ? (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-56 rounded-2xl bg-white" />
                      ))}
                    </div>
                  ) : events.length > 0 ? (
                    <>
                      <section className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-2xl font-bold">이벤트</h2>
                          <Button onClick={handleCreateEvent} size="sm" variant="outline" className="hidden md:inline-flex">
                            새 이벤트
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:hidden">
                          {events.slice(0, 3).map((event) => (
                            <EventCard
                              key={event.id}
                              event={event}
                              layout="poster"
                              href={`/community/events/${event.id}`}
                            />
                          ))}
                        </div>

                        {events.length > 3 && (
                          <div className="space-y-2 lg:hidden">
                            {events.slice(3).map((event) => (
                              <EventCard
                                key={event.id}
                                event={event}
                                layout="list"
                                href={`/community/events/${event.id}`}
                              />
                            ))}
                          </div>
                        )}

                        <div className="hidden gap-6 lg:grid lg:grid-cols-3">
                          {events.map((event) => (
                            <EventCard
                              key={event.id}
                              event={event}
                              layout="square"
                              href={`/community/events/${event.id}`}
                            />
                          ))}
                        </div>
                      </section>

                      <section className="hidden lg:block">
                        <div className="mb-6 flex items-center justify-between">
                          <h2 className="text-2xl font-bold">최신 글</h2>
                          <Button asChild variant="link" className="px-0 text-sm">
                            <Link href="/community/posts">더보기 →</Link>
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {posts.slice(0, 5).map((post) => (
                            <Link
                              key={post.id}
                              href={`/community/posts/${post.id}`}
                              className="block rounded-xl border bg-white p-5 shadow-xs transition hover:border-primary/40 hover:shadow-sm"
                            >
                              <span className="text-xs font-medium text-blue-600">{post.board_categories?.name}</span>
                              <h3 className="mt-2 text-lg font-semibold">{post.title}</h3>
                              <div className="mt-2 text-sm text-gray-500">
                                {post.profiles?.full_name || "익명"} ·{" "}
                                {new Date(post.created_at).toLocaleDateString("ko-KR")}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </section>
                    </>
                  ) : (
                    <Empty className="bg-white/50">
                      <EmptyHeader>
                        <EmptyTitle>아직 예정된 이벤트가 없어요</EmptyTitle>
                        <EmptyDescription>첫 번째 이벤트를 만들어 커뮤니티를 시작해보세요.</EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button onClick={handleCreateEvent}>이벤트 만들기</Button>
                      </EmptyContent>
                    </Empty>
                  )}
                </TabsContent>

                <TabsContent value="community" className="space-y-8">
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">최신 글</h2>
                      <Button asChild variant="link" className="px-0 text-sm">
                        <Link href="/community/posts">더보기 →</Link>
                      </Button>
                    </div>

                    <div className="sticky top-16 z-40 border-b bg-white/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/70 lg:static lg:border-none lg:bg-transparent lg:py-0 lg:backdrop-blur-none">
                      <ScrollArea className="w-full">
                        <ToggleGroup
                          type="single"
                          value={selectedBoard}
                          onValueChange={(value) => value && setSelectedBoard(value)}
                          className="min-w-max rounded-xl border bg-white p-1 shadow-xs"
                          variant="outline"
                        >
                          <ToggleGroupItem value="all" className="px-4">
                            전체
                          </ToggleGroupItem>
                          {boardCategories.map((category) => (
                            <ToggleGroupItem key={category.id} value={category.slug} className="px-4">
                              {category.name}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </ScrollArea>
                    </div>

                    <div className="space-y-3">
                      {filteredPosts.map((post) => (
                        <Link
                          key={post.id}
                          href={`/community/posts/${post.id}`}
                          className="block rounded-xl border bg-white p-5 shadow-xs transition hover:border-primary/40 hover:shadow-sm"
                        >
                          <span className="text-xs font-medium text-blue-600">{post.board_categories?.name}</span>
                          <h3 className="mt-2 text-lg font-semibold">{post.title}</h3>
                          <div className="mt-2 text-sm text-gray-500">
                            {post.profiles?.full_name || "익명"} · {new Date(post.created_at).toLocaleDateString("ko-KR")}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white lg:hidden">
        <div className="flex h-16 items-center justify-around">
          <Button
            variant="ghost"
            className={cn(
              "flex h-full flex-1 flex-col items-center justify-center rounded-none border-none shadow-none",
              activeTab === "events" ? "text-blue-600" : "text-gray-600"
            )}
            onClick={() => setActiveTab("events")}
          >
            <Calendar className="mb-1 size-6" />
            <span className="text-xs">이벤트</span>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "flex h-full flex-1 flex-col items-center justify-center rounded-none border-none shadow-none",
              activeTab === "community" ? "text-blue-600" : "text-gray-600"
            )}
            onClick={() => setActiveTab("community")}
          >
            <Users className="mb-1 size-6" />
            <span className="text-xs">커뮤니티</span>
          </Button>
          <Button
            variant="ghost"
            className="flex h-full flex-1 flex-col items-center justify-center rounded-none border-none shadow-none text-gray-600"
            onClick={handleCreateEvent}
          >
            <Plus className="mb-1 size-6" />
            <span className="text-xs">만들기</span>
          </Button>
          <Button
            variant="ghost"
            className="flex h-full flex-1 flex-col items-center justify-center rounded-none border-none shadow-none text-gray-600"
            onClick={() => {
              if (user) {
                router.push("/community/profile")
              } else {
                setShowLoginModal(true)
              }
            }}
          >
            <User className="mb-1 size-6" />
            <span className="text-xs">{user ? "MY" : "로그인"}</span>
          </Button>
        </div>
      </nav>

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />

      <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
        <SheetContent side="bottom" className="h-[80vh] p-0" hideClose={true}>
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-shrink-0 border-b px-6 py-5">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl font-bold">새 이벤트 만들기</SheetTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateSheet(false)}>
                  <X className="size-5" />
                </Button>
              </div>
            </div>
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
