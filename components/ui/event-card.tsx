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
        "group relative w-full aspect-[4/5] overflow-hidden rounded-[24px] bg-slate-900 shadow-md transition-all hover:shadow-xl hover:-translate-y-1",
        className
      )}
    >
      {/* 배경 이미지 */}
      {event.thumbnail_url ? (
        <Image
          src={event.thumbnail_url}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
      )}

      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent via-40% to-black/95" />

      {/* 콘텐츠 레이어 */}
      <div className="relative h-full flex flex-col justify-between p-6">
        
        {/* 상단: 제목 */}
        <div className="pt-1">
          <span className="inline-block px-2.5 py-1 mb-3 text-[11px] font-bold border border-white/30 rounded-full bg-black/20 backdrop-blur-md text-white shadow-sm">
            EVENT
          </span>
          <h3 className="text-2xl md:text-[28px] font-extrabold text-white leading-tight break-keep drop-shadow-lg shadow-black">
            {event.title}
          </h3>
        </div>

        {/* 하단: 정보 영역 (간격을 gap-1.5 로 좁혀서 밀착시킴) */}
        <div className="flex flex-col gap-1.5 pb-1"> 
          
          {/* 1. 프로필 라인 */}
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="relative h-8 w-8 flex-shrink-0 rounded-full border border-white/40 bg-white/10 overflow-hidden shadow-sm">
              {event.host_avatar_url ? (
                <Image
                  src={event.host_avatar_url}
                  alt={event.host_name || "Host"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-white drop-shadow-md">
              <span className="font-bold text-[15px]">{event.host_name || "호스트"}</span>
              {event.host_bio && (
                <div className="flex items-center gap-2 opacity-90">
                  <span className="w-0.5 h-3 bg-white/40 rounded-full"></span>
                  <span className="truncate max-w-[130px] font-medium text-[13px]">
                    {event.host_bio}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2. 날짜 & 시간 라인 */}
          <div className="flex items-center gap-3 pl-0.5 text-white/95 drop-shadow-md font-medium h-7">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-white/90" />
              <span className="text-[15px]">{dateStr}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/90" />
              <span className="text-[15px]">{timeStr}</span>
            </div>
          </div>

          {/* 3. 장소 & 인원 라인 */}
          <div className="flex items-center justify-between pl-0.5 h-7">
            <div className="flex items-center gap-2 text-white/95 drop-shadow-md truncate max-w-[60%]">
              <MapPin className="w-4 h-4 flex-shrink-0 text-white/90" />
              <span className="truncate text-[15px] font-medium">{event.location || "장소 미정"}</span>
            </div>

            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md text-[13px] font-bold transition-colors shadow-sm",
              isFull 
                ? "bg-red-500/90 border border-red-400/50 text-white" 
                : "bg-white/15 border border-white/30 text-white hover:bg-white/25"
            )}>
              <Users className="w-3.5 h-3.5" />
              <span>
                {current}/{max}
              </span>
            </div>
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