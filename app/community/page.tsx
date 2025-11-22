import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function CommunityDashboardPage() {
  const supabase = await createClient()

  const { data: allPosts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:author_id (full_name, avatar_url),
      board_categories (name, slug)
    `)
    .order("created_at", { ascending: false })
    .limit(50)

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

          <Card>
            <CardHeader>
              <CardTitle>이벤트</CardTitle>
            </CardHeader>
            <CardContent>
              <pre>{JSON.stringify(upcomingEvents, null, 2)}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>최신 글</CardTitle>
            </CardHeader>
            <CardContent>
              <pre>{JSON.stringify(allPosts, null, 2)}</pre>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
