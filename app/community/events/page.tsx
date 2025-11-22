import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Plus } from "lucide-react"
import Link from "next/link"
import EventCard from "@/components/ui/event-card"

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

  // 메인 페이지와 동일한 버튼 스타일
  const buttonStyle = "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-900 text-sm font-semibold shadow-sm h-auto"

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="mx-auto max-w-6xl"> {/* 메인과 동일한 너비 적용 */}
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-[26px] font-bold text-gray-900">이벤트</h1> {/* 메인과 폰트 크기 통일 */}
            <p className="mt-2 text-slate-600">다가오는 커뮤니티 이벤트를 찾아보고 참여하세요</p>
          </div>
          {user ? (
            <Link href="/community/events/new">
              <button className={buttonStyle}>
                <Plus className="w-4 h-4" />
                새 이벤트
              </button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <button className={buttonStyle}>
                <Plus className="w-4 h-4" />
                로그인하고 이벤트 만들기
              </button>
            </Link>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">다가오는 이벤트</h2>
          {upcomingEvents && upcomingEvents.length > 0 ? (
            // 메인 페이지와 동일한 그리드 설정 (gap-5 lg:gap-6)
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
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
                      href={`/community/events/${event.id}`}
                      className="w-full h-full"
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                <h3 className="mb-2 text-lg font-semibold text-slate-900">예정된 이벤트가 없습니다</h3>
                <p className="mb-4 text-sm text-slate-600">첫 번째 이벤트를 만들어보세요</p>
                {user ? (
                  <Link href="/community/events/new">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
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
                      href={`/community/events/${event.id}`}
                      className="w-full h-full"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}