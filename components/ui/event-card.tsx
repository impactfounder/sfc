"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { MapPin, User, Calendar } from "lucide-react"

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
  const [dateInfo, setDateInfo] = useState({ dateStr: '', weekdayStr: '', timeStr: '' })

  useEffect(() => {
    const dateObj = new Date(event.event_date)
    setDateInfo({
      dateStr: `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`,
      weekdayStr: dateObj.toLocaleDateString('ko-KR', { weekday: 'short' }),
      timeStr: dateObj.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true })
    })
  }, [event.event_date])

  const { dateStr, weekdayStr, timeStr } = dateInfo
  const current = event.current_participants || 0
  const max = event.max_participants || 0
  const isFull = max > 0 && current >= max

  const content = (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
        className
      )}
    >
      {/* 썸네일 이미지 (1:1 정사각형 비율) */}
      <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
        {event.thumbnail_url ? (
          <Image
            src={event.thumbnail_url}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover h-full w-full transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 flex items-center justify-center">
            <Calendar className="w-16 h-16 text-slate-400" />
          </div>
        )}

        {/* 카테고리 배지 */}
        {event.event_type && (
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-block px-3 py-1.5 rounded-full text-xs font-bold text-white bg-black/60 backdrop-blur-md shadow-sm">
              {event.event_type === 'networking' && '네트워킹'}
              {event.event_type === 'class' && '클래스'}
              {event.event_type === 'activity' && '액티비티'}
            </span>
          </div>
        )}

        {/* 인원 배지 */}
        <div className="absolute top-4 right-4 z-10">
          <span className={cn(
            "inline-block px-3 py-1.5 rounded-full text-xs font-bold text-white backdrop-blur-md shadow-sm",
            isFull ? "bg-red-500/90" : "bg-black/60"
          )}>
            {current}/{max || '∞'}
          </span>
        </div>
      </div>

      {/* 하단 콘텐츠 영역 */}
      <div className="p-5 flex flex-col">
        {/* 호스트 정보 (강조) */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="relative h-6 w-6 flex-shrink-0 rounded-full border border-slate-100 bg-slate-50 overflow-hidden">
            {event.host_avatar_url ? (
              <Image
                src={event.host_avatar_url}
                alt={event.host_name || "Host"}
                fill
                sizes="24px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
          <span className="font-semibold text-sm text-slate-700 truncate">{event.host_name || "호스트"}</span>
        </div>

        {/* 제목 */}
        <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug mb-3 line-clamp-2 min-h-[3.5rem]">
          {event.title}
        </h3>

        {/* 주요 정보 */}
        <div className="space-y-1.5 mb-1">
          <div className="flex items-center gap-2.5 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm font-medium">{dateStr} ({weekdayStr}) · {timeStr}</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm font-medium truncate">{event.location || "장소 미정"}</span>
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
