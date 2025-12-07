import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import EventCard from "@/components/ui/event-card"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { PageHeader } from "@/components/page-header"
import { EventsSection } from "@/components/home/events-section"
import { getEventShortUrl } from "@/lib/utils/event-url"
import { DashboardLayout } from "@/components/dashboard-layout"
import SidebarProfile from "@/components/sidebar-profile"
import { SiteHeader } from "@/components/site-header"

export default async function EventsPage() {
  const supabase = await createClient()

  // 오늘 날짜의 시작 시간을 계산 (시간대 문제 방지)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString();
  
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
      .gte("event_date", todayStart)
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
      .lt("event_date", todayStart)
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

  return (
    <DashboardLayout
      header={<SiteHeader />}
      sidebarProfile={<SidebarProfile />}
      rightSidebar={<StandardRightSidebar />}
    >
      <div className="w-full flex flex-col gap-10">
        <PageHeader
          title="이벤트"
          description="다양한 네트워킹, 클래스, 액티비티 이벤트에 참여하세요"
          compact={true}
          className="h-[130px]"
        />

        <EventsSection
          events={formattedUpcomingEvents}
          createLink="/e/new"
          isLoading={false}
          title="다가오는 이벤트"
          showFilters={true}
        />

        {pastEvents && pastEvents.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">지난 이벤트</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
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
    </DashboardLayout>
  )
}

