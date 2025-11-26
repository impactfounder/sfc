"use client"

import { useRef } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation } from "swiper/modules"
import type { Swiper as SwiperType } from "swiper"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { MessageSquare, Heart } from "lucide-react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

import "swiper/css"
import "swiper/css/navigation"

type ReviewForDisplay = {
  id: string
  title: string
  content?: string | null
  created_at: string
  likes_count?: number
  comments_count?: number
  profiles?: {
    id?: string
    full_name?: string | null
    avatar_url?: string | null
  } | null
  events?: {
    id?: string
    title?: string | null
    thumbnail_url?: string | null
  } | null
}

type ReviewsSectionProps = {
  reviews: ReviewForDisplay[]
  isLoading?: boolean
}

function ReviewCard({ review }: { review: ReviewForDisplay }) {
  const eventTitle = review.events?.title || "모임"
  const eventThumbnail = review.events?.thumbnail_url
  const authorName = review.profiles?.full_name || "익명"
  const authorAvatar = review.profiles?.avatar_url
  const contentPreview = review.content
    ? review.content.replace(/<[^>]*>/g, "").slice(0, 100) + "..."
    : "후기 내용이 없습니다."

  return (
    <Link
      href={`/community/board/reviews/${review.id}`}
      className="block h-full"
    >
      <div className="h-full bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-100/50 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col">
        {/* 상단: 이벤트 정보 */}
        {review.events && (
          <div className="flex items-center gap-2 mb-4">
            {eventThumbnail ? (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-amber-200/50 flex-shrink-0">
                <Image
                  src={eventThumbnail}
                  alt={eventTitle}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-amber-100/50 border border-amber-200/50 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🍷</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-900 truncate">
                {eventTitle} 후기
              </p>
            </div>
          </div>
        )}

        {/* 중단: 후기 내용 */}
        <div className="flex-1 mb-4">
          <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2">
            {review.title}
          </h3>
          <p className="text-sm text-slate-700 line-clamp-3 leading-relaxed">
            <span className="text-amber-600/70">"</span>
            {contentPreview}
            <span className="text-amber-600/70">"</span>
          </p>
        </div>

        {/* 하단: 작성자 정보 및 통계 */}
        <div className="flex items-center justify-between pt-4 border-t border-amber-200/50">
          <div className="flex items-center gap-2">
            {authorAvatar ? (
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-200/50">
                <Image
                  src={authorAvatar}
                  alt={authorName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-100/50 border border-amber-200/50 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-700">
                  {authorName[0] || "?"}
                </span>
              </div>
            )}
            <span className="text-xs font-medium text-slate-700">
              {authorName}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              <span>{review.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{review.comments_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function ReviewsSection({ reviews, isLoading = false }: ReviewsSectionProps) {
  const swiperRef = useRef<SwiperType | null>(null)
  const hasReviews = reviews && reviews.length > 0

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between w-full mb-6">
        <h2 className="text-3xl font-bold text-slate-900">후기 하이라이트</h2>
      </div>

      {/* 1. 로딩 중일 때: 스켈레톤 UI 표시 */}
      {isLoading ? (
        <div className="md:hidden -mx-4 px-4">
          <div className="flex gap-4 overflow-hidden">
            {[1, 2].map((i) => (
              <div key={i} className="w-[85%] flex-shrink-0">
                <Skeleton className="w-full h-[280px] rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      ) : !hasReviews ? (
        /* 2. 로딩 끝났는데 데이터 없을 때: Empty UI 표시 */
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-10">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>아직 후기가 없어요</EmptyTitle>
              <EmptyDescription>
                첫 번째 모임 후기를 작성해보세요.
              </EmptyDescription>
            </EmptyHeader>
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
              {reviews.map((review) => (
                <SwiperSlide key={review.id}>
                  <ReviewCard review={review} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* 태블릿 Swiper */}
          <div className="hidden md:block lg:hidden -mx-4 px-4">
            <Swiper
              modules={[Navigation]}
              onSwiper={(swiper) => (swiperRef.current = swiper)}
              spaceBetween={20}
              slidesPerView={2.5}
              centeredSlides={false}
              className="!pb-4"
            >
              {reviews.map((review) => (
                <SwiperSlide key={review.id}>
                  <ReviewCard review={review} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* 데스크탑 Grid */}
          <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="w-full">
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

