import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, MapPin, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardTitle } from "@/components/ui/card"

type Event = {
  id: string
  title: string
  thumbnail_url?: string | null
  event_date: string
  event_time?: string | null
  location?: string | null
  current_participants?: number | null
  max_participants?: number | null
}

type EventCardProps = {
  event: Event
  layout?: "poster" | "list" | "square"
  href?: string
  className?: string
}

const containerClass: Record<NonNullable<EventCardProps["layout"]>, string> = {
  poster: "gap-0 overflow-hidden p-0 shadow-xs hover:shadow-sm transition-shadow",
  square: "gap-3 overflow-hidden p-0 shadow-xs hover:shadow-sm transition-shadow",
  list: "flex-row items-center gap-3 p-3 hover:bg-accent/40 transition-colors",
}

const contentClass: Record<NonNullable<EventCardProps["layout"]>, string> = {
  poster: "space-y-3 px-4 pb-4 pt-3",
  square: "space-y-2 px-4 pb-5 pt-3",
  list: "space-y-1 px-0 flex-1",
}

export function EventCard({ event, layout = "poster", href, className }: EventCardProps) {
  const body = (
    <Card className={cn(containerClass[layout], className)}>
      <div
        className={cn(
          "relative w-full bg-gradient-to-br from-blue-500 to-purple-600",
          layout === "poster" && "aspect-[16/9]",
          layout === "square" && "aspect-square",
          layout === "list" && "size-16 rounded-lg flex-shrink-0"
        )}
      >
        {event.thumbnail_url ? (
          <Image
            src={event.thumbnail_url}
            alt={event.title}
            fill
            className={cn(
              "object-cover",
              layout === "list" && "rounded-lg"
            )}
            sizes="(max-width:768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">
            {event.title?.[0]}
          </div>
        )}
      </div>
      <CardContent className={contentClass[layout]}>
        <CardTitle className={cn("text-base", layout !== "list" && "text-lg")}>{event.title}</CardTitle>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="size-4" />
            <span>{new Date(event.event_date).toLocaleDateString("ko-KR")}</span>
          </div>
          {event.event_time && (
            <div className="flex items-center gap-2">
              <Clock className="size-4" />
              <span>{event.event_time}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {(event.current_participants || event.max_participants) && (
            <div className="flex items-center gap-2">
              <Users className="size-4" />
              <span>
                {event.current_participants || 0} / {event.max_participants ?? 0}명
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (!href) {
    return body
  }

  return (
    <Link href={href} className="block">
      {body}
    </Link>
  )
}

