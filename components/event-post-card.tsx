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
    <Card className={cn("border-0 bg-white shadow-md shadow-slate-900/5 ring-1 ring-slate-900/[0.04] hover:shadow-xl hover:shadow-slate-900/10 hover:ring-slate-900/[0.08] transition-all duration-300", className)}>
      <div className="w-full aspect-[16/10] bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden rounded-t-xl">
        {event.thumbnail_url ? (
          <img
            src={event.thumbnail_url}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">이미지가 없습니다</div>
        )}
      </div>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-200 text-slate-700 bg-slate-50 text-[11px]">
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
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" asChild>
            <Link href={href}>참여하기</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 px-2 text-slate-500 hover:text-slate-700"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (typeof navigator !== "undefined") {
                navigator.clipboard.writeText(`${window.location.origin}${href}`).catch(() => {})
              }
            }}
          >
            <Share2 className="h-4 w-4" />
            <span className="text-xs">공유</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


