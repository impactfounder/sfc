"use client"

import { useRef } from "react"
import EventCard, { EventCardEvent } from "@/components/ui/event-card"
import { Plus } from "lucide-react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation } from "swiper/modules"
import type { Swiper as SwiperType } from "swiper"
import { Skeleton } from "@/components/ui/skeleton" // 스켈레톤 컴포넌트 추가

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
  isLoading?: boolean // 로딩 상태 props 추가
}

export function EventsSection({ events, onCreateEvent, isLoading = false }: EventsSectionProps) {
  const swiperRef = useRef<SwiperType | null>(null)
  const hasEvents = events && events.length > 0

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between w-full mb-6">
        <h2 className="text-2xl md:text-[26px] font-bold text-gray-900">이벤트</h2>
        {onCreateEvent && (
          <button
            onClick={onCreateEvent}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-900 text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            새 이벤트
          </button>
        )}
      </div>

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
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
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
          {/* 모바일 Swiper */}
          <div className="md:hidden -mx-4 px-4">
            <Swiper
              modules={[Navigation]}
              onSwiper={(swiper) => (swiperRef.current = swiper)}
              spaceBetween={16}
              slidesPerView={1.2}
              centeredSlides={false}
              className="!pb-4"
            >
              {events.map((event) => (
                <SwiperSlide key={event.id}>
                  <EventCard event={event} href={`/events/${event.id}`} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* 데스크탑 Grid */}
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {events.map((event) => (
              <div key={event.id} className="w-full">
                <EventCard
                  event={event}
                  href={`/events/${event.id}`}
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