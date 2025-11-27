import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Plus } from "lucide-react"
import Link from "next/link"
import EventCard from "@/components/ui/event-card"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { PageHeader } from "@/components/page-header"

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

  const buttonStyle = "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-900 text-sm font-semibold shadow-sm h-auto"

  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 px-4 lg:px-8 pt-8 pb-20">
      {/* [LEFT] 중앙 콘텐츠 영역 (9칸) */}
      <div className="lg:col-span-9 flex flex-col gap-10 min-w-0">
        {/* PageHeader 적용 */}
        <PageHeader 
          title="이벤트"
          description="함께 성장하는 네트워킹 파티와 인사이트 세미나를 놓치지 마세요."
        >
          {user ? (
            <Link href="/events/new">
              <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-sm border-0">
                <Plus className="w-4 h-4 mr-2" />
                새 이벤트
              </Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-sm border-0">
                <Plus className="w-4 h-4 mr-2" />
                로그인하고 만들기
              </Button>
            </Link>
          )}
        </PageHeader>

          {/* Upcoming Events */}
          <div className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">다가오는 이벤트</h2>
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {upcomingEvents.map((event) => {
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
                      <div key={event.id} className="w-full">
                        <EventCard 
                          event={eventData} 
                          href={`/events/${event.id}`}
                          className="w-full h-full"
                        />
                      </div>
                    )
                  })}
              </div>
            </>
            ) : (
              <Card className="border-slate-200">
                <CardContent className="py-12 text-center">
                  <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">예정된 이벤트가 없습니다</h3>
                  <p className="mb-4 text-sm text-slate-600">첫 번째 이벤트를 만들어보세요</p>
                  {user ? (
                    <Link href="/events/new">
                      <button className={buttonStyle}>이벤트 만들기</button>
                    </Link>
                  ) : (
                    <Link href="/auth/login">
                      <button className={buttonStyle}>로그인하고 이벤트 만들기</button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Past Events */}
          {pastEvents && pastEvents.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-900">지난 이벤트</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {pastEvents.map((event) => {
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
                        href={`/events/${event.id}`}
                        className="w-full h-full"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* [RIGHT] 우측 사이드바 영역 (3칸) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
          <div className="sticky top-8 flex flex-col gap-6 h-fit">
            <StandardRightSidebar />
          </div>
        </div>
    </div>
  )
}
