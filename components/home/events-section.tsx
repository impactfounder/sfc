"use client"

import { useRef, useState, useMemo } from "react"
import EventCard, { EventCardEvent } from "@/components/ui/event-card"
import { Plus } from "lucide-react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation } from "swiper/modules"
import type { Swiper as SwiperType } from "swiper"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import Link from "next/link"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

import "swiper/css"
import "swiper/css/navigation"

type EventsSectionProps = {
  events: EventCardEvent[]
  onCreateEvent?: () => void
  createLink?: string
  isLoading?: boolean
  title?: string
  hideTitle?: boolean
}

export function EventsSection({ events, onCreateEvent, createLink, isLoading = false, title = "이벤트", hideTitle = false }: EventsSectionProps) {
  const swiperRef = useRef<SwiperType | null>(null)
  const [filter, setFilter] = useState<"all" | "networking" | "class" | "activity">("all")
  const hasEvents = events && events.length > 0

  // 필터링된 이벤트
  const filteredEvents = useMemo(() => {
    if (filter === "all") return events
    return events.filter(event => event.event_type === filter)
  }, [events, filter])

  return (
    <div className="w-full">
      {/* 헤더 */}
      {!hideTitle && (
        <div className="flex items-center justify-between w-full mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h2>
          {createLink ? (
            <Link href={createLink} className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-900 text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" />
              새 이벤트
            </Link>
          ) : onCreateEvent ? (
            <button
              onClick={onCreateEvent}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-900 text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              새 이벤트
            </button>
          ) : null}
        </div>
      )}

      {/* 필터 UI */}
      {hasEvents && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
          {[
            { value: "all", label: "전체" },
            { value: "networking", label: "네트워킹" },
            { value: "class", label: "클래스" },
            { value: "activity", label: "액티비티" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as typeof filter)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
                filter === option.value
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* 1. 로딩 중일 때: 스켈레톤 UI 표시 */}
      {isLoading ? (
        <>
          {/* 모바일 스켈레톤 */}
          <div className="md:hidden -mx-4 px-4">
            <div className="flex gap-4 overflow-hidden">
              {[1, 2].map((i) => (
                <div key={i} className="w-[85%] flex-shrink-0 aspect-[4/5] rounded-[20px] overflow-hidden">
                  <Skeleton className="w-full h-full" />
                </div>
              ))}
            </div>
          </div>
          {/* 데스크탑 스켈레톤 */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full aspect-[4/5] rounded-[20px] overflow-hidden">
              <Skeleton className="w-full h-full" />
            </div>
          ))}
        </div>
        </>
      ) : !hasEvents ? (
        /* 2. 로딩 끝났는데 데이터 없을 때: Empty UI 표시 */
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-10">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>아직 예정된 이벤트가 없어요</EmptyTitle>
              <EmptyDescription>
                첫 번째 이벤트를 만들어 커뮤니티를 시작해보세요.
              </EmptyDescription>
            </EmptyHeader>
            {onCreateEvent && (
              <EmptyContent>
                <button
                  onClick={onCreateEvent}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition font-medium"
                >
                  이벤트 만들기
                </button>
              </EmptyContent>
            )}
          </Empty>
        </div>
      ) : (
        /* 3. 데이터 있을 때: 실제 카드 표시 */
        <>
          {/* 모바일 레이아웃 */}
          <div className="md:hidden">
            {/* 처음 5개: 큰 카드형 Swiper */}
            {filteredEvents.length > 0 && (
              <div className="-mx-4 px-4">
                <Swiper
                  modules={[Navigation]}
                  onSwiper={(swiper) => (swiperRef.current = swiper)}
                  spaceBetween={16}
                  slidesPerView={1.2}
                  centeredSlides={false}
                  className="!pb-4"
                >
                  {filteredEvents.slice(0, 5).map((event) => (
                    <SwiperSlide key={event.id}>
                      <EventCard event={event} href={event.shortUrl || `/e/${event.id.substring(0, 6)}`} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}

            {/* 6개부터: 컴팩트한 리스트 레이아웃 */}
            {filteredEvents.length > 5 && (
              <div className="mt-6 space-y-3">
                {filteredEvents.slice(5).map((event) => {
                  const dateObj = new Date(event.event_date)
                  const dateStr = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`
                  const timeStr = dateObj.toLocaleTimeString('ko-KR', { 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                  })
                  const current = event.current_participants || 0
                  const max = event.max_participants || 0

                  return (
                    <Link 
                      key={event.id} 
                      href={event.shortUrl || `/e/${event.id.substring(0, 6)}`}
                      className="flex gap-3 bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      {/* 왼쪽: 썸네일 */}
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-900">
                        {event.thumbnail_url ? (
                          <img
                            src={event.thumbnail_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
                        )}
                        {/* 카테고리 뱃지 */}
                        {event.event_type && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white bg-black/60 backdrop-blur-sm">
                            {event.event_type === 'networking' && '네트워킹'}
                            {event.event_type === 'class' && '클래스'}
                            {event.event_type === 'activity' && '액티비티'}
                          </div>
                        )}
                      </div>

                      {/* 오른쪽: 정보 */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug mb-1">
                            {event.title}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {dateStr} {timeStr}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-slate-600 truncate">
                            📍 {event.location}
                          </p>
                          <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                            {current} / {max}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* 데스크탑 Grid */}
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="w-full">
                <EventCard
                  event={event}
                  href={event.shortUrl || `/e/${event.id.substring(0, 6)}`}
                  className="w-full h-full"
                />
              </div>
            ))}
          </div>

          {/* 모바일 버튼 */}
          {onCreateEvent && (
            <div className="md:hidden mt-6 flex justify-center">
              <button
                onClick={onCreateEvent}
                className="w-full py-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-900 font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                새 이벤트 만들기
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}