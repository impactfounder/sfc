import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users } from "lucide-react"
import Link from "next/link"

type Event = {
  id: string
  title: string
  description: string
  event_date: string
  max_participants?: number | null
  event_registrations?: { count: number }[] | null
}

interface EventsSectionProps {
  events: Event[]
}

export function EventsSection({ events }: EventsSectionProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            다가오는 이벤트
          </CardTitle>
          <Link href="/community/events">
            <Button variant="ghost" size="sm">
              전체보기
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {events && events.length > 0 ? (
            events.map((event) => {
              const registrationCount =
                event.event_registrations?.[0]?.count || 0
              const eventDate = new Date(event.event_date)

              return (
                <Link
                  key={event.id}
                  href={`/community/events/${event.id}`}
                  className="block"
                >
                  <div className="rounded-lg border border-slate-200 p-4 transition-shadow hover:shadow-md">
                    <h3 className="mb-2 font-semibold text-slate-900 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="mb-3 text-sm text-slate-600 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {eventDate.toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {registrationCount}
                        {event.max_participants &&
                          ` / ${event.max_participants}`}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })
          ) : (
            <p className="col-span-full py-8 text-center text-slate-500">
              예정된 이벤트가 없습니다
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}




