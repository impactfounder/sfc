"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { MapPin, User, Users, Calendar, Clock } from "lucide-react"

export type EventCardEvent = {
  id: string
  title: string
  thumbnail_url?: string | null
  event_date: string
  event_time?: string | null
  location?: string | null
  current_participants?: number | null
  max_participants?: number | null
  host_name?: string | null
  host_avatar_url?: string | null
  host_bio?: string | null
  event_type?: 'networking' | 'class' | 'activity' | null
  shortUrl?: string
}

type Props = {
  event: EventCardEvent
  href?: string
  className?: string
  layout?: "card" | "poster"
}

export default function EventCard({ event, href, className, layout = "card" }: Props) {
  const dateObj = new Date(event.event_date)
  const dateStr = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`

  const timeStr = dateObj.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  const current = event.current_participants || 0
  const max = event.max_participants || 0
  const isFull = max > 0 && current >= max

  const content = (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        className
      )}
    >
      {/* 썸네일 이미지 - 정사각형 */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        {event.thumbnail_url ? (
          <Image
            src={event.thumbnail_url}
            alt={event.title}
            fill
            className="object-cover h-full w-full transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-slate-400" />
          </div>
        )}

        {/* 카테고리 배지 - 좌측 상단 */}
        {event.event_type && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-black/60 backdrop-blur-sm">
              {event.event_type === 'networking' && '네트워킹'}
              {event.event_type === 'class' && '클래스'}
              {event.event_type === 'activity' && '액티비티'}
            </span>
          </div>
        )}

        {/* 인원 배지 - 우측 상단 */}
        <div className="absolute top-3 right-3 z-10">
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm",
            isFull
              ? "bg-red-500 text-white"
              : "bg-black/60 text-white"
          )}>
            <Users className="w-3 h-3" />
            <span>{current}/{max || '∞'}</span>
          </div>
        </div>
      </div>

      {/* 하단 콘텐츠 영역 */}
      <div className="p-4">
        {/* 호스트 프로필 */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative h-6 w-6 flex-shrink-0 rounded-full border border-slate-200 bg-slate-100 overflow-hidden">
            {event.host_avatar_url ? (
              <Image
                src={event.host_avatar_url}
                alt={event.host_name || "Host"}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <User className="w-3 h-3" />
              </div>
            )}
          </div>
          <span className="font-medium text-xs text-slate-600 truncate">{event.host_name || "호스트"}</span>
        </div>

        {/* 제목 */}
        <h3 className="text-base font-bold text-slate-900 leading-snug mb-2 line-clamp-2">
          {event.title}
        </h3>

        {/* 날짜/시간 & 장소 */}
        <div className="flex flex-col gap-1 text-slate-500 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeStr}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{event.location || "장소 미정"}</span>
          </div>
        </div>
      </div>
    </div>
  )

  if (!href) return content

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  )
}
