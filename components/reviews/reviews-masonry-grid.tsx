"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Camera, Star, Calendar, ChevronRight } from "lucide-react"
import type { ReviewForDisplay } from "@/lib/types/reviews"

type FilterType = "all" | "photo"
type SortType = "recent" | "popular"

interface ReviewsMasonryGridProps {
  initialReviews: ReviewForDisplay[]
}

export function ReviewsMasonryGrid({ initialReviews }: ReviewsMasonryGridProps) {
  const [filter, setFilter] = useState<FilterType>("all")
  const [sort, setSort] = useState<SortType>("recent")

  const filteredReviews = useMemo(() => {
    let result = [...initialReviews]

    // 필터 적용
    if (filter === "photo") {
      result = result.filter((r) => r.images && r.images.length > 0)
    }

    // 정렬 적용 (인기순은 rating 기준, 최신순은 created_at 기준)
    if (sort === "popular") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return result
  }, [initialReviews, filter, sort])

  return (
    <div className="space-y-6">
      {/* 필터 & 정렬 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 필터 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              filter === "all"
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            전체
          </button>
          <button
            onClick={() => setFilter("photo")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
              filter === "photo"
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Camera className="w-4 h-4" />
            포토 후기
          </button>
        </div>

        {/* 구분선 */}
        <div className="w-px h-6 bg-slate-200" />

        {/* 정렬 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={() => setSort("recent")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              sort === "recent"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            최신순
          </button>
          <button
            onClick={() => setSort("popular")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              sort === "popular"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            인기순
          </button>
        </div>

        {/* 결과 수 */}
        <span className="ml-auto text-sm text-slate-400">
          {filteredReviews.length}개의 후기
        </span>
      </div>

      {/* Masonry Grid */}
      {filteredReviews.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {filteredReviews.map((review) => (
            <MasonryCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-3xl">
            💬
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {filter === "photo" ? "포토 후기가 없습니다" : "후기가 없습니다"}
          </h3>
          <p className="text-slate-500">
            이벤트에 참여하고 첫 번째 후기를 남겨보세요!
          </p>
        </div>
      )}
    </div>
  )
}

function MasonryCard({ review }: { review: ReviewForDisplay }) {
  const hasImage = review.images && review.images.length > 0
  const firstImage = hasImage ? review.images![0] : null

  if (hasImage && firstImage) {
    return <PhotoMasonryCard review={review} imageUrl={firstImage} />
  }

  return <TextMasonryCard review={review} />
}

function PhotoMasonryCard({
  review,
  imageUrl,
}: {
  review: ReviewForDisplay
  imageUrl: string
}) {
  const authorName = review.profiles?.full_name || "익명"
  const authorAvatar = review.profiles?.avatar_url
  const eventTitle = review.events?.title || "이벤트"

  return (
    <Link
      href={`/events/${review.event_id}`}
      className="block break-inside-avoid mb-4 group"
    >
      <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm hover:shadow-lg transition-all">
        {/* 이미지 */}
        <div className="relative aspect-[4/5]">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* 그라데이션 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* 다중 이미지 표시 */}
          {review.images && review.images.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full">
              +{review.images.length - 1}
            </div>
          )}

          {/* 하단 컨텐츠 */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* 별점 */}
            {review.rating && (
              <div className="flex items-center gap-0.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3.5 h-3.5",
                      i < review.rating! ? "fill-yellow-400 text-yellow-400" : "text-white/30"
                    )}
                  />
                ))}
              </div>
            )}

            {/* 후기 내용 */}
            <p className="text-white text-sm line-clamp-3 mb-3">
              {review.one_liner || review.detail_content || ""}
            </p>

            {/* 작성자 정보 */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-white/20">
                {authorAvatar ? (
                  <Image
                    src={authorAvatar}
                    alt={authorName}
                    width={24}
                    height={24}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Image
                    src={`https://api.dicebear.com/9.x/notionists/svg?seed=${authorName}`}
                    alt={authorName}
                    width={24}
                    height={24}
                    className="object-cover w-full h-full"
                  />
                )}
              </div>
              <span className="text-white/90 text-xs font-medium">{authorName}</span>
            </div>
          </div>
        </div>

        {/* 이벤트 정보 (이미지 아래) */}
        <div className="p-3 bg-white border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            <span className="truncate flex-1">{eventTitle}</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function TextMasonryCard({ review }: { review: ReviewForDisplay }) {
  const authorName = review.profiles?.full_name || "익명"
  const authorAvatar = review.profiles?.avatar_url
  const eventTitle = review.events?.title || "이벤트"

  return (
    <Link
      href={`/events/${review.event_id}`}
      className="block break-inside-avoid mb-4 group"
    >
      <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all p-5">
        {/* 작성자 정보 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
            {authorAvatar ? (
              <Image
                src={authorAvatar}
                alt={authorName}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <Image
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${authorName}`}
                alt={authorName}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">{authorName}</p>
            <p className="text-xs text-slate-400">
              {new Date(review.created_at).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>

        {/* 별점 */}
        {review.rating && (
          <div className="flex items-center gap-0.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-4 h-4",
                  i < review.rating! ? "fill-yellow-400 text-yellow-400" : "text-slate-200"
                )}
              />
            ))}
          </div>
        )}

        {/* 후기 내용 */}
        <p className="text-slate-700 text-sm leading-relaxed mb-4">
          {review.one_liner || review.detail_content || ""}
        </p>

        {/* 이벤트 정보 */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <Calendar className="w-3 h-3" />
          <span className="truncate flex-1">{eventTitle}</span>
          <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>
      </div>
    </Link>
  )
}
