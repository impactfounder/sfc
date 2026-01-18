"use client"

import { useRef } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Autoplay } from "swiper/modules"
import type { Swiper as SwiperType } from "swiper"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReviewForDisplay } from "@/lib/types/reviews"

import "swiper/css"
import "swiper/css/navigation"

interface PhotoReviewsSectionProps {
  reviews: ReviewForDisplay[]
}

export function PhotoReviewsSection({ reviews }: PhotoReviewsSectionProps) {
  const swiperRef = useRef<SwiperType | null>(null)

  // 이미지가 있는 후기만 필터링
  const photoReviews = reviews.filter(r => r.images && r.images.length > 0)

  if (photoReviews.length === 0) {
    return null
  }

  return (
    <section className="w-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
          👀 생생한 현장 분위기
        </h2>
        <Link
          href="/reviews"
          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          전체 보기 →
        </Link>
      </div>

      {/* Swiper 컨테이너 */}
      <div className="relative group">
        {/* 네비게이션 버튼 (데스크탑) */}
        <button
          onClick={() => swiperRef.current?.slidePrev()}
          className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <button
          onClick={() => swiperRef.current?.slideNext()}
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>

        {/* Swiper */}
        <div className="-mx-4 px-4 md:mx-0 md:px-0">
          <Swiper
            modules={[Navigation, Autoplay]}
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            spaceBetween={12}
            slidesPerView={1.4}
            centeredSlides={false}
            autoplay={{
              delay: 4000,
              disableOnInteraction: true,
              pauseOnMouseEnter: true,
            }}
            breakpoints={{
              480: { slidesPerView: 1.8, spaceBetween: 12 },
              640: { slidesPerView: 2.2, spaceBetween: 14 },
              768: { slidesPerView: 2.8, spaceBetween: 16 },
              1024: { slidesPerView: 3.2, spaceBetween: 16 },
              1280: { slidesPerView: 4.2, spaceBetween: 16 },
            }}
            className="!pb-2"
          >
            {photoReviews.map((review) => (
              <SwiperSlide key={review.id}>
                <PhotoReviewCard review={review} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  )
}

function PhotoReviewCard({ review }: { review: ReviewForDisplay }) {
  const mainImage = review.images[0]

  return (
    <Link
      href={`/e/${review.event_id}`}
      className="block group relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* 메인 이미지 */}
      <Image
        src={mainImage}
        alt={review.one_liner}
        fill
        sizes="(max-width: 480px) 70vw, (max-width: 768px) 45vw, (max-width: 1024px) 30vw, 25vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* 하단 정보 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        {/* 이벤트 제목 */}
        <p className="text-xs font-medium opacity-80 mb-1 truncate">
          {review.events.title}
        </p>
        {/* 한줄평 */}
        <p className="text-sm font-bold line-clamp-2 leading-snug">
          "{review.one_liner}"
        </p>
        {/* 작성자 */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-6 h-6 rounded-full bg-white/20 overflow-hidden flex-shrink-0">
            {review.profiles?.avatar_url ? (
              <Image
                src={review.profiles.avatar_url}
                alt=""
                width={24}
                height={24}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-medium">
                {review.profiles?.full_name?.[0] || "?"}
              </div>
            )}
          </div>
          <span className="text-xs opacity-80 truncate">
            {review.profiles?.full_name || "익명"}
          </span>
        </div>
      </div>

      {/* 이미지 개수 뱃지 */}
      {review.images.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full text-white text-xs font-medium">
          +{review.images.length - 1}
        </div>
      )}

      {/* 베스트 뱃지 */}
      {review.is_best && (
        <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
          BEST
        </div>
      )}
    </Link>
  )
}
