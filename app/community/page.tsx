import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import EventCard from "@/components/ui/event-card"
import { AnnouncementBanner } from "@/components/home/announcement-banner"
import { EventsSectionHeader } from "./_components/events-section-header"
import { PostsSection } from "@/components/home/posts-section"
import { getLatestAnnouncement } from "@/lib/queries/announcements"
import { getUpcomingEvents } from "@/lib/queries/events"
import { getLatestPosts } from "@/lib/queries/posts"
import { getBoardCategories } from "@/lib/queries/board-categories"

export default async function CommunityDashboardPage() {
  const supabase = await createClient()

  // Fetch data using query helpers
  const [announcement, eventsForDisplay, transformedPosts, boardCategories] = await Promise.all([
    getLatestAnnouncement(supabase),
    getUpcomingEvents(supabase, 9),
    getLatestPosts(supabase, 50),
    getBoardCategories(supabase),
  ])

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="space-y-8">
          {/* Announcement Banner */}
          {announcement && (
            <AnnouncementBanner announcement={announcement} />
          )}

          {/* Events Section */}
          <Card>
            <EventsSectionHeader />
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {eventsForDisplay.length > 0 ? (
                  eventsForDisplay.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      layout="poster"
                      href={`/events/${event.id}`}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-slate-500">
                    예정된 이벤트가 없습니다
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Latest Posts Section */}
          <Card>
            <CardContent className="pt-6">
              <PostsSection
                posts={transformedPosts}
                boardCategories={boardCategories || []}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
