import { requireAdmin } from "@/lib/auth/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, MapPin, Users, User, Settings } from "lucide-react"
import { DeleteEventButton } from "@/components/delete-event-button"
import Image from "next/image"
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb"

export default async function AdminEventsPage() {
  const { supabase } = await requireAdmin()

  // Fetch all events
  const { data: events } = await supabase
    .from("events")
    .select(`
      id,
      title,
      thumbnail_url,
      event_date,
      location,
      max_participants,
      created_at,
      profiles:created_by (
        id,
        full_name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false })

  // Fetch registration counts for each event
  const eventsWithCounts = await Promise.all(
    (events || []).map(async (event) => {
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id)

      return {
        ...event,
        participantCount: count || 0,
      }
    })
  )

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="mx-auto max-w-7xl">
        <AdminBreadcrumb items={[{ label: "이벤트 관리" }]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">이벤트 관리</h1>
          <p className="mt-2 text-slate-600">전체 이벤트 목록 및 관리</p>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>이벤트 목록 ({eventsWithCounts.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            {eventsWithCounts.length > 0 ? (
              <div className="space-y-4">
                {eventsWithCounts.map((event) => {
                  const eventDate = new Date(event.event_date)
                  const dateStr = eventDate.toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })

                  const ownerName = (() => {
                    const profile: any = (event as any).profiles
                    const first = Array.isArray(profile) ? profile[0] : profile
                    return first?.full_name || "알 수 없음"
                  })()

                  return (
                    <div
                      key={event.id}
                      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 lg:flex-row lg:items-center"
                    >
                      {/* 썸네일 */}
                      <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 lg:h-24 lg:w-24">
                        {event.thumbnail_url ? (
                          <Image
                            src={event.thumbnail_url}
                            alt={event.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <Calendar className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* 이벤트 정보 */}
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{dateStr}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span>
                              {event.participantCount}
                              {event.max_participants ? ` / ${event.max_participants}명` : "명"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            <span>{ownerName}</span>
                          </div>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex gap-2 lg:flex-col">
                        <Link href={`/events/${event.id}/manage`}>
                          <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
                            <Settings className="mr-2 h-4 w-4" />
                            관리
                          </Button>
                        </Link>
                        <DeleteEventButton eventId={event.id} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">등록된 이벤트가 없습니다</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

