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
}

export default function EventCard({ event, href, className }: Props) {
  const dateObj = new Date(event.event_date)
  const dateStr = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`
  
  // 시간 포맷팅
  const timeStr = dateObj.toLocaleTimeString('ko-KR', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  })

  // 인원 계산
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

      {/* 그라데이션 오버레이 (가독성 강화) */}
      {/* 상단은 조금 더 진하게, 중간은 투명하게, 하단은 텍스트 보호를 위해 아주 진하게 처리 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent via-30% to-black/95" />

      {/* 콘텐츠 레이어 */}
      <div className="relative h-full flex flex-col justify-between p-5">
        
        {/* 상단: 제목 */}
        <div>
          <span className="inline-block px-2.5 py-0.5 mb-2 text-[10px] font-bold border border-white/40 rounded-full bg-black/30 backdrop-blur-md text-white shadow-sm">
            EVENT
          </span>
          <h3 className="text-xl font-bold text-white leading-snug break-keep drop-shadow-md">
            {event.title}
          </h3>
        </div>

        {/* 하단: 정보 영역 */}
        <div className="space-y-2.5">
          
          {/* 1. 프로필 (이름 : 소개) */}
          <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-1 text-xs sm:text-sm truncate drop-shadow-md">
              <span className="font-bold text-white">{event.host_name || "호스트"}</span>
              <span className="text-white/70 px-0.5">:</span>
              <span className="text-white/90 truncate max-w-[120px]">
                {event.host_bio || "SFC 멤버"}
              </span>
            </div>
          </div>

          {/* 2. 날짜 & 시간 (아이콘 추가) */}
          <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-white drop-shadow-md pl-0.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-white/90" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/90" />
              <span>{timeStr}</span>
            </div>
          </div>

          {/* 3. 장소 (좌측) / 인원 버튼 (우측 하단) */}
          <div className="flex items-end justify-between pt-0.5">
            {/* 장소 텍스트 크기 키움 (text-xs -> text-xs sm:text-sm) */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white drop-shadow-md truncate max-w-[60%] pb-1 pl-0.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-white/90" />
              <span className="truncate">{event.location || "장소 미정"}</span>
            </div>

            {/* 인원 배지 */}
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-md text-xs font-bold transition-colors shadow-sm",
              isFull 
                ? "bg-red-500/80 border border-red-400/50 text-white" 
                : "bg-white/15 border border-white/30 text-white hover:bg-white/25"
            )}>
              <Users className="w-3 h-3" />
              <span>
                {current}
                <span className="text-white/60 font-normal mx-0.5">/</span>
                {max}명
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )

  if (!href) return content

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  )
}