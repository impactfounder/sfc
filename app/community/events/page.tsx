import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Users, Plus } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

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
          full_name
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
          full_name
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

  return (
    <div className="min-h-screen bg-slate-50 p-8 pt-20 md:pt-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">이벤트</h1>
            <p className="mt-2 text-slate-600">다가오는 커뮤니티 이벤트를 찾아보고 참여하세요</p>
          </div>
          {user ? (
            <Link href="/community/events/new">
              <Button className="gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white text-base">
                <Plus className="h-5 w-5" />
                이벤트 만들기
              </Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button className="gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white text-base">
                <Plus className="h-5 w-5" />
                로그인하고 이벤트 만들기
              </Button>
            </Link>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">다가오는 이벤트</h2>
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => {
                const registrationCount = event.event_registrations?.[0]?.count || 0
                const eventDate = new Date(event.event_date)
                const isFull = event.max_participants && registrationCount >= event.max_participants

                return (
                  <Link key={event.id} href={`/community/events/${event.id}`}>
                    <Card className="h-full overflow-hidden border-slate-200 transition-shadow hover:shadow-lg">
                      <div className="relative h-48 w-full bg-gradient-to-br from-blue-50 to-slate-100">
                        <img
                          src={
                            event.thumbnail_url ||
                            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop"
                          }
                          alt={event.title}
                          className="h-full w-full object-cover"
                        />
                        {isFull && <Badge className="absolute top-3 right-3 bg-red-500">마감</Badge>}
                      </div>

                      <CardContent className="p-0">
                        <div className="p-3">
                          <h3 className="mb-2 h-14 line-clamp-2 text-lg font-semibold text-slate-900">{event.title}</h3>

                          <div className="space-y-1 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {eventDate.toLocaleDateString("ko-KR", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>
                                {registrationCount}
                                {event.max_participants && ` / ${event.max_participants}`} 명
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
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
                    <Button>이벤트 만들기</Button>
                  </Link>
                ) : (
                  <Link href="/auth/login">
                    <Button>로그인하고 이벤트 만들기</Button>
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((event) => (
                <Link key={event.id} href={`/community/events/${event.id}`}>
                  <Card className="h-full border-slate-200 opacity-75 transition-all hover:opacity-100">
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(event.event_date).toLocaleDateString("ko-KR")}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
