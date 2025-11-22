import { createClient } from "@/lib/supabase/server"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Dynamic imports with SSR disabled
const EventsSection = dynamic(
  () => import("./_components/events-section").then((mod) => ({ default: mod.EventsSection })),
  {
    ssr: false,
    loading: () => <EventsSectionSkeleton />,
  }
)

const LatestPostsSection = dynamic(
  () =>
    import("./_components/latest-posts-section").then((mod) => ({
      default: mod.LatestPostsSection,
    })),
  {
    ssr: false,
    loading: () => <LatestPostsSectionSkeleton />,
  }
)

function EventsSectionSkeleton() {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3 mb-3" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function LatestPostsSectionSkeleton() {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-16" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function CommunityDashboardPage() {
  const supabase = await createClient()

  // Fetch all posts for filtering (client-side)
  const { data: allPosts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:author_id (full_name, avatar_url),
      board_categories (name, slug)
    `)
    .order("created_at", { ascending: false })
    .limit(50)

  // Fetch upcoming events
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select(`
      *,
      profiles:created_by (full_name),
      event_registrations (count)
    `)
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(6)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="space-y-8">
          {/* Events Section */}
          <EventsSection events={upcomingEvents || []} />

          {/* Latest Posts Section */}
          <LatestPostsSection posts={allPosts || []} />
        </div>
      </div>
    </div>
  )
}
