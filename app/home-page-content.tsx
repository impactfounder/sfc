"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginModal } from "@/components/login-modal"
import { NewEventForm } from "@/components/new-event-form"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AnnouncementBanner } from "@/components/home/announcement-banner"
import { EventsSection } from "@/components/home/events-section"
import { PostsSection } from "@/components/home/posts-section"
import { EventCardEvent } from "@/components/ui/event-card"
import { X } from "lucide-react"

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

type HomePageContentProps = {
  announcement: Announcement | null
  events: EventCardEvent[]
  posts: Post[]
  boardCategories: BoardCategory[]
}

export function HomePageContent({
  announcement,
  events,
  posts,
  boardCategories,
}: HomePageContentProps) {
  const [selectedBoard, setSelectedBoard] = useState<string>("all")
  const [user, setUser] = useState<any>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const router = useRouter()

  // 클라이언트에서 사용자 정보만 가져오기
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const handleCreateEvent = () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    setShowCreateSheet(true)
  }

  return (
    <>
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
    </>
  )
}

