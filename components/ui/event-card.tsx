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
        "group relative w-full aspect-[4/5] overflow-hidden rounded-[20px] bg-slate-900 shadow-md transition-all hover:shadow-xl hover:-translate-y-1",
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

      {/* 그라데이션 오버레이 (텍스트 가독성 확보) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent via-40% to-black/90" />

      {/* 콘텐츠 레이어 */}
      <div className="relative h-full flex flex-col justify-between p-5">
        
        {/* 상단: 제목 */}
        <div className="pt-1">
          <span className="inline-block px-2 py-0.5 mb-2 text-[10px] font-bold border border-white/30 rounded-full bg-black/20 backdrop-blur-sm text-white shadow-sm">
            EVENT
          </span>
          <h3 className="text-2xl font-bold text-white leading-tight break-keep drop-shadow-lg">
            {event.title}
          </h3>
        </div>

        {/* 하단: 정보 영역 (간격을 좁혀서 밀도 있게 배치) */}
        <div className="flex flex-col gap-1.5">
          
          {/* 1. 프로필 (크기 최적화 w-6 h-6) */}
          <div className="flex items-center gap-2 mb-1">
            <div className="relative h-6 w-6 flex-shrink-0 rounded-full border border-white/40 bg-white/10 overflow-hidden shadow-sm">
              {event.host_avatar_url ? (
                <Image
                  src={event.host_avatar_url}
                  alt={event.host_name || "Host"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-white/95 drop-shadow-md">
              <span className="font-bold">{event.host_name || "호스트"}</span>
              {event.host_bio && (
                <>
                  <span className="text-white/60 text-[10px] px-0.5">:</span>
                  <span className="text-white/80 truncate max-w-[120px] font-medium text-xs">
                    {event.host_bio}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 2. 날짜 & 시간 (아이콘 정렬) */}
          <div className="flex items-center gap-3 pl-0.5 text-xs sm:text-sm font-medium text-white/90 drop-shadow-md">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-white/70" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/70" />
              <span>{timeStr}</span>
            </div>
          </div>

          {/* 3. 장소 & 인원 버튼 (하단 라인 맞춤) */}
          <div className="flex items-center justify-between pl-0.5 mt-0.5">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/90 drop-shadow-md truncate max-w-[60%]">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-white/70" />
              <span className="truncate">{event.location || "장소 미정"}</span>
            </div>

            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md backdrop-blur-md text-[10px] sm:text-xs font-bold transition-colors shadow-sm",
              isFull 
                ? "bg-red-500/80 border border-red-400/50 text-white" 
                : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
            )}>
              <Users className="w-3 h-3" />
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