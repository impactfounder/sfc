"use client"

import Link from "next/link"
import { Calendar, MapPin, Users, Share2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type EventCardData = {
  id: string
  title: string
  event_date: string
  location?: string | null
  thumbnail_url?: string | null
  current_participants?: number | null
  max_participants?: number | null
  event_type?: string | null
}

type EventPostCardProps = {
  event: EventCardData
  href?: string
  className?: string
}

export function EventPostCard({ event, href = `/events/${event.id}`, className }: EventPostCardProps) {
  const dateLabel = new Date(event.event_date).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const capacity = event.max_participants ? `${event.current_participants || 0} / ${event.max_participants}` : `${event.current_participants || 0}명`

  return (
    <Card className={cn("border border-indigo-100 shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-indigo-50/60 via-white to-white", className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          {event.thumbnail_url && (
            <div className="w-full sm:w-40 h-28 rounded-lg overflow-hidden border border-indigo-100 bg-white">
              <img src={event.thumbnail_url} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 text-[11px]">
                {event.event_type || "이벤트"}
              </Badge>
              <span className="text-xs text-slate-500">{dateLabel}</span>
            </div>
            <Link href={href} className="block group">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-2">
                {event.title}
              </h3>
            </Link>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              {event.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {event.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4 text-slate-400" />
                {capacity}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button variant="default" size="sm" asChild>
                <Link href={href}>참여하기</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 px-2 text-slate-500 hover:text-slate-700"
                onClick={() => {
                  if (typeof navigator !== "undefined") {
                    navigator.clipboard.writeText(`${window.location.origin}${href}`).catch(() => {})
                  }
                }}
              >
                <Share2 className="h-4 w-4" />
                <span className="text-xs">공유</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

