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
        "group relative w-full aspect-[3/4] overflow-hidden rounded-2xl bg-slate-900 border-0 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
        className
      )}
    >
      {/* 배경 이미지 - 카드 전체를 덮음 */}
      {event.thumbnail_url ? (
        <Image
          src={event.thumbnail_url}
          alt={event.title}
          fill
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />
      )}

      {/* 그라데이션 오버레이 - 하단 어둡게 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* 카테고리 배지 - 좌측 상단 */}
      {event.event_type && (
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-white/20 backdrop-blur-md border border-white/30">
            {event.event_type === 'networking' && '네트워킹'}
            {event.event_type === 'class' && '클래스'}
            {event.event_type === 'activity' && '액티비티'}
          </span>
        </div>
      )}

      {/* 인원 배지 - 우측 상단 */}
      <div className="absolute top-4 right-4 z-10">
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md",
          isFull
            ? "bg-red-500/90 text-white"
            : "bg-white/20 border border-white/30 text-white"
        )}>
          <Users className="w-3.5 h-3.5" />
          <span>{current}/{max || '∞'}</span>
        </div>
      </div>

      {/* 하단 콘텐츠 영역 */}
      <div className="absolute bottom-0 left-0 w-full p-5 z-10">
        {/* 호스트 프로필 */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="relative h-8 w-8 flex-shrink-0 rounded-full border-2 border-white/40 bg-white/10 overflow-hidden">
            {event.host_avatar_url ? (
              <Image
                src={event.host_avatar_url}
                alt={event.host_name || "Host"}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <span className="font-semibold text-sm">{event.host_name || "호스트"}</span>
            {event.host_bio && (
              <>
                <span className="w-px h-3 bg-white/40"></span>
                <span className="truncate max-w-[100px] text-xs text-slate-300">
                  {event.host_bio}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 제목 */}
        <h3 className="text-xl font-bold text-white leading-tight mb-3 line-clamp-2">
          {event.title}
        </h3>

        {/* 날짜/시간 & 장소 */}
        <div className="flex flex-col gap-1.5 text-slate-200 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-300" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-300" />
              <span>{timeStr}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-300 flex-shrink-0" />
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
