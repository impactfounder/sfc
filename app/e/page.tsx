import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Plus } from "lucide-react"
import Link from "next/link"
import EventCard from "@/components/ui/event-card"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { PageHeader } from "@/components/page-header"
import { EventsSection } from "@/components/home/events-section"
import { getEventShortUrl } from "@/lib/utils/event-url"

export default async function EventsPage() {
  const supabase = await createClient()

  const [userResult, upcomingEventsResult, pastEventsResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
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
      .order("event_date", { ascending: true }),
    supabase
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
      .lt("event_date", new Date().toISOString())
      .order("event_date", { ascending: false })
      .limit(5),
  ])

  const user = userResult.data.user
  const upcomingEvents = upcomingEventsResult.data
  const pastEvents = pastEventsResult.data

  // 데이터 포맷팅 및 짧은 코드 계산
  const formattedUpcomingEvents = await Promise.all(
    (upcomingEvents || []).map(async (event) => {
      const shortCode = await getEventShortUrl(event.id, event.event_date, supabase)
      return {
        id: event.id,
        title: event.title,
        thumbnail_url: event.thumbnail_url,
        event_date: event.event_date,
        event_time: null,
        location: event.location,
        max_participants: event.max_participants,
        current_participants: event.event_registrations?.[0]?.count || 0,
        host_name: event.profiles?.full_name,
        host_avatar_url: event.profiles?.avatar_url,
        host_bio: event.profiles?.bio,
        event_type: event.event_type || 'networking',
        shortUrl: shortCode,
      }
    })
  )

  const buttonStyle = "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-900 text-sm font-semibold shadow-sm h-auto"

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* [LEFT] 메인 콘텐츠 영역 */}
      <div className="lg:col-span-9 flex flex-col gap-6">
        <PageHeader
          title="이벤트"
          description="다양한 네트워킹, 클래스, 액티비티 이벤트에 참여하세요"
          action={
            user ? (
              <Link href="/e/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  이벤트 만들기
                </Button>
              </Link>
            ) : null
          }
        />

        {/* 다가오는 이벤트 */}
        <EventsSection
          events={formattedUpcomingEvents}
          createLink="/e/new"
          isLoading={false}
          title="다가오는 이벤트"
        />

        {/* 지난 이벤트 */}
        {pastEvents && pastEvents.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">지난 이벤트</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastEvents.map(async (event) => {
                const shortCode = await getEventShortUrl(event.id, event.event_date, supabase)
                return (
                  <Link key={event.id} href={shortCode}>
                    <EventCard
                      event={{
                        id: event.id,
                        title: event.title,
                        thumbnail_url: event.thumbnail_url,
                        event_date: event.event_date,
                        event_time: null,
                        location: event.location,
                        max_participants: event.max_participants,
                        current_participants: event.event_registrations?.[0]?.count || 0,
                        host_name: event.profiles?.full_name,
                        host_avatar_url: event.profiles?.avatar_url,
                        host_bio: event.profiles?.bio,
                        event_type: event.event_type || 'networking',
                        shortUrl: shortCode,
                      }}
                    />
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* [RIGHT] 사이드바 */}
      <div className="hidden lg:block lg:col-span-3">
        <div className="sticky top-8 flex flex-col gap-6 h-fit">
          <StandardRightSidebar />
        </div>
      </div>
    </div>
  )
}

