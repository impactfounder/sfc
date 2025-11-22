import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { EventCard } from "@/components/ui/event-card"
import { AnnouncementBanner } from "./_components/announcement-banner"
import { EventsSectionHeader } from "./_components/events-section-header"
import { PostsSection } from "./_components/posts-section"

export default async function CommunityDashboardPage() {
  const supabase = await createClient()

  // Fetch announcement
  const { data: announcementData } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      board_categories!inner (slug)
    `)
    .eq("board_categories.slug", "announcement")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const announcement = announcementData || null

  // Fetch upcoming events
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select(`
      id,
      title,
      thumbnail_url,
      event_date,
      event_time,
      location,
      max_participants,
      event_registrations (count)
    `)
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(9)

  // Fetch all posts for filtering
  const { data: allPosts } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      created_at,
      profiles:author_id (full_name),
      board_categories (name, slug)
    `)
    .order("created_at", { ascending: false })
    .limit(50)

  // Fetch board categories for filter
  const { data: boardCategories } = await supabase
    .from("board_categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("order_index", { ascending: true })

  // Transform events data for EventCard
  const eventsForDisplay = (upcomingEvents || []).map((event) => ({
    id: event.id,
    title: event.title,
    thumbnail_url: event.thumbnail_url,
    event_date: event.event_date,
    event_time: event.event_time,
    location: event.location,
    max_participants: event.max_participants,
    current_participants: event.event_registrations?.[0]?.count || 0,
  }))

  return (
    <div className="min-h-screen bg-slate-50">
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
                      href={`/community/events/${event.id}`}
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
                posts={allPosts || []}
                boardCategories={boardCategories || []}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
