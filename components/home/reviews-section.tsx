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

import type { ReviewForDisplay } from "@/lib/types/posts"

type ReviewsSectionProps = {
  reviews: ReviewForDisplay[]
  isLoading?: boolean
}

// 로컬 ReviewCard 제거됨
import { ReviewCard } from "@/components/reviews/review-card"

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

          {/* 데스크탑/태블릿 Grid (2열 배치) */}
          <div className="hidden md:grid grid-cols-2 gap-5 lg:gap-6">
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

