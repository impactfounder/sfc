import { redirect } from 'next/navigation'

export default async function EventsPage() {
  // /events를 /e로 리다이렉트
  redirect('/e')
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
        {/* PageHeader 적용 */}
        <PageHeader 
          title="이벤트"
          description="함께 성장하는 네트워킹 파티와 인사이트 세미나를 놓치지 마세요."
          compact={true}
        />

        {/* Upcoming Events (EventsSection으로 교체) */}
        <div className="mb-10">
          <EventsSection 
            events={formattedUpcomingEvents} 
            createLink={user ? "/events/new" : "/auth/login"}
            title="다가오는 이벤트"
          />
        </div>

          {/* Past Events */}
          {pastEvents && pastEvents.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-900">지난 이벤트</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {await Promise.all(pastEvents.map(async (event) => {
                   const shortCode = await getEventShortUrl(event.id, event.event_date, supabase)
                   const eventData = {
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
                  }
                  
                  return (
                    <div key={event.id} className="w-full opacity-60 hover:opacity-100 transition-opacity">
                      <EventCard 
                        event={eventData}
                        href={shortCode}
                        className="w-full h-full"
                      />
                    </div>
                  )
                }))}
              </div>
            </div>
          )}
        </div>

      {/* [RIGHT] 우측 사이드바 영역 */}
      <div className="hidden lg:block lg:col-span-3">
        <div className="sticky top-8 flex flex-col gap-6 h-fit">
          <StandardRightSidebar />
        </div>
      </div>
    </div>
  )
}
